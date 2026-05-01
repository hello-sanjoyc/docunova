import { FastifySchema } from "fastify";
import { PaginationQuery } from "../types";

export interface UserIdParams {
    id: string;
}

export interface SessionIdParams {
    id: string;
}

export interface UpdateProfileBody {
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    roleCode?: string;
    organizationName?: string;
}

export interface ChangePasswordBody {
    currentPassword: string;
    newPassword: string;
}

export interface UpdateNotificationPreferencesBody {
    emailDigests?: boolean;
    securityAlerts?: boolean;
}

export interface AccessLogQuery extends PaginationQuery {}

export type UserListQuery = PaginationQuery;

export const updateProfileSchema: FastifySchema = {
    body: {
        type: "object",
        properties: {
            name:      { type: "string", minLength: 2, maxLength: 255 },
            firstName: { type: "string", minLength: 1, maxLength: 120 },
            lastName:  { type: "string", minLength: 1, maxLength: 120 },
            phone:     { type: "string", maxLength: 30 },
            roleCode:  { type: "string", enum: ["superadmin", "admin", "member"] },
            organizationName: { type: "string", minLength: 2, maxLength: 255 },
        },
        additionalProperties: false,
    },
};

export const changePasswordSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
            currentPassword: { type: "string", minLength: 1 },
            newPassword: { type: "string", minLength: 8, maxLength: 255 },
        },
        additionalProperties: false,
    },
};

export const updateNotificationPreferencesSchema: FastifySchema = {
    body: {
        type: "object",
        properties: {
            emailDigests: { type: "boolean" },
            securityAlerts: { type: "boolean" },
        },
        additionalProperties: false,
        anyOf: [{ required: ["emailDigests"] }, { required: ["securityAlerts"] }],
    },
};
