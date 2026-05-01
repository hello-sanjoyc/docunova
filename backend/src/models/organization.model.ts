import { FastifySchema } from "fastify";
import { PaginationQuery } from "../types";

export type OrganizationRoleCode = "admin" | "member";

export const ORGANIZATION_ROLE_CODES: OrganizationRoleCode[] = [
    "admin",
    "member",
];

export interface InviteMembersBody {
    role: OrganizationRoleCode;
    emails: string[];
}

export interface InvitationTokenParams {
    token: string;
}

export interface MemberListQuery extends PaginationQuery {
    status?: "active" | "invited" | "all";
}

export const listMembersSchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            page:   { type: "integer", minimum: 1 },
            limit:  { type: "integer", minimum: 1, maximum: 100 },
            status: { type: "string", enum: ["active", "invited", "all"] },
        },
        additionalProperties: false,
    },
};

export const inviteMembersSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["role", "emails"],
        properties: {
            role: { type: "string", enum: ORGANIZATION_ROLE_CODES },
            emails: {
                type: "array",
                minItems: 1,
                maxItems: 50,
                items: { type: "string", format: "email" },
            },
        },
        additionalProperties: false,
    },
};

export const acceptInvitationSchema: FastifySchema = {
    params: {
        type: "object",
        required: ["token"],
        properties: {
            token: { type: "string", minLength: 16 },
        },
        additionalProperties: false,
    },
};
