import { FastifySchema } from "fastify";

export interface PricingQuery {
    country_code?: string;
    region_code?: string;
}

export interface PlanSlugParams {
    slug: string;
}

export const pricingQuerySchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            country_code: { type: "string", minLength: 2, maxLength: 2 },
            region_code: { type: "string", minLength: 2, maxLength: 20 },
        },
        additionalProperties: false,
    },
};

export const planSlugSchema: FastifySchema = {
    params: {
        type: "object",
        required: ["slug"],
        properties: {
            slug: {
                type: "string",
                enum: ["starter", "professional", "team"],
            },
        },
        additionalProperties: false,
    },
    querystring: pricingQuerySchema.querystring,
};
