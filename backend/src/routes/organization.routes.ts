import { FastifyInstance } from "fastify";
import {
    getInvitation,
    getMembers,
    postAcceptInvitation,
    postMemberInvitations,
} from "../controllers/organization.controller";
import { authenticate } from "../middlewares/authenticate";
import {
    acceptInvitationSchema,
    inviteMembersSchema,
    listMembersSchema,
} from "../models/organization.model";

export default async function organizationRoutes(fastify: FastifyInstance) {
    // ── /organizations/me/members ────────────────────────────────────────────
    fastify.get("/me/members", {
        preHandler: authenticate,
        schema:     listMembersSchema,
        handler:    getMembers,
    });

    fastify.post("/me/members", {
        preHandler: authenticate,
        schema:     inviteMembersSchema,
        handler:    postMemberInvitations,
    });

    // ── /organizations/invitations/:token ────────────────────────────────────
    fastify.get("/invitations/:token", {
        schema:  acceptInvitationSchema,
        handler: getInvitation,
    });

    fastify.post("/invitations/:token/accept", {
        preHandler: authenticate,
        schema:     acceptInvitationSchema,
        handler:    postAcceptInvitation,
    });
}
