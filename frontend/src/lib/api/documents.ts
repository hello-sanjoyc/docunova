import { AxiosError } from "axios";
import { API_ENDPOINTS } from "./endpoints";
import { apiClient } from "./client";
import { apiRequest } from "./request";
import { toApiError } from "./errors";

const ALLOWED_UPLOAD_EXTENSIONS = new Set([
    "pdf",
    "docx",
    "jpg",
    "jpeg",
    "png",
]);

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpg",
    "image/jpeg",
    "image/png",
]);

const ALLOWED_UPLOAD_LABEL = "PDF / DOCX / JPG / JPEG / PNG";

export type DocumentStatus =
    | "UPLOADED"
    | "PROCESSING"
    | "READY"
    | "FAILED"
    | "ARCHIVED"
    | "TRASHED";

export interface DocumentItem {
    id: string;
    uuid?: string;
    title: string;
    originalFilename: string;
    mimeType: string;
    fileExtension: string | null;
    fileSizeBytes: string | null;
    status: DocumentStatus;
    folderId: string | null;
    thumbnailStorageKey?: string | null;
    metadataJson?: Record<string, unknown> | null;
    uploadedAt: string;
    updatedAt: string;
}

export interface PaginatedDocuments {
    data: DocumentItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ListDocumentsQuery {
    page?: number;
    limit?: number;
    status?: string;
    mimeType?: string;
    folderId?: string;
    search?: string;
    sortBy?: "uploadedAt" | "updatedAt" | "title" | "fileSizeBytes";
    sortOrder?: "asc" | "desc";
}

export type SearchQueryType = "basic" | "full_text" | "semantic";

export interface SearchDocumentsPayload {
    query: string;
    queryType?: SearchQueryType;
    filters?: {
        status?: string;
        mimeType?: string;
        folderId?: string;
    };
    page?: number;
    limit?: number;
}

export interface SearchDocumentsResult extends PaginatedDocuments {
    query: string;
    queryType: SearchQueryType;
    filters?: {
        status?: string;
        mimeType?: string;
        folderId?: string;
    };
}

export interface SummarizeJobResult {
    jobId: string;
    status: string;
}

export interface UploadDocumentPayload {
    file: File;
    title?: string;
    description?: string;
    folderId?: string;
}

export interface UpdateDocumentPayload {
    title?: string;
    description?: string;
    folderId?: string | null;
    status?: "archived" | "trashed";
}

function getFileExtension(fileName: string) {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex < 0 || lastDotIndex === fileName.length - 1) return "";
    return fileName.slice(lastDotIndex + 1).toLowerCase();
}

export function validateUploadFileType(file: File) {
    const extension = getFileExtension(file.name);
    const normalizedMime = file.type.trim().toLowerCase();

    const hasAllowedExtension = ALLOWED_UPLOAD_EXTENSIONS.has(extension);
    const hasAllowedMime = normalizedMime
        ? ALLOWED_UPLOAD_MIME_TYPES.has(normalizedMime)
        : false;

    if (!hasAllowedExtension && !hasAllowedMime) {
        throw new Error(`Unsupported file type. Allowed: ${ALLOWED_UPLOAD_LABEL}.`);
    }
}

export function listDocuments(query: ListDocumentsQuery = {}) {
    return apiRequest<PaginatedDocuments>({
        method: "GET",
        url: API_ENDPOINTS.DOCUMENTS.BASE,
        params: query,
    });
}

export function listTrashDocuments(query: ListDocumentsQuery = {}) {
    return apiRequest<PaginatedDocuments>({
        method: "GET",
        url: `${API_ENDPOINTS.DOCUMENTS.BASE}/trash`,
        params: query,
    });
}

export function searchDocuments(payload: SearchDocumentsPayload) {
    return apiRequest<SearchDocumentsResult>({
        method: "POST",
        url: API_ENDPOINTS.SEARCH.BASE,
        data: payload,
    });
}

export function uploadDocument(payload: UploadDocumentPayload) {
    validateUploadFileType(payload.file);

    const formData = new FormData();
    formData.append("file", payload.file);

    if (payload.title) formData.append("title", payload.title);
    if (payload.description) formData.append("description", payload.description);
    if (payload.folderId) formData.append("folderId", payload.folderId);

    return apiRequest<DocumentItem>({
        method: "POST",
        url: API_ENDPOINTS.DOCUMENTS.BASE,
        data: formData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export function triggerDocumentSummary(documentId: string) {
    return apiRequest<SummarizeJobResult>({
        method: "POST",
        url: API_ENDPOINTS.AI.SUMMARIZE(documentId),
    });
}

export function getDocument(id: string) {
    return apiRequest<DocumentItem>({
        method: "GET",
        url: `${API_ENDPOINTS.DOCUMENTS.BASE}/${id}`,
    });
}

export function updateDocument(id: string, payload: UpdateDocumentPayload) {
    return apiRequest<DocumentItem>({
        method: "PATCH",
        url: `${API_ENDPOINTS.DOCUMENTS.BASE}/${id}`,
        data: payload,
    });
}

export function deleteDocument(id: string) {
    return apiRequest<void>({
        method: "DELETE",
        url: `${API_ENDPOINTS.DOCUMENTS.BASE}/${id}`,
    });
}

export function restoreDocument(id: string) {
    return apiRequest<DocumentItem>({
        method: "POST",
        url: `${API_ENDPOINTS.DOCUMENTS.BASE}/${id}/restore`,
    });
}

export function getDocumentPresignedUrl(id: string, expiresIn = 3600) {
    return apiRequest<{ url: string; expiresIn: number }>({
        method: "GET",
        url: `${API_ENDPOINTS.DOCUMENTS.BASE}/${id}/presigned`,
        params: { expiresIn },
    });
}

async function requestDocumentBlob(path: string) {
    try {
        const response = await apiClient.request<Blob>({
            method: "GET",
            url: path,
            responseType: "blob",
        });
        return response.data;
    } catch (error) {
        throw toApiError(error as AxiosError);
    }
}

export function downloadDocumentFile(id: string) {
    return requestDocumentBlob(`${API_ENDPOINTS.DOCUMENTS.BASE}/${id}/download`);
}

export function getDocumentPreviewFile(id: string) {
    return requestDocumentBlob(`${API_ENDPOINTS.DOCUMENTS.BASE}/${id}/preview`);
}
