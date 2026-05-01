import { FastifyRequest, FastifyReply } from "fastify";
import {
    getUserById,
    getAllUsers,
    updateUser,
    changeUserPassword,
    deleteUser,
    deleteUserAccount,
    getUserSessions,
    getUserAccessLogs,
    revokeUserSession,
    updateUserNotificationPreferences,
    sendUserEmailDigest,
    uploadUserAvatar,
    getUserDashboardOverview,
} from "../services/user.service";
import { successResponse } from "../utils/response";
import {
    UpdateProfileBody,
    ChangePasswordBody,
    UserIdParams,
    UserListQuery,
    SessionIdParams,
    AccessLogQuery,
    UpdateNotificationPreferencesBody,
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

export async function changePassword(
    request: FastifyRequest<{ Body: ChangePasswordBody }>,
    reply: FastifyReply,
) {
    await changeUserPassword(request.user.userId, request.body);
    reply.send(successResponse("Password changed successfully"));
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

export async function listAccessLogs(
    request: FastifyRequest<{ Querystring: AccessLogQuery }>,
    reply: FastifyReply,
) {
    const logs = await getUserAccessLogs(request.user.userId, request.query);
    reply.send(successResponse("Access logs fetched", logs));
}

export async function updateNotificationPreferences(
    request: FastifyRequest<{ Body: UpdateNotificationPreferencesBody }>,
    reply: FastifyReply,
) {
    const preferences = await updateUserNotificationPreferences(
        request.user.userId,
        request.body,
    );
    reply.send(successResponse("Notification preferences updated", preferences));
}

export async function sendEmailDigest(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    await sendUserEmailDigest(request.user.userId);
    reply.send(successResponse("Email digest queued"));
}

export async function uploadAvatar(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    if (!request.avatarUpload) {
        throw Object.assign(new Error("No avatar image uploaded"), {
            statusCode: 400,
        });
    }

    const updated = await uploadUserAvatar(request.user.userId, request.avatarUpload);
    reply.send(successResponse("Profile avatar updated", updated));
}

export async function getDashboard(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const result = await getUserDashboardOverview(request.user.userId);
    reply.send(successResponse("Dashboard overview fetched", result));
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
