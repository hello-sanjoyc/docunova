import { FastifySchema } from "fastify";

// ── Search body ───────────────────────────────────────────────────────────────

export type SearchQueryType = "basic" | "full_text" | "semantic";

export interface SearchFilters {
    status?: string;
    mimeType?: string;
    folderId?: string;
}

export interface SearchBody {
    query: string;
    queryType?: SearchQueryType;
    filters?: SearchFilters;
    page?: number;
    limit?: number;
}

export interface SearchInput extends SearchBody {
    userId: string;
}

// ── Recent-searches query ─────────────────────────────────────────────────────

export interface RecentSearchesQuery {
    limit?: number;
}

// ── Fastify schemas ───────────────────────────────────────────────────────────

export const searchSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["query"],
        properties: {
            query: { type: "string", minLength: 1, maxLength: 1000 },
            queryType: {
                type: "string",
                enum: ["basic", "full_text", "semantic"],
            },
            filters: {
                type: "object",
                properties: {
                    status: { type: "string" },
                    mimeType: { type: "string" },
                    folderId: { type: "string" },
                },
                additionalProperties: false,
            },
            page: { type: "integer", minimum: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100 },
        },
        additionalProperties: false,
    },
};

export const recentSearchesSchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            limit: { type: "integer", minimum: 1, maximum: 100 },
        },
    },
};
