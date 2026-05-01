import { FastifyRequest, FastifyReply } from "fastify";
import {
    uploadDocument,
    getDocumentById,
    getDocumentsByUser,
    getTrashedDocumentsByUser,
    updateDocument,
    deleteDocument,
    restoreDocument,
    getDocumentForDownload,
    getDocumentForPreview,
    getDocumentPresignedUrl,
    getSummaryPdf,
} from "../services/document.service";
import { successResponse } from "../utils/response";
import {
    DocumentIdParams,
    DocumentListQuery,
    UpdateDocumentBody,
} from "../models/document.model";
import { checkUsage, recordUsage } from "../services/usage.service";
import crypto from "crypto";
import { createLogger } from "../config/logger";

// ── POST /documents — multipart file upload ───────────────────────────────────

export async function upload(request: FastifyRequest, reply: FastifyReply) {
    const logger = createLogger({
        context: "document-upload-controller",
        requestId: request.id,
        userId: request.user.userId,
    });

    // Validated by validateDocumentUpload preHandler middleware
    const validated = request.documentUpload!;
    const uniqueKey = crypto.randomUUID();

    logger.info("Upload request accepted after validation", {
        filename: validated.filename,
        extension: validated.extension,
        mimeType: validated.mimeType,
        pageCount: validated.pageCount,
        checksumSha256: validated.checksumSha256,
        classification: validated.classification.label,
    });

    const usageCheck = await checkUsage(request.user.userId, {
        page_count: validated.pageCount,
        ocr_page_count: validated.needsOcr ? validated.pageCount : 0,
    });
    if (!usageCheck.allowed) {
        reply.status(403).send({
            statusCode: 403,
            success: false,
            message: usageCheck.reason ?? "Upload exceeds current plan usage.",
            data: usageCheck,
        });
        return;
    }
    const planSlug = usageCheck.planLimit.planSlug;
    const isPdf = validated.extension === "pdf";
    const isDocx = validated.extension === "docx";
    if (planSlug === "starter" && !isPdf) {
        reply.status(403).send({
            statusCode: 403,
            success: false,
            message: "Starter supports PDF uploads only.",
            data: usageCheck,
        });
        return;
    }
    if (planSlug !== "starter" && !isPdf && !isDocx) {
        reply.status(403).send({
            statusCode: 403,
            success: false,
            message: "This plan supports PDF and DOCX uploads only.",
            data: usageCheck,
        });
        return;
    }

    const doc = await uploadDocument({
        userId: request.user.userId,
        originalFilename: validated.filename,
        storageKey: uniqueKey,
        mimeType: validated.mimeType,
        fileExtension: validated.extension,
        fileSizeBytes: validated.fileSizeBytes,
        checksumSha256: validated.checksumSha256,
        buffer: validated.buffer,
        pageCount: validated.pageCount,
        extractedText: validated.extractedText,
        needsOcr: validated.needsOcr,
        classification: validated.classification,
        title: validated.fields.title,
        description: validated.fields.description,
        folderId: validated.fields.folderId,
    });

    await recordUsage(request.user.userId, {
        document_id: String(doc.id),
        pages_used: validated.pageCount,
        ocr_pages_used: validated.needsOcr ? validated.pageCount : 0,
    });

    logger.info("Upload request completed", {
        documentId: doc.id,
    });

    reply.status(201).send(successResponse("Document uploaded", doc, 201));
}

// ── GET /documents ────────────────────────────────────────────────────────────

export async function list(
    request: FastifyRequest<{ Querystring: DocumentListQuery }>,
    reply: FastifyReply,
) {
    const result = await getDocumentsByUser(request.user.userId, request.query);
    reply.send(successResponse("Documents fetched", result));
}

// ── GET /documents/trash ──────────────────────────────────────────────────────

export async function listTrash(
    request: FastifyRequest<{ Querystring: DocumentListQuery }>,
    reply: FastifyReply,
) {
    const result = await getTrashedDocumentsByUser(
        request.user.userId,
        request.query,
    );
    reply.send(successResponse("Trash documents fetched", result));
}

// ── GET /documents/:id ────────────────────────────────────────────────────────

export async function getOne(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    const doc = await getDocumentById(request.params.id, request.user.userId);
    reply.send(successResponse("Document fetched", doc));
}

// ── PATCH /documents/:id ──────────────────────────────────────────────────────

export async function update(
    request: FastifyRequest<{
        Params: DocumentIdParams;
        Body: UpdateDocumentBody;
    }>,
    reply: FastifyReply,
) {
    const doc = await updateDocument({
        userId: request.user.userId,
        documentId: request.params.id,
        ...request.body,
    });
    reply.send(successResponse("Document updated", doc));
}

// ── DELETE /documents/:id ─────────────────────────────────────────────────────

export async function remove(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    await deleteDocument(request.params.id, request.user.userId);
    reply.send(successResponse("Document deleted"));
}

// ── POST /documents/:id/restore ──────────────────────────────────────────────

export async function restore(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    const doc = await restoreDocument(request.params.id, request.user.userId);
    reply.send(successResponse("Document restored", doc));
}

// ── GET /documents/:id/download — proxy stream from S3 ───────────────────────

export async function download(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    const file = await getDocumentForDownload(
        request.params.id,
        request.user.userId,
    );

    reply
        .header("Content-Type", file.mimeType)
        .header(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(file.filename)}"`,
        );

    if (file.contentLength !== undefined) {
        reply.header("Content-Length", file.contentLength);
    }

    return reply.send(file.stream);
}

// ── GET /documents/:id/presigned — short-lived direct download URL ────────────

export async function presignedUrl(
    request: FastifyRequest<{
        Params: DocumentIdParams;
        Querystring: { expiresIn?: number };
    }>,
    reply: FastifyReply,
) {
    const expiresIn = Number(request.query.expiresIn) || 3600;
    const url = await getDocumentPresignedUrl(
        request.params.id,
        request.user.userId,
        expiresIn,
    );
    reply.send(successResponse("Presigned URL generated", { url, expiresIn }));
}

// ── GET /documents/:id/preview ────────────────────────────────────────────────

export async function preview(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    const file = await getDocumentForPreview(
        request.params.id,
        request.user.userId,
    );

    reply
        .header("Content-Type", file.mimeType)
        .header(
            "Content-Disposition",
            `inline; filename="${encodeURIComponent(file.filename)}"`,
        );

    if (file.contentLength !== undefined) {
        reply.header("Content-Length", file.contentLength);
    }

    return reply.send(file.stream);
}

// ── GET /documents/summary/:id — dynamic summary PDF ─────────────────────────

export async function summaryPdf(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    const summary = await getSummaryPdf(request.params.id);

    reply
        .header("Content-Type", "application/pdf")
        .header(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(summary.filename)}"`,
        );

    return reply.send(summary.buffer);
}
