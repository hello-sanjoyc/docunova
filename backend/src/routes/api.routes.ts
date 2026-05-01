import { FastifyInstance } from "fastify";
import { listPricing, getPlan } from "../controllers/pricing.controller";
import {
    cancelSubscription,
    currentSubscription,
    postSubscription,
} from "../controllers/subscription.controller";
import {
    getUsageSummary,
    postUsageCheck,
    postUsageRecord,
} from "../controllers/usage.controller";
import { authenticate } from "../middlewares/authenticate";
import { planSlugSchema, pricingQuerySchema } from "../models/pricing.model";
import {
    createSubscriptionSchema,
    currentSubscriptionSchema,
} from "../models/subscription.model";
import { usageCheckSchema, usageRecordSchema } from "../models/usage.model";

export default async function apiRoutes(fastify: FastifyInstance) {
    fastify.get("/pricing", {
        schema: pricingQuerySchema,
        handler: listPricing,
    });

    fastify.get("/plans/:slug", {
        schema: planSlugSchema,
        handler: getPlan,
    });

    fastify.post("/subscriptions", {
        preHandler: authenticate,
        schema: createSubscriptionSchema,
        handler: postSubscription,
    });

    fastify.get("/subscriptions/current", {
        preHandler: authenticate,
        schema: currentSubscriptionSchema,
        handler: currentSubscription,
    });

    fastify.post("/subscriptions/cancel", {
        preHandler: authenticate,
        handler: cancelSubscription,
    });

    fastify.get("/usage/summary", {
        preHandler: authenticate,
        handler: getUsageSummary,
    });

    fastify.post("/usage/check", {
        preHandler: authenticate,
        schema: usageCheckSchema,
        handler: postUsageCheck,
    });

    fastify.post("/usage/record", {
        preHandler: authenticate,
        schema: usageRecordSchema,
        handler: postUsageRecord,
    });
}
