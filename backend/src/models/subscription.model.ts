import { FastifySchema } from "fastify";

export interface CreateSubscriptionBody {
    user_id?: string;
    plan_slug: "starter" | "professional" | "team";
    region_code?: string;
    billing_cycle: "monthly" | "yearly";
}

export interface CurrentSubscriptionQuery {
    user_id?: string;
}

export const createSubscriptionSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["plan_slug", "billing_cycle"],
        properties: {
            user_id: { type: "string", minLength: 1 },
            plan_slug: {
                type: "string",
                enum: ["starter", "professional", "team"],
            },
            region_code: { type: "string", minLength: 2, maxLength: 20 },
            billing_cycle: { type: "string", enum: ["monthly", "yearly"] },
        },
        additionalProperties: false,
    },
};

export const currentSubscriptionSchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            user_id: { type: "string", minLength: 1 },
        },
        additionalProperties: false,
    },
};
