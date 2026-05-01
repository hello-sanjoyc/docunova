import { FastifyReply, FastifyRequest } from "fastify";
import {
    cancelSubscriptionPlaceholder,
    createSubscription,
    getCurrentSubscription,
} from "../services/subscription.service";
import { successResponse } from "../utils/response";
import {
    CreateSubscriptionBody,
    CurrentSubscriptionQuery,
} from "../models/subscription.model";

export async function postSubscription(
    request: FastifyRequest<{ Body: CreateSubscriptionBody }>,
    reply: FastifyReply,
) {
    const result = await createSubscription(request.user.userId, request.body);
    reply.status(201).send(successResponse("Subscription created", result, 201));
}

export async function currentSubscription(
    request: FastifyRequest<{ Querystring: CurrentSubscriptionQuery }>,
    reply: FastifyReply,
) {
    const result = await getCurrentSubscription(request.user.userId, request.query);
    reply.send(successResponse("Current subscription fetched", result));
}

export async function cancelSubscription(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    await cancelSubscriptionPlaceholder(request.user.userId);
    reply.send(successResponse("Subscription cancellation recorded"));
}
