import prisma from "../config/prisma";
import { getPaginationParams, buildPaginatedResult } from "../utils/pagination";
import { SearchInput } from "../models/search.model";
import { createLogger } from "../config/logger";
import env from "../config/env";
import {
    recordSearchedDocuments,
    getRecentlySearchedDocumentUuids,
    clearRecentSearchedDocuments,
} from "./searchCache.service";
import { cacheDel, cacheGetOrSet, cacheKey } from "./cache.service";

const RECENT_STATS_TTL_SECONDS = 60;

function recentStatsKey(userUuid: string) {
    return cacheKey("recent-stats", userUuid);
}

export async function invalidateRecentStatsCache(userUuid: string) {
    await cacheDel(recentStatsKey(userUuid));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveOwner(userId: string) {
    const owner = await prisma.user.findUnique({
        where: { uuid: userId },
        select: { id: true, uuid: true, organizationId: true },
    });
    if (!owner) {
        throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    return owner;
}

function serializeDoc(doc: Record<string, unknown>) {
    return {
        ...doc,
        id: doc.uuid,
        fileSizeBytes: doc.fileSizeBytes ? String(doc.fileSizeBytes) : null,
    };
}


// ── POST /search ──────────────────────────────────────────────────────────────
//
// Full-text search across the user's documents. Matches against the document
// title, original filename, metadata description snippet, and (when present)
// the OCR-extracted full text.
//
// The `queryType` field is recorded in search history for analytics. A
// dedicated "semantic" path (pgvector / embeddings) is not yet wired up, so
// all query types currently run the same keyword match — the type is stored
// as a hint so the path can switch here later without an API change.

export async function searchDocuments(input: SearchInput) {
    const logger = createLogger({
        context: "search-service",
        userId: input.userId,
        queryType: input.queryType ?? "basic",
    });

    const owner = await resolveOwner(input.userId);
    const { page, limit, skip } = getPaginationParams({
        page: input.page,
        limit: input.limit,
    });

    const query = input.query.trim();
    const filters = input.filters ?? {};

    const baseWhere: Record<string, unknown> = {
        organizationId: owner.organizationId,
        ownerUserId: owner.id,
        deletedAt: null,
        OR: [
            { title: { contains: query, mode: "insensitive" } },
            { originalFilename: { contains: query, mode: "insensitive" } },
            {
                ocrResult: {
                    extractedText: { contains: query, mode: "insensitive" },
                },
            },
        ],
    };

    if (filters.status) baseWhere.status = filters.status;
    if (filters.mimeType)
        baseWhere.mimeType = { startsWith: filters.mimeType };
    if (filters.folderId) {
        const folder = await prisma.folder.findFirst({
            where: {
                uuid: filters.folderId,
                organizationId: owner.organizationId,
            },
            select: { id: true },
        });
        baseWhere.folderId = folder?.id ?? null;
    }

    logger.info("Search execution started", {
        queryLength: query.length,
        page,
        limit,
    });

    const [documents, total] = await Promise.all([
        prisma.document.findMany({
            where: baseWhere,
            skip,
            take: limit,
            orderBy: { uploadedAt: "desc" },
        }),
        prisma.document.count({ where: baseWhere }),
    ]);

    // Record search in history (fire-and-forget — a history write failure
    // must never bubble up and break the user's search response).
    prisma.searchHistory
        .create({
            data: {
                organizationId: owner.organizationId,
                userId: owner.id,
                queryText: query,
                queryType: input.queryType ?? "basic",
                filtersJson: filters as never,
                resultCount: total,
            },
        })
        .catch((err) => {
            logger.warn("Search history persist failed", { err });
        });

    // Keep search-related Redis updates in one pipeline call: bust the
    // recent-activity stats cache and record surfaced document UUIDs.
    recordSearchedDocuments(
        input.userId,
        documents.map((d) => d.uuid),
        { deleteKeys: [recentStatsKey(input.userId)] },
    ).catch(() => {});

    logger.info("Search execution completed", { total });

    return {
        query,
        queryType: input.queryType ?? "basic",
        filters,
        ...buildPaginatedResult(
            documents.map((doc) =>
                serializeDoc(doc as unknown as Record<string, unknown>),
            ),
            total,
            page,
            limit,
        ),
    };
}

// ── GET /search/recent ────────────────────────────────────────────────────────
//
// Combines two streams, both windowed to env.RECENT_DAYS:
//   - recently created documents owned by the user (DB)
//   - recently searched documents surfaced to the user (Redis cache)
// Each document is deduped and tagged with the *latest* action — `latestSource`
// is whichever of "created" or "searched" happened more recently for that
// doc. `recentAt` is that latest timestamp; the list is sorted by `recentAt`
// descending.

export async function getRecentSearches(userId: string, limit = 20) {
    const owner = await resolveOwner(userId);
    const take = Math.min(100, Math.max(1, limit));

    const windowStart = new Date(
        Date.now() - env.RECENT_DAYS * 24 * 60 * 60 * 1000,
    );

    const [createdDocs, searchedEntries] = await Promise.all([
        prisma.document.findMany({
            where: {
                ownerUserId: owner.id,
                deletedAt: null,
                uploadedAt: { gte: windowStart },
            },
            orderBy: { uploadedAt: "desc" },
            take,
        }),
        getRecentlySearchedDocumentUuids(owner.uuid),
    ]);

    const searchedByUuid = new Map(
        searchedEntries.map((e) => [e.uuid, e.lastSearchedAt]),
    );

    const searchedUuids = searchedEntries
        .map((e) => e.uuid)
        .filter((uuid) => !createdDocs.some((d) => d.uuid === uuid));

    const searchedDocs = searchedUuids.length
        ? await prisma.document.findMany({
              where: {
                  uuid: { in: searchedUuids },
                  organizationId: owner.organizationId,
                  deletedAt: null,
              },
          })
        : [];

    type Entry = {
        doc: Record<string, unknown>;
        createdAt?: Date;
        searchedAt?: Date;
    };

    const byUuid = new Map<string, Entry>();

    for (const d of createdDocs) {
        byUuid.set(d.uuid, {
            doc: d as unknown as Record<string, unknown>,
            createdAt: d.uploadedAt,
            searchedAt: searchedByUuid.get(d.uuid),
        });
    }

    for (const d of searchedDocs) {
        const lastSearchedAt = searchedByUuid.get(d.uuid);
        const existing = byUuid.get(d.uuid);
        if (existing) {
            existing.searchedAt = lastSearchedAt;
        } else {
            byUuid.set(d.uuid, {
                doc: d as unknown as Record<string, unknown>,
                searchedAt: lastSearchedAt,
            });
        }
    }

    const merged = Array.from(byUuid.values())
        .map((e) => {
            const created = e.createdAt;
            const searched = e.searchedAt;
            const latestSource: "created" | "searched" =
                created && (!searched || created >= searched)
                    ? "created"
                    : "searched";
            const recentAt =
                latestSource === "created" ? created! : searched!;
            return {
                ...serializeDoc(e.doc),
                recentAt,
                latestSource,
            };
        })
        .sort((a, b) => b.recentAt.getTime() - a.recentAt.getTime())
        .slice(0, take);

    return {
        recentDays: env.RECENT_DAYS,
        windowStart,
        total: merged.length,
        items: merged,
    };
}

// ── GET /search/recent/stats ──────────────────────────────────────────────────
//
// Stat counters for the Recent Activities page, windowed to env.RECENT_DAYS:
//   - createdCount: documents the user uploaded in the window (excluding trashed)
//   - searchedCount: search queries the user ran in the window (search history)
//   - trashedCount: documents the user trashed in the window
// This is decoupled from the listing in /search/recent so the cards can be
// loaded independently and reflect totals (not just what fits in the listing).

export async function getRecentActivityStats(userId: string) {
    return cacheGetOrSet(recentStatsKey(userId), RECENT_STATS_TTL_SECONDS, async () => {
        const owner = await resolveOwner(userId);

        const windowStart = new Date(
            Date.now() - env.RECENT_DAYS * 24 * 60 * 60 * 1000,
        );

        const [createdCount, searchedCount, trashedCount] = await Promise.all([
            prisma.document.count({
                where: {
                    ownerUserId: owner.id,
                    deletedAt: null,
                    uploadedAt: { gte: windowStart },
                },
            }),
            prisma.searchHistory.count({
                where: {
                    userId: owner.id,
                    createdAt: { gte: windowStart },
                },
            }),
            prisma.document.count({
                where: {
                    ownerUserId: owner.id,
                    status: "TRASHED",
                    deletedAt: { gte: windowStart },
                },
            }),
        ]);

        return {
            recentDays: env.RECENT_DAYS,
            windowStart,
            createdCount,
            searchedCount,
            trashedCount,
        };
    });
}

// ── DELETE /search/recent ─────────────────────────────────────────────────────

export async function clearSearchHistory(userId: string) {
    const owner = await resolveOwner(userId);

    const [deletedHistory] = await Promise.all([
        prisma.searchHistory.deleteMany({ where: { userId: owner.id } }),
        clearRecentSearchedDocuments(owner.uuid).catch(() => 0),
    ]);

    await invalidateRecentStatsCache(userId);
    return { deleted: deletedHistory.count };
}
