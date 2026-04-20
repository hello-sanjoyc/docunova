import { FastifyRequest, FastifyReply } from "fastify";
import {
    acceptInvitation,
    getInvitationByToken,
    inviteMembers,
    listMembers,
} from "../services/organization.service";
import { successResponse } from "../utils/response";
import {
    InvitationTokenParams,
    InviteMembersBody,
    MemberListQuery,
} from "../models/organization.model";

export async function getMembers(
    request: FastifyRequest<{ Querystring: MemberListQuery }>,
    reply: FastifyReply,
) {
    const result = await listMembers(request.user.userId, request.query);
    reply.send(successResponse("Organization members", result));
}

export async function postMemberInvitations(
    request: FastifyRequest<{ Body: InviteMembersBody }>,
    reply: FastifyReply,
) {
    const result = await inviteMembers(request.user.userId, request.body);
    reply.status(201).send(successResponse("Invitations sent", result, 201));
}

export async function getInvitation(
    request: FastifyRequest<{ Params: InvitationTokenParams }>,
    reply: FastifyReply,
) {
    const result = await getInvitationByToken(request.params.token);
    reply.send(successResponse("Invitation details", result));
}

export async function postAcceptInvitation(
    request: FastifyRequest<{ Params: InvitationTokenParams }>,
    reply: FastifyReply,
) {
    const result = await acceptInvitation(request.user.userId, request.params.token);
    reply.send(successResponse("Invitation accepted", result));
}
