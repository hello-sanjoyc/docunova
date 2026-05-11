import { FastifySchema } from "fastify";

export interface CreateOrderBody {
    plan_slug: string;
    billing_cycle: "monthly" | "yearly";
}

export interface VerifyPaymentBody {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export const createOrderSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["plan_slug", "billing_cycle"],
        properties: {
            plan_slug: { type: "string", minLength: 1, maxLength: 100 },
            billing_cycle: { type: "string", enum: ["monthly", "yearly"] },
        },
        additionalProperties: false,
    },
};

export const verifyPaymentSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"],
        properties: {
            razorpay_order_id: { type: "string", minLength: 1 },
            razorpay_payment_id: { type: "string", minLength: 1 },
            razorpay_signature: { type: "string", minLength: 1 },
        },
        additionalProperties: false,
    },
};

export const paymentHistorySchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            method: { type: "string", minLength: 1 },
            date_from: { type: "string", minLength: 1 },
            date_to: { type: "string", minLength: 1 },
        },
        additionalProperties: false,
    },
};
