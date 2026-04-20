import crypto from "crypto";
import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../config/prisma";
import env from "../config/env";
import { extractPdfData } from "../services/pdf.service";
import { extractDocxData } from "../services/docx.service";
import {
    classifyDocument,
    ClassificationResult,
} from "../utils/classifyDocument";
import { createLogger } from "../config/logger";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ValidatedDocumentUpload {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    extension: string;
    fileSizeBytes: number;
    checksumSha256: string;
    pageCount: number;
    extractedText: string;
    classification: ClassificationResult;
    fields: { title?: string; description?: string; folderId?: string };
}

declare module "fastify" {
    interface FastifyRequest {
        documentUpload?: ValidatedDocumentUpload;
    }
}

// ── Allowed types ────────────────────────────────────────────────────────────

const PDF_MIME = "application/pdf";
const DOCX_MIME =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";

const ALLOWED_MIMES = new Set([PDF_MIME, DOCX_MIME, DOC_MIME]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "doc"]);

function detectKindByMagicBytes(buffer: Buffer): "pdf" | "docx" | "doc" | null {
    if (buffer.length < 8) return null;
    // PDF: "%PDF-"
    if (buffer.slice(0, 5).toString() === "%PDF-") return "pdf";
    // DOCX (zip): PK\x03\x04
    if (
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04
    )
        return "docx";
    // Legacy DOC (compound file): D0 CF 11 E0 A1 B1 1A E1
    if (
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0 &&
        buffer[4] === 0xa1 &&
        buffer[5] === 0xb1 &&
        buffer[6] === 0x1a &&
        buffer[7] === 0xe1
    )
        return "doc";
    return null;
}

// ── Response helpers ─────────────────────────────────────────────────────────

function reject(reply: FastifyReply, statusCode: number, message: string) {
    return reply
        .status(statusCode)
        .send({ statusCode, success: false, message });
}

// ── Middleware ───────────────────────────────────────────────────────────────

export async function validateDocumentUpload(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const logger = createLogger({
        context: "document-upload-validator",
        requestId: request.id,
        userId: request.user?.userId,
    });

    // Parse multipart: collect the first file + all text fields.
    const parts = request.parts();
    const fields: Record<string, string> = {};
    let fileFilename: string | undefined;
    let fileMime: string | undefined;
    const chunks: Buffer[] = [];

    for await (const part of parts) {
        if (part.type === "file") {
            if (fileFilename) {
                // Drain any extra files
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for await (const _ of part.file) {
                    /* noop */
                }
                continue;
            }
            fileFilename = part.filename;
            fileMime = part.mimetype;
            for await (const chunk of part.file) {
                chunks.push(
                    Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                );
            }
        } else {
            fields[part.fieldname] = part.value as string;
        }
    }

    if (!fileFilename) {
        logger.warn("Upload rejected: no file part");
        return reject(reply, 400, "No file uploaded");
    }

    const buffer = Buffer.concat(chunks);
    if (buffer.length === 0) {
        return reject(reply, 400, "Uploaded file is empty");
    }

    const extension = (fileFilename.split(".").pop() || "").toLowerCase();
    const mimeType = fileMime || "";

    // ── 1. File type check (extension + MIME + magic bytes) ──────────────────
    if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIMES.has(mimeType)) {
        logger.warn("Upload rejected: disallowed file type", {
            filename: fileFilename,
            mimeType,
            extension,
        });
        return reject(
            reply,
            415,
            "Only PDF and MS Word (.doc, .docx) files are allowed",
        );
    }

    const detectedKind = detectKindByMagicBytes(buffer);
    if (!detectedKind) {
        return reject(
            reply,
            415,
            "File content does not match a supported PDF or MS Word format",
        );
    }
    if (detectedKind === "doc") {
        // mammoth only parses .docx; legacy binary .doc cannot be inspected.
        return reject(
            reply,
            415,
            "Legacy .doc files are not supported. Please save as .docx or PDF and retry",
        );
    }

    // ── 2. Duplicate check by content hash ───────────────────────────────────
    const checksumSha256 = crypto
        .createHash("sha256")
        .update(buffer)
        .digest("hex");

    const owner = await prisma.user.findUnique({
        where: { uuid: request.user.userId },
        select: { id: true, organizationId: true },
    });
    if (!owner) return reject(reply, 404, "User not found");

    const existing = await prisma.document.findFirst({
        where: {
            organizationId: owner.organizationId,
            checksumSha256,
            deletedAt: null,
        },
        select: { uuid: true, title: true },
    });
    if (existing) {
        logger.warn("Upload rejected: duplicate file", {
            checksumSha256,
            existingDocumentId: existing.uuid,
        });
        return reject(
            reply,
            409,
            `This file has already been uploaded (existing document: "${existing.title}")`,
        );
    }

    // ── 3. Extract text + page count ─────────────────────────────────────────
    let pageCount = 0;
    let extractedText = "";
    try {
        if (detectedKind === "pdf") {
            const pdf = await extractPdfData(buffer);
            pageCount = pdf.pageCount;
            extractedText = pdf.text;
        } else {
            const docx = await extractDocxData(buffer);
            pageCount = docx.pageCount;
            extractedText = docx.text;
        }
    } catch (err) {
        logger.error("Upload rejected: failed to parse document", { err });
        return reject(
            reply,
            422,
            "Unable to read the uploaded document. The file may be corrupted or password-protected",
        );
    }

    // ── 4. Page count limit ──────────────────────────────────────────────────
    if (pageCount > env.MAX_DOCUMENT_PAGES) {
        logger.warn("Upload rejected: page count exceeds limit", {
            pageCount,
            limit: env.MAX_DOCUMENT_PAGES,
        });
        return reject(
            reply,
            413,
            `Document has ${pageCount} pages; the maximum allowed is ${env.MAX_DOCUMENT_PAGES} pages.`,
        );
    }

    // ── 5. Classification ────────────────────────────────────────────────────
    const classification = classifyDocument(extractedText);
    if (!classification) {
        logger.warn("Upload rejected: document not classifiable", {
            filename: fileFilename,
        });
        return reject(
            reply,
            422,
            "The document does not belong to any supported category like NDA, Agreement, Contract, Court Case, etc.",
        );
    }

    logger.info("Document upload validated", {
        filename: fileFilename,
        mimeType,
        extension,
        fileSizeBytes: buffer.length,
        pageCount,
        checksumSha256,
        classification: classification.label,
        classificationScore: classification.score,
    });

    request.documentUpload = {
        buffer,
        filename: fileFilename,
        mimeType,
        extension,
        fileSizeBytes: buffer.length,
        checksumSha256,
        pageCount,
        extractedText,
        classification,
        fields: {
            title: fields.title,
            description: fields.description,
            folderId: fields.folderId,
        },
    };
}
