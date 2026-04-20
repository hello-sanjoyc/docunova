import { FastifySchema } from "fastify";
import { PaginationQuery } from "../types";

// ── Params ────────────────────────────────────────────────────────────────────

export interface DocumentIdParams {
    id: string;
}

// ── Upload (multipart) ────────────────────────────────────────────────────────

/** Fields parsed from multipart upload form */
export interface UploadDocumentFields {
    title?: string;
    description?: string;
    folderId?: string;
}

export interface UploadDocumentInput extends UploadDocumentFields {
    userId: string;
    originalFilename: string;
    storageKey: string;        // relative path on disk, e.g. "uploads/orgId/uuid.pdf"
    mimeType: string;
    fileSizeBytes: number;
    fileExtension: string;
    checksumSha256: string;
    buffer: Buffer;
    pageCount: number;
    extractedText: string;
    classification: {
        key: string;
        label: string;
        score: number;
        matches: number;
    };
}

// ── Legacy JSON body (kept for backward-compat / tests) ──────────────────────

export interface CreateDocumentBody {
    title: string;
    description?: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
}

export interface CreateDocumentInput extends CreateDocumentBody {
    userId: string;
}

// ── List / filter ─────────────────────────────────────────────────────────────

export interface DocumentListQuery extends PaginationQuery {
    /** Filter by document status */
    status?: string;
    /** Filter by MIME type prefix, e.g. "application/pdf" */
    mimeType?: string;
    /** Filter by folder UUID */
    folderId?: string;
    /** Full-text search on title */
    search?: string;
    /** Field to sort by */
    sortBy?: "uploadedAt" | "updatedAt" | "title" | "fileSizeBytes";
    /** Sort direction */
    sortOrder?: "asc" | "desc";
}

// ── Update metadata ───────────────────────────────────────────────────────────

export interface UpdateDocumentBody {
    title?: string;
    description?: string;
    folderId?: string | null;
    status?: "archived" | "trashed";
}

export interface UpdateDocumentInput extends UpdateDocumentBody {
    userId: string;
    documentId: string;
}

// ── Fastify schemas ───────────────────────────────────────────────────────────

/** Schema for PATCH /documents/:id */
export const updateDocumentSchema: FastifySchema = {
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string", format: "uuid" },
        },
    },
    body: {
        type: "object",
        properties: {
            title: { type: "string", minLength: 1, maxLength: 500 },
            description: { type: "string" },
            folderId: { type: ["string", "null"] },
            status: { type: "string", enum: ["archived", "trashed"] },
        },
        additionalProperties: false,
    },
};

/** Schema for GET /documents */
export const listDocumentsSchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            page: { type: "integer", minimum: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            status: { type: "string" },
            mimeType: { type: "string" },
            folderId: { type: "string" },
            search: { type: "string" },
            sortBy: {
                type: "string",
                enum: ["uploadedAt", "updatedAt", "title", "fileSizeBytes"],
            },
            sortOrder: { type: "string", enum: ["asc", "desc"] },
        },
    },
};

/** Schema for param-only routes */
export const documentIdParamSchema: FastifySchema = {
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string", format: "uuid" },
        },
    },
};
