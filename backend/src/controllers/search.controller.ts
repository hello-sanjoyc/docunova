import { FastifyRequest, FastifyReply } from "fastify";
import {
    searchDocuments,
    getRecentSearches,
    getRecentActivityStats,
    clearSearchHistory,
} from "../services/search.service";
import { successResponse } from "../utils/response";
import { SearchBody, RecentSearchesQuery } from "../models/search.model";
import { createLogger } from "../config/logger";

// ── POST /search ──────────────────────────────────────────────────────────────

export async function search(
    request: FastifyRequest<{ Body: SearchBody }>,
    reply: FastifyReply,
) {
    const logger = createLogger({
        context: "search-controller",
        requestId: request.id,
        userId: request.user.userId,
    });
    logger.info("Search requested", {
        queryType: request.body.queryType ?? "basic",
    });

    const result = await searchDocuments({
        userId: request.user.userId,
        ...request.body,
    });

    reply.send(successResponse("Search completed", result));
}

// ── GET /search/recent ────────────────────────────────────────────────────────

export async function recent(
    request: FastifyRequest<{ Querystring: RecentSearchesQuery }>,
    reply: FastifyReply,
) {
    const limit = Number(request.query.limit) || 20;
    const result = await getRecentSearches(request.user.userId, limit);
    reply.send(successResponse("Recent documents fetched", result));
}

// ── GET /search/recent/stats ──────────────────────────────────────────────────

export async function recentStats(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const result = await getRecentActivityStats(request.user.userId);
    reply.send(successResponse("Recent activity stats fetched", result));
}

// ── DELETE /search/recent ─────────────────────────────────────────────────────

export async function clearRecent(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const result = await clearSearchHistory(request.user.userId);
    reply.send(successResponse("Search history cleared", result));
}
