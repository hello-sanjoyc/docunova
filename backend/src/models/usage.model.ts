import { FastifySchema } from "fastify";

export interface UsageCheckBody {
    user_id?: string;
    page_count: number;
    ocr_page_count?: number;
}

export interface UsageRecordBody {
    user_id?: string;
    document_id?: string;
    pages_used: number;
    ocr_pages_used?: number;
}

export const usageCheckSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["page_count"],
        properties: {
            user_id: { type: "string", minLength: 1 },
            page_count: { type: "integer", minimum: 0 },
            ocr_page_count: { type: "integer", minimum: 0 },
        },
        additionalProperties: false,
    },
};

export const usageRecordSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["pages_used"],
        properties: {
            user_id: { type: "string", minLength: 1 },
            document_id: { type: "string", minLength: 1 },
            pages_used: { type: "integer", minimum: 0 },
            ocr_pages_used: { type: "integer", minimum: 0 },
        },
        additionalProperties: false,
    },
};
