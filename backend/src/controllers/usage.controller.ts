import { FastifyReply, FastifyRequest } from "fastify";
import {
    checkUsage,
    getUsageOverview,
    recordUsage,
} from "../services/usage.service";
import { successResponse } from "../utils/response";
import { UsageCheckBody, UsageRecordBody } from "../models/usage.model";

export async function postUsageCheck(
    request: FastifyRequest<{ Body: UsageCheckBody }>,
    reply: FastifyReply,
) {
    const result = await checkUsage(request.user.userId, request.body);
    reply.send(successResponse("Usage checked", result));
}

export async function postUsageRecord(
    request: FastifyRequest<{ Body: UsageRecordBody }>,
    reply: FastifyReply,
) {
    const result = await recordUsage(request.user.userId, request.body);
    reply.status(201).send(successResponse("Usage recorded", result, 201));
}

export async function getUsageSummary(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const result = await getUsageOverview(request.user.userId);
    reply.send(successResponse("Usage overview fetched", result));
}
