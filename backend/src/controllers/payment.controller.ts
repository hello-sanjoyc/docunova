import { FastifyReply, FastifyRequest } from "fastify";
import { createPaymentOrder, handleRazorpayWebhook, verifyAndActivatePayment } from "../services/razorpay.service";
import { successResponse } from "../utils/response";

export async function postCreateOrder(
    request: FastifyRequest<{ Body: { plan_slug: string; billing_cycle: "monthly" | "yearly" } }>,
    reply: FastifyReply,
) {
    const result = await createPaymentOrder(request.user.userId, request.body);
    reply.status(201).send(successResponse("Order created", result, 201));
}

export async function postVerifyPayment(
    request: FastifyRequest<{
        Body: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
        };
    }>,
    reply: FastifyReply,
) {
    const result = await verifyAndActivatePayment(request.user.userId, request.body);
    reply.send(successResponse("Payment verified and subscription activated", result));
}

export async function postRazorpayWebhook(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const signature = (request.headers["x-razorpay-signature"] as string) ?? "";
    const rawBody = (request as any).rawBody ?? JSON.stringify(request.body);
    const result = await handleRazorpayWebhook(rawBody, signature);
    reply.send(result);
}
