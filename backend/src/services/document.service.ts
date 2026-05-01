import { Readable } from "stream";
import prisma from "../config/prisma";
import { getPaginationParams, buildPaginatedResult } from "../utils/pagination";
import {
    UploadDocumentInput,
    UpdateDocumentInput,
    DocumentListQuery,
} from "../models/document.model";
import {
    uploadToStorage,
    downloadFromStorage,
    deleteFromStorage,
    objectExists,
    getPresignedDownloadUrl,
} from "./storage.service";
import { generatePdfThumbnail } from "./pdf.service";
import { enqueueAiSummarize } from "../queues/ai.queue";
import { enqueueOcr } from "../queues/ocr.queue";
import { createLogger } from "../config/logger";
import { invalidateRecentStatsCache } from "./search.service";
import {
    cacheDelByPattern,
    cacheGetOrSet,
    cacheKey,
} from "./cache.service";

const DOC_LIST_TTL_SECONDS = 30;

function docListQuerySig(kind: "all" | "trash", query: DocumentListQuery) {
    // Deterministic, compact signature of the filters that affect result set.
    // Order matters — keep fields alphabetical and stable across callers.
    return [
        kind,
        `p=${query.page ?? ""}`,
        `l=${query.limit ?? ""}`,
        `s=${query.status ?? ""}`,
        `m=${query.mimeType ?? ""}`,
        `f=${query.folderId ?? ""}`,
        `q=${query.search ?? ""}`,
        `sb=${query.sortBy ?? ""}`,
        `so=${query.sortOrder ?? ""}`,
    ].join("|");
}

function docListKey(userUuid: string, kind: "all" | "trash", query: DocumentListQuery) {
    return cacheKey("doc-list", userUuid, docListQuerySig(kind, query));
}

function docListPattern(userUuid: string) {
    return cacheKey("doc-list", userUuid, "*");
}

async function invalidateDocListCache(userUuid: string) {
    await cacheDelByPattern(docListPattern(userUuid));
}

export async function invalidateDocumentListCacheForUser(userUuid: string) {
    await invalidateDocListCache(userUuid);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveOwner(userId: string) {
    const owner = await prisma.user.findUnique({
        where: { uuid: userId },
        select: {
            id: true,
            uuid: true,
            organizationId: true,
            organization: { select: { uuid: true } },
        },
    });
    if (!owner) {
        throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    return owner;
}

async function findDocumentForUser(documentUuid: string, ownerId: bigint) {
    const doc = await prisma.document.findUnique({
        where: { uuid: documentUuid },
    });
    if (!doc || doc.deletedAt) {
        throw Object.assign(new Error("Document not found"), {
            statusCode: 404,
        });
    }
    if (doc.ownerUserId !== ownerId) {
        throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    }
    return doc;
}

async function normalizeReadyStatusFromSummary<
    T extends { id: bigint; status: string; updatedAt?: Date },
>(documents: T[]): Promise<T[]> {
    const candidates = documents.filter((doc) => doc.status !== "READY");
    if (candidates.length === 0) return documents;

    const summaries = await prisma.documentAiSummary.findMany({
        where: {
            documentId: { in: candidates.map((doc) => doc.id) },
            summaryType: "general",
        },
        select: { documentId: true },
        distinct: ["documentId"],
    });
    if (summaries.length === 0) return documents;

    const readyDocumentIds = new Set(
        summaries.map((summary) => summary.documentId.toString()),
    );

    const corrected = documents.map((doc) => {
        if (doc.status === "READY") return doc;
        if (!readyDocumentIds.has(doc.id.toString())) return doc;
        return {
            ...doc,
            status: "READY",
            ...(doc.updatedAt ? { updatedAt: new Date() } : {}),
        };
    });

    const idsToPersist = candidates
        .filter((doc) => readyDocumentIds.has(doc.id.toString()))
        .map((doc) => doc.id);

    if (idsToPersist.length > 0) {
        await prisma.document
            .updateMany({
                where: {
                    id: { in: idsToPersist },
                    status: { not: "READY" },
                },
                data: {
                    status: "READY",
                    updatedAt: new Date(),
                },
            })
            .catch(() => {});
    }

    return corrected;
}

function escapePdfText(value: string) {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/\r?\n/g, " ");
}

function textWidthApprox(value: string, fontSize: number) {
    return value.length * fontSize * 0.52;
}

function wrapTextByWidth(value: string, maxWidth: number, fontSize: number) {
    const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (words.length === 0) return [""];

    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (textWidthApprox(candidate, fontSize) <= maxWidth) {
            current = candidate;
        } else if (!current) {
            // If a single token is too long, hard-wrap by chars.
            let token = word;
            while (textWidthApprox(token, fontSize) > maxWidth && token.length > 1) {
                let sliceLength = Math.max(1, Math.floor(maxWidth / (fontSize * 0.52)));
                while (
                    sliceLength > 1 &&
                    textWidthApprox(token.slice(0, sliceLength), fontSize) > maxWidth
                ) {
                    sliceLength -= 1;
                }
                lines.push(token.slice(0, sliceLength));
                token = token.slice(sliceLength);
            }
            current = token;
        } else {
            lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function toRgb(value: [number, number, number]) {
    return value.map((n) => (n / 255).toFixed(3)).join(" ");
}

function summaryMetadataText(
    metadata: Record<string, unknown>,
    keys: string[],
): string | null {
    function formatValue(value: unknown): string {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number" && Number.isFinite(value)) return String(value);
        if (Array.isArray(value)) {
            return value.map(formatValue).filter(Boolean).join(" · ");
        }
        if (value && typeof value === "object") {
            return Object.entries(value as Record<string, unknown>)
                .map(([key, entryValue]) => {
                    const formatted = formatValue(entryValue);
                    return formatted ? `${key}: ${formatted}` : "";
                })
                .filter(Boolean)
                .join(" · ");
        }
        return "";
    }

    for (const key of keys) {
        const formatted = formatValue(metadata[key]);
        if (formatted) return formatted;
        if (Object.prototype.hasOwnProperty.call(metadata, key)) return null;
    }
    return null;
}

function buildStyledSummaryPdf(data: {
    filename: string;
    status: string;
    pageCount: number | null;
    processedText: string;
    parties: string | null;
    effectiveDate: string | null;
    obligations: string | null;
    indemnity: string | null;
    IP: string | null;
    confidentiality: string | null;
    payment: string | null;
    redFlags: string | null;
    actions: string | null;
    summary: string | null;
}) {
    const pageWidth = 595;
    const pageHeight = 842;
    const card = { x: 16, yTop: 14, w: 563, h: 814 };
    const headerH = 68;
    const footerH = 82;
    const rowLabelW = Math.round(card.w * 0.33);
    const rowValueW = card.w - rowLabelW;
    const rowPadX = 14;
    const rowPadY = 10;
    const labelFont = 10;
    const valueFont = 10.5;
    const lineH = 13.1;

    const colors = {
        border: [227, 221, 211] as [number, number, number],
        muted: [153, 143, 132] as [number, number, number],
        text: [42, 37, 32] as [number, number, number],
        red: [213, 90, 65] as [number, number, number],
        green: [79, 157, 121] as [number, number, number],
        redBg: [252, 243, 241] as [number, number, number],
        greenBg: [237, 246, 241] as [number, number, number],
        panelBg: [247, 245, 241] as [number, number, number],
    };

    type SummaryPdfRow = {
        label: string;
        value: string;
        tone: "normal" | "red" | "green";
    };

    const rows = [
        { label: "PARTIES", value: data.parties, tone: "normal" as const },
        {
            label: "EFFECTIVE DATE",
            value: data.effectiveDate,
            tone: "normal" as const,
        },
        { label: "OBLIGATIONS", value: data.obligations, tone: "normal" as const },
        { label: "INDEMNITY", value: data.indemnity, tone: "normal" as const },
        { label: "IP", value: data.IP, tone: "normal" as const },
        {
            label: "CONFIDENTIALITY",
            value: data.confidentiality,
            tone: "normal" as const,
        },
        { label: "PAYMENT", value: data.payment, tone: "normal" as const },
        { label: "RED FLAGS", value: data.redFlags, tone: "red" as const },
        { label: "ACTIONS", value: data.actions, tone: "green" as const },
        { label: "SUMMARY", value: data.summary, tone: "normal" as const },
    ].filter(
        (row): row is SummaryPdfRow =>
            typeof row.value === "string" && Boolean(row.value.trim()),
    );

    const valueMaxWidth = rowValueW - rowPadX * 2 - 2;
    const rowMetrics = rows.map((row) => {
        const lines = wrapTextByWidth(row.value, valueMaxWidth, valueFont);
        const minH = row.label === "SUMMARY" ? 138 : 46;
        const contentH = rowPadY * 2 + lines.length * lineH;
        return { ...row, lines, h: Math.max(minH, contentH) };
    });

    const usedRowsH = rowMetrics.reduce((sum, r) => sum + r.h, 0);
    const spacerH = Math.max(120, card.h - headerH - footerH - usedRowsH);

    const cmds: string[] = [];
    const toBottomY = (yTop: number, h = 0) => pageHeight - (yTop + h);

    const rect = (
        x: number,
        yTop: number,
        w: number,
        h: number,
        mode: "S" | "f" | "B" = "S",
    ) => {
        cmds.push(`${x} ${toBottomY(yTop, h)} ${w} ${h} re ${mode}`);
    };
    const roundedRectStroke = (
        x: number,
        yTop: number,
        w: number,
        h: number,
        r: number,
    ) => {
        const y = toBottomY(yTop, h);
        const k = 0.5522847498;
        const c = r * k;
        cmds.push(
            [
                `${x + r} ${y} m`,
                `${x + w - r} ${y} l`,
                `${x + w - r + c} ${y} ${x + w} ${y + r - c} ${x + w} ${y + r} c`,
                `${x + w} ${y + h - r} l`,
                `${x + w} ${y + h - r + c} ${x + w - r + c} ${y + h} ${x + w - r} ${y + h} c`,
                `${x + r} ${y + h} l`,
                `${x + r - c} ${y + h} ${x} ${y + h - r + c} ${x} ${y + h - r} c`,
                `${x} ${y + r} l`,
                `${x} ${y + r - c} ${x + r - c} ${y} ${x + r} ${y} c`,
                "S",
            ].join("\n"),
        );
    };

    const hLine = (x1: number, x2: number, yTop: number) => {
        const y = toBottomY(yTop);
        cmds.push(`${x1} ${y} m ${x2} ${y} l S`);
    };

    const text = (x: number, yTop: number, value: string, size: number) => {
        cmds.push(`BT /F1 ${size} Tf ${x} ${toBottomY(yTop)} Td (${escapePdfText(value)}) Tj ET`);
    };

    // Card background + border
    cmds.push(`${toRgb(colors.panelBg)} rg`);
    rect(card.x, card.yTop, card.w, card.h, "f");
    cmds.push("1 w");
    cmds.push(`${toRgb(colors.border)} RG`);
    roundedRectStroke(card.x, card.yTop, card.w, card.h, 16);

    // Header (title left aligned, no icon/status pill)
    cmds.push(`${toRgb(colors.text)} rg`);
    text(card.x + 16, card.yTop + 30, data.filename, 17.4);
    cmds.push(`${toRgb(colors.muted)} rg`);
    const meta = [
        data.pageCount ? `${data.pageCount} pages` : null,
        data.processedText || null,
    ]
        .filter(Boolean)
        .join(" · ");
    text(card.x + 16, card.yTop + 47, meta || "-", 9.6);

    cmds.push(`${toRgb(colors.border)} RG`);
    hLine(card.x, card.x + card.w, card.yTop + headerH);

    // Rows
    let cursorY = card.yTop + headerH;
    for (const row of rowMetrics) {
        if (row.tone === "red") {
            cmds.push(`${toRgb(colors.redBg)} rg`);
            rect(card.x, cursorY, card.w, row.h, "f");
            cmds.push(`${toRgb(colors.red)} rg`);
            rect(card.x, cursorY, 4, row.h, "f");
        } else if (row.tone === "green") {
            cmds.push(`${toRgb(colors.greenBg)} rg`);
            rect(card.x, cursorY, card.w, row.h, "f");
            cmds.push(`${toRgb(colors.green)} rg`);
            rect(card.x, cursorY, 4, row.h, "f");
        }

        const labelColor =
            row.tone === "red"
                ? colors.red
                : row.tone === "green"
                  ? colors.green
                  : colors.muted;
        cmds.push(`${toRgb(labelColor)} rg`);
        text(card.x + rowPadX, cursorY + 17, row.label, labelFont);

        cmds.push(`${toRgb(colors.text)} rg`);
        let lineY = cursorY + 16.8;
        for (const line of row.lines) {
            text(card.x + rowLabelW + rowPadX, lineY, line, valueFont);
            lineY += lineH;
        }

        cmds.push(`${toRgb(colors.border)} RG`);
        hLine(card.x, card.x + card.w, cursorY + row.h);
        cursorY += row.h;
    }

    // Spacer block
    cmds.push(`${toRgb(colors.panelBg)} rg`);
    rect(card.x, cursorY, card.w, spacerH, "f");
    cmds.push(`${toRgb(colors.border)} RG`);
    hLine(card.x, card.x + card.w, cursorY + spacerH);
    cursorY += spacerH;

    // Footer
    cmds.push(`${toRgb(colors.muted)} rg`);
    text(
        card.x + 16,
        cursorY + 60,
        "Generated via DocuNova AI (https://docunova.app)",
        10,
    );

    const contentStream = cmds.join("\n");
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
        `<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream`,
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ];

    const header = "%PDF-1.4\n";
    let body = "";
    const offsets = [0];
    // Track running offset to avoid O(n²) Buffer.byteLength recomputation on growing string.
    let runningOffset = Buffer.byteLength(header, "utf8");
    for (let i = 0; i < objects.length; i += 1) {
        offsets.push(runningOffset);
        const chunk = `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
        body += chunk;
        runningOffset += Buffer.byteLength(chunk, "utf8");
    }

    const xrefStart = runningOffset;
    let xref = `xref\n0 ${objects.length + 1}\n`;
    xref += "0000000000 65535 f \n";
    for (let i = 1; i < offsets.length; i += 1) {
        xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return Buffer.from(header + body + xref + trailer, "utf8");
}

function serializeDoc(doc: Record<string, unknown>) {
    return {
        ...doc,
        id: doc.uuid,
        fileSizeBytes: doc.fileSizeBytes ? String(doc.fileSizeBytes) : null,
    };
}

async function trackAccess(
    documentId: bigint,
    userId: bigint,
    accessType: string,
) {
    await prisma.documentAccessHistory.create({
        data: { documentId, userId, accessType },
    });
}

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadDocument(input: UploadDocumentInput) {
    const logger = createLogger({
        context: "document-upload-service",
        userId: input.userId,
        storageKeySeed: input.storageKey,
        mimeType: input.mimeType,
        originalFilename: input.originalFilename,
    });
    const startedAt = Date.now();
    logger.info("Document upload pipeline started");

    const owner = await resolveOwner(input.userId);
    logger.info("Owner resolved", {
        ownerId: owner.id.toString(),
        ownerUuid: owner.uuid,
        organizationId: owner.organizationId.toString(),
        organizationUuid: owner.organization.uuid,
    });

    // Object key: <orgUuid>/<userUuid>/<fileUuid>.<ext>
    const relativePath = `${owner.organization.uuid}/${owner.uuid}/${input.storageKey}${
        input.fileExtension ? "." + input.fileExtension : ""
    }`;
    logger.info("Storage path resolved", { relativePath });

    const { storageKey, fileSizeBytes } = await uploadToStorage(
        Readable.from(input.buffer),
        relativePath,
        input.mimeType,
    );
    logger.info("Primary file uploaded to object storage", {
        storageKey,
        fileSizeBytes,
        checksumSha256: input.checksumSha256,
    });

    // S3 object is now live — if anything below fails we must roll back all S3 objects
    const s3KeysToRollback: string[] = [storageKey];

    try {
        const isPdf = input.mimeType === "application/pdf";
        const isDocx =
            input.mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        const isImage =
            input.mimeType === "image/jpeg" || input.mimeType === "image/png";
        const shouldRunAiSummarization = isPdf || isDocx || isImage;
        const { pageCount, extractedText, needsOcr } = input;

        // PDF thumbnail (best-effort) — page count / text already extracted in middleware
        let thumbnailStorageKey: string | null = null;
        if (isPdf) {
            const thumbBuffer = await generatePdfThumbnail(input.buffer);
            if (thumbBuffer) {
                const thumbRelativePath = `${owner.organization.uuid}/${owner.uuid}/${input.storageKey}-thumb.jpg`;
                const thumbResult = await uploadToStorage(
                    Readable.from(thumbBuffer),
                    thumbRelativePath,
                    "image/jpeg",
                );
                thumbnailStorageKey = thumbResult.storageKey;
                s3KeysToRollback.push(thumbnailStorageKey);
                logger.info("PDF thumbnail upload completed", {
                    thumbnailStorageKey,
                });
            } else {
                logger.warn("PDF thumbnail generation skipped or failed");
            }
        }

        // ── Folder resolution ───────────────────────────────────────────────
        let folderId: bigint | null = null;
        if (input.folderId) {
            const folder = await prisma.folder.findFirst({
                where: {
                    uuid: input.folderId,
                    organizationId: owner.organizationId,
                },
                select: { id: true },
            });
            if (folder) folderId = folder.id;
            logger.info("Folder resolution completed", {
                requestedFolderId: input.folderId,
                resolvedFolderId: folderId?.toString() ?? null,
            });
        }

        // ── Build metadataJson ──────────────────────────────────────────────
        const metadataJson: Record<string, unknown> = {
            pageCount,
            classification: input.classification.label,
        };
        if (input.description) metadataJson.description = input.description;
        if (extractedText)
            metadataJson.textSnippet = extractedText.slice(0, 500);

        const title = input.title || input.originalFilename;
        const docStatus = shouldRunAiSummarization ? "PROCESSING" : "UPLOADED";
        logger.info("Document metadata prepared", {
            title,
            status: docStatus,
            hasDescription: Boolean(input.description),
            hasTextSnippet: Boolean(metadataJson.textSnippet),
            pageCount,
            classification: input.classification.label,
        });

        logger.info("Database transaction started", {
            stage: "document-version-persist",
        });
        const doc = await prisma.$transaction(async (tx) => {
            const created = await tx.document.create({
                data: {
                    organizationId: owner.organizationId,
                    ownerUserId: owner.id,
                    folderId,
                    title,
                    originalFilename: input.originalFilename,
                    storageKey,
                    mimeType: input.mimeType,
                    fileExtension: input.fileExtension || null,
                    fileSizeBytes: BigInt(fileSizeBytes),
                    checksumSha256: input.checksumSha256,
                    pageCount,
                    thumbnailStorageKey,
                    status: docStatus,
                    metadataJson: metadataJson as never,
                },
            });

            const version = await tx.documentVersion.create({
                data: {
                    documentId: created.id,
                    versionNumber: 1,
                    storageKey,
                    thumbnailStorageKey,
                    fileSizeBytes: BigInt(fileSizeBytes),
                    mimeType: input.mimeType,
                    checksumSha256: input.checksumSha256,
                    pageCount,
                    createdBy: owner.id,
                },
            });

            const updated = await tx.document.update({
                where: { id: created.id },
                data: { currentVersionId: version.id },
            });

            if (extractedText && !needsOcr) {
                await tx.documentOcrResult.create({
                    data: {
                        documentId: created.id,
                        extractedText,
                        pageTextJson: [],
                        ocrStatus: "COMPLETED",
                        ocrMethod: "native",
                    },
                });
            }

            await tx.documentClassification.create({
                data: {
                    documentId: created.id,
                    classLabel: input.classification.label,
                    confidenceScore: Math.min(input.classification.score, 100),
                    isPrimary: true,
                },
            });

            return updated;
        });
        logger.info("Database transaction completed", {
            documentUuid: doc.uuid,
            status: doc.status,
        });

        // The new upload bumps createdCount in recent-activity stats and
        // changes the paginated listings.
        invalidateRecentStatsCache(input.userId).catch(() => {});
        invalidateDocListCache(input.userId).catch(() => {});

        if (shouldRunAiSummarization) {
            if (needsOcr) {
                logger.info("Queuing OCR extraction (scanned document)", { documentUuid: doc.uuid });
                enqueueOcr(doc.uuid, input.userId, storageKey, input.fileExtension)
                    .then((jobId) => {
                        logger.info("OCR job queued", { documentUuid: doc.uuid, jobId });
                    })
                    .catch((err) => {
                        logger.error("OCR enqueue failed", { documentUuid: doc.uuid, err });
                    });
            } else {
                logger.info("Queuing AI summarization", { documentUuid: doc.uuid });
                enqueueAiSummarize(doc.uuid, input.userId)
                    .then((jobId) => {
                        logger.info("AI summarization job queued", {
                            documentUuid: doc.uuid,
                            jobId,
                        });
                    })
                    .catch((err) => {
                        logger.error("AI summarization enqueue failed", {
                            documentUuid: doc.uuid,
                            err,
                        });
                    });
            }
        }

        logger.info("Document upload pipeline completed", {
            documentUuid: doc.uuid,
            durationMs: Date.now() - startedAt,
        });
        return serializeDoc(doc as unknown as Record<string, unknown>);
    } catch (err) {
        logger.error("Document upload pipeline failed; rollback started", {
            rollbackKeys: s3KeysToRollback,
            err,
        });
        await Promise.all(
            s3KeysToRollback.map((k) => deleteFromStorage(k).catch(() => {})),
        );
        logger.warn("Rollback finished for uploaded storage objects", {
            rollbackCount: s3KeysToRollback.length,
        });
        throw err;
    }
}

// ── Get one ───────────────────────────────────────────────────────────────────

export async function getDocumentById(documentUuid: string, userId: string) {
    const owner = await resolveOwner(userId);
    const doc = await findDocumentForUser(documentUuid, owner.id);
    const [normalizedDoc] = await normalizeReadyStatusFromSummary([doc]);
    trackAccess(doc.id, owner.id, "view").catch(() => {});
    return serializeDoc(normalizedDoc as unknown as Record<string, unknown>);
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function getDocumentsByUser(
    userId: string,
    query: DocumentListQuery,
) {
    return cacheGetOrSet(
        docListKey(userId, "all", query),
        DOC_LIST_TTL_SECONDS,
        async () => {
            const owner = await resolveOwner(userId);
            const { page, limit, skip } = getPaginationParams(query);

            const where: Record<string, unknown> = {
                ownerUserId: owner.id,
                deletedAt: null,
            };

            if (query.status) where.status = query.status;
            if (query.folderId) {
                const folder = await prisma.folder.findFirst({
                    where: {
                        uuid: query.folderId,
                        organizationId: owner.organizationId,
                    },
                    select: { id: true },
                });
                where.folderId = folder?.id ?? null;
            }
            if (query.mimeType) where.mimeType = { startsWith: query.mimeType };
            if (query.search)
                where.title = { contains: query.search, mode: "insensitive" };

            const allowedSortFields = [
                "uploadedAt",
                "updatedAt",
                "title",
                "fileSizeBytes",
            ] as const;
            const sortBy = allowedSortFields.includes(
                query.sortBy as (typeof allowedSortFields)[number],
            )
                ? query.sortBy!
                : "uploadedAt";
            const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

            const [documents, total] = await Promise.all([
                prisma.document.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                }),
                prisma.document.count({ where }),
            ]);
            const normalizedDocuments =
                await normalizeReadyStatusFromSummary(documents);

            return buildPaginatedResult(
                normalizedDocuments.map((doc) =>
                    serializeDoc(doc as unknown as Record<string, unknown>),
                ),
                total,
                page,
                limit,
            );
        },
    );
}

// ── List trash ────────────────────────────────────────────────────────────────

export async function getTrashedDocumentsByUser(
    userId: string,
    query: DocumentListQuery,
) {
    return cacheGetOrSet(
        docListKey(userId, "trash", query),
        DOC_LIST_TTL_SECONDS,
        async () => {
            const owner = await resolveOwner(userId);
            const { page, limit, skip } = getPaginationParams(query);

            const where: Record<string, unknown> = {
                ownerUserId: owner.id,
                deletedAt: { not: null },
                status: "TRASHED",
            };

            if (query.folderId) {
                const folder = await prisma.folder.findFirst({
                    where: {
                        uuid: query.folderId,
                        organizationId: owner.organizationId,
                    },
                    select: { id: true },
                });
                where.folderId = folder?.id ?? null;
            }
            if (query.mimeType) where.mimeType = { startsWith: query.mimeType };
            if (query.search)
                where.title = { contains: query.search, mode: "insensitive" };

            const allowedSortFields = [
                "uploadedAt",
                "updatedAt",
                "title",
                "fileSizeBytes",
            ] as const;
            const sortBy = allowedSortFields.includes(
                query.sortBy as (typeof allowedSortFields)[number],
            )
                ? query.sortBy!
                : "updatedAt";
            const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

            const [documents, total] = await Promise.all([
                prisma.document.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                }),
                prisma.document.count({ where }),
            ]);

            return buildPaginatedResult(
                documents.map((doc) =>
                    serializeDoc(doc as unknown as Record<string, unknown>),
                ),
                total,
                page,
                limit,
            );
        },
    );
}

// ── Update metadata ───────────────────────────────────────────────────────────

export async function updateDocument(input: UpdateDocumentInput) {
    const owner = await resolveOwner(input.userId);
    const doc = await findDocumentForUser(input.documentId, owner.id);

    const data: Record<string, unknown> = { updatedAt: new Date() };

    if (input.title !== undefined) data.title = input.title;
    if (input.status !== undefined) data.status = input.status.toUpperCase();

    if (input.description !== undefined) {
        const existing = (doc.metadataJson as Record<string, unknown>) ?? {};
        data.metadataJson = { ...existing, description: input.description };
    }

    if ("folderId" in input) {
        if (input.folderId === null || input.folderId === undefined) {
            data.folderId = null;
        } else {
            const folder = await prisma.folder.findFirst({
                where: {
                    uuid: input.folderId,
                    organizationId: owner.organizationId,
                },
                select: { id: true },
            });
            if (!folder)
                throw Object.assign(new Error("Folder not found"), {
                    statusCode: 404,
                });
            data.folderId = folder.id;
        }
    }

    const updated = await prisma.document.update({
        where: { id: doc.id },
        data,
    });

    // Title/status/folder changes alter what appears in the paginated listings.
    invalidateDocListCache(input.userId).catch(() => {});

    return serializeDoc(updated as unknown as Record<string, unknown>);
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteDocument(documentUuid: string, userId: string) {
    const owner = await resolveOwner(userId);
    const doc = await findDocumentForUser(documentUuid, owner.id);

    await prisma.document.update({
        where: { id: doc.id },
        data: { deletedAt: new Date(), deletedBy: owner.id, status: "TRASHED" },
    });

    // Shifts createdCount ↓ and trashedCount ↑ in recent-activity stats and
    // moves the doc from the main listing into the trash listing.
    invalidateRecentStatsCache(userId).catch(() => {});
    invalidateDocListCache(userId).catch(() => {});

    // Best-effort: remove from object storage
    //deleteFromStorage(doc.storageKey).catch(() => {});
}

// ── Restore from trash ────────────────────────────────────────────────────────

export async function restoreDocument(documentUuid: string, userId: string) {
    const owner = await resolveOwner(userId);
    const doc = await prisma.document.findUnique({
        where: { uuid: documentUuid },
    });

    if (!doc || !doc.deletedAt) {
        throw Object.assign(new Error("Document not found in trash"), {
            statusCode: 404,
        });
    }
    if (doc.ownerUserId !== owner.id) {
        throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    }

    const existingSummary = await prisma.documentAiSummary.findFirst({
        where: {
            documentId: doc.id,
            summaryType: "general",
        },
        select: { id: true },
    });
    const restoredStatus = existingSummary ? "READY" : "UPLOADED";

    const updated = await prisma.document.update({
        where: { id: doc.id },
        data: {
            deletedAt: null,
            deletedBy: null,
            status: restoredStatus,
            updatedAt: new Date(),
        },
    });

    // Shifts createdCount ↑ and trashedCount ↓ in recent-activity stats and
    // moves the doc from the trash listing back into the main listing.
    invalidateRecentStatsCache(userId).catch(() => {});
    invalidateDocListCache(userId).catch(() => {});

    return serializeDoc(updated as unknown as Record<string, unknown>);
}

// ── Shared summary view data ──────────────────────────────────────────────────

export interface SummaryViewData {
    filename: string;
    status: string;
    pageCount: number | null;
    processedText: string;
    parties: string | null;
    effectiveDate: string | null;
    obligations: string | null;
    indemnity: string | null;
    IP: string | null;
    confidentiality: string | null;
    payment: string | null;
    redFlags: string | null;
    actions: string | null;
    summary: string | null;
}

export async function getSummaryPdf(
    documentUuid: string,
    userId?: string,
): Promise<{ buffer: Buffer; filename: string }> {
    const summary = await getSummaryViewData(documentUuid, userId);
    const buffer = buildStyledSummaryPdf(summary);
    const baseName = (summary.filename || "document")
        .replace(/\.[^/.]+$/, "")
        .replace(/[^\w.-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    const filename = `${baseName || "document"}-summary.pdf`;

    return { buffer, filename };
}

export async function getSummaryViewData(
    documentUuid: string,
    userId?: string,
): Promise<SummaryViewData> {
    const doc = userId
        ? await (async () => {
              const owner = await resolveOwner(userId);
              return findDocumentForUser(documentUuid, owner.id);
          })()
        : await prisma.document.findFirst({
              where: {
                  uuid: documentUuid,
                  deletedAt: null,
              },
          });

    if (!doc) {
        throw Object.assign(new Error("Document not found"), {
            statusCode: 404,
        });
    }
    const metadata = (doc.metadataJson ?? {}) as Record<string, unknown>;

    const title = doc.originalFilename || doc.title || "Document";
    const pageCountRaw =
        typeof metadata.pageCount === "number"
            ? metadata.pageCount
            : typeof doc.pageCount === "number"
              ? doc.pageCount
              : null;
    const pageCount =
        pageCountRaw && Number.isFinite(pageCountRaw)
            ? Math.max(1, Math.round(pageCountRaw))
            : null;
    const processedText =
        doc.status === "READY"
            ? `Processed in ${Math.max(
                  1,
                  Math.round(
                      (doc.updatedAt.getTime() - doc.uploadedAt.getTime()) / 1000,
                  ),
              )}s`
            : doc.status;

    return {
        filename: title,
        status: doc.status,
        pageCount,
        processedText,
        parties: summaryMetadataText(metadata, ["parties", "partyNames"]),
        effectiveDate: summaryMetadataText(metadata, [
            "effectiveDate",
            "dateRange",
            "term",
        ]),
        obligations: summaryMetadataText(metadata, ["obligations", "keyObligations"]),
        indemnity: summaryMetadataText(metadata, ["indemnity"]),
        IP: summaryMetadataText(metadata, ["IP", "ip"]),
        confidentiality: summaryMetadataText(metadata, ["confidentiality"]),
        payment: summaryMetadataText(metadata, ["payment", "paymentTerms"]),
        redFlags: summaryMetadataText(metadata, ["redFlags", "riskFlags", "risks"]),
        actions: summaryMetadataText(metadata, [
            "actions",
            "recommendedActions",
            "nextActions",
        ]),
        summary: summaryMetadataText(metadata, [
            "summary",
            "aiSummary",
            "textSnippet",
            "textPreview",
        ]),
    };
}

// ── Download (proxy stream) ───────────────────────────────────────────────────

export interface FileStreamResult {
    stream: Readable;
    filename: string;
    mimeType: string;
    contentLength?: number;
}

export async function getDocumentForDownload(
    documentUuid: string,
    userId: string,
): Promise<FileStreamResult> {
    const owner = await resolveOwner(userId);
    const doc = await findDocumentForUser(documentUuid, owner.id);

    const { stream, contentLength } = await downloadFromStorage(doc.storageKey);
    trackAccess(doc.id, owner.id, "download").catch(() => {});

    return {
        stream,
        filename: doc.originalFilename,
        mimeType: doc.mimeType,
        contentLength,
    };
}

// ── Presigned download URL ────────────────────────────────────────────────────

export async function getDocumentPresignedUrl(
    documentUuid: string,
    userId: string,
    expiresInSeconds = 3600,
): Promise<string> {
    const owner = await resolveOwner(userId);
    const doc = await findDocumentForUser(documentUuid, owner.id);

    trackAccess(doc.id, owner.id, "presigned_url").catch(() => {});
    return getPresignedDownloadUrl(doc.storageKey, expiresInSeconds);
}

// ── Preview / thumbnail ───────────────────────────────────────────────────────

export async function getDocumentForPreview(
    documentUuid: string,
    userId: string,
): Promise<FileStreamResult> {
    const owner = await resolveOwner(userId);
    const doc = await findDocumentForUser(documentUuid, owner.id);

    const storageKey =
        doc.thumbnailStorageKey ?? doc.previewStorageKey ?? doc.storageKey;

    if (!(await objectExists(storageKey))) {
        throw Object.assign(new Error("Preview not available"), {
            statusCode: 404,
        });
    }

    const { stream, contentLength } = await downloadFromStorage(storageKey);

    const mimeType =
        doc.thumbnailStorageKey || doc.previewStorageKey
            ? "image/jpeg"
            : doc.mimeType;

    trackAccess(doc.id, owner.id, "preview").catch(() => {});

    return { stream, filename: doc.originalFilename, mimeType, contentLength };
}
