import { FastifyReply, FastifyRequest } from "fastify";
import { getPlanBySlug, getPricing } from "../services/pricing.service";
import { successResponse } from "../utils/response";
import { PlanSlugParams, PricingQuery } from "../models/pricing.model";

export async function listPricing(
    request: FastifyRequest<{ Querystring: PricingQuery }>,
    reply: FastifyReply,
) {
    const result = await getPricing(request.query);
    reply.send(successResponse("Pricing fetched", result));
}

export async function getPlan(
    request: FastifyRequest<{
        Params: PlanSlugParams;
        Querystring: PricingQuery;
    }>,
    reply: FastifyReply,
) {
    const result = await getPlanBySlug(request.params.slug, request.query);
    reply.send(successResponse("Plan fetched", result));
}
