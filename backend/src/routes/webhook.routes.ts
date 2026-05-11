import { FastifyInstance } from "fastify";
import { postRazorpayWebhook } from "../controllers/payment.controller";

export default async function webhookRoutes(fastify: FastifyInstance) {
    // Store raw body for signature verification
    fastify.addContentTypeParser(
        "application/json",
        { parseAs: "string" },
        function (req, body, done) {
            try {
                const parsed = JSON.parse(body as string);
                (req as any).rawBody = body;
                done(null, parsed);
            } catch (err: any) {
                done(err, undefined);
            }
        },
    );

    fastify.post("/razorpay", {
        handler: postRazorpayWebhook,
    });
}
