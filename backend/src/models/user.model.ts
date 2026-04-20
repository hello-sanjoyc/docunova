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
}

export type UserListQuery = PaginationQuery;

export const updateProfileSchema: FastifySchema = {
    body: {
        type: "object",
        properties: {
            name:      { type: "string", minLength: 2, maxLength: 255 },
            firstName: { type: "string", minLength: 1, maxLength: 120 },
            lastName:  { type: "string", minLength: 1, maxLength: 120 },
            phone:     { type: "string", maxLength: 30 },
        },
        additionalProperties: false,
    },
};
