import { FastifyRequest, FastifyReply } from "fastify";
import {
    getUserById,
    getAllUsers,
    updateUser,
    deleteUser,
    deleteUserAccount,
    getUserSessions,
    revokeUserSession,
} from "../services/user.service";
import { successResponse } from "../utils/response";
import {
    UpdateProfileBody,
    UserIdParams,
    UserListQuery,
    SessionIdParams,
} from "../models/user.model";

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
    const user = await getUserById(request.user.userId);
    reply.send(successResponse("User profile", user));
}

export async function updateProfile(
    request: FastifyRequest<{ Body: UpdateProfileBody }>,
    reply: FastifyReply,
) {
    const user = await updateUser(request.user.userId, request.body);
    reply.send(successResponse("Profile updated", user));
}

export async function deleteAccount(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    await deleteUserAccount(request.user.userId);
    reply.send(successResponse("Account deleted successfully"));
}

export async function listSessions(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const sessions = await getUserSessions(request.user.userId);
    reply.send(successResponse("Active sessions", sessions));
}

export async function revokeSession(
    request: FastifyRequest<{ Params: SessionIdParams }>,
    reply: FastifyReply,
) {
    await revokeUserSession(request.user.userId, request.params.id);
    reply.send(successResponse("Session revoked"));
}

// ─── admin-only handlers ───────────────────────────────────────────────────

export async function listUsers(
    request: FastifyRequest<{ Querystring: UserListQuery }>,
    reply: FastifyReply,
) {
    const result = await getAllUsers(request.query);
    reply.send(successResponse("Users fetched", result));
}

export async function removeUser(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
) {
    await deleteUser(request.params.id);
    reply.send(successResponse("User deleted"));
}
