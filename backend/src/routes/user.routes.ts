import { FastifyInstance } from "fastify";
import {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    listSessions,
    listAccessLogs,
    revokeSession,
    updateNotificationPreferences,
    sendEmailDigest,
    uploadAvatar,
    getDashboard,
    listUsers,
    removeUser,
} from "../controllers/user.controller";
import { authenticate, requireRoles } from "../middlewares/authenticate";
import { validateAvatarUpload } from "../middlewares/validateAvatarUpload";
import {
    updateProfileSchema,
    changePasswordSchema,
    updateNotificationPreferencesSchema,
} from "../models/user.model";

export default async function userRoutes(fastify: FastifyInstance) {
    // ── /users/me ────────────────────────────────────────────────────────────
    fastify.get("/me", { preHandler: authenticate, handler: getProfile });

    fastify.patch("/me", {
        preHandler: authenticate,
        schema: updateProfileSchema,
        handler: updateProfile,
    });
    fastify.patch("/me/password", {
        preHandler: authenticate,
        schema: changePasswordSchema,
        handler: changePassword,
    });
    fastify.patch("/me/notifications", {
        preHandler: authenticate,
        schema: updateNotificationPreferencesSchema,
        handler: updateNotificationPreferences,
    });
    fastify.post("/me/notifications/email-digest", {
        preHandler: authenticate,
        handler: sendEmailDigest,
    });
    fastify.patch("/me/avatar", {
        preHandler: [authenticate, validateAvatarUpload],
        handler: uploadAvatar,
    });
    fastify.get("/me/dashboard", {
        preHandler: authenticate,
        handler: getDashboard,
    });

    fastify.delete("/me", { preHandler: authenticate, handler: deleteAccount });

    // ── /users/me/sessions ───────────────────────────────────────────────────
    fastify.get("/me/sessions", {
        preHandler: authenticate,
        handler: listSessions,
    });
    fastify.get("/me/access-logs", {
        preHandler: authenticate,
        handler: listAccessLogs,
    });
    fastify.delete("/me/sessions/:id", {
        preHandler: authenticate,
        handler: revokeSession,
    });

    // ── legacy aliases (kept for backward compat) ───────────────────────────
    fastify.get("/profile", { preHandler: authenticate, handler: getProfile });
    fastify.patch("/profile", {
        preHandler: authenticate,
        schema: updateProfileSchema,
        handler: updateProfile,
    });

    // ── superadmin-only, not the organisation admin ───────────────────────────────────────────────────────────
    fastify.get("/", {
        preHandler: [authenticate, requireRoles("SUPERADMIN")],
        handler: listUsers,
    });
    fastify.delete("/:id", {
        preHandler: [authenticate, requireRoles("SUPERADMIN")],
        handler: removeUser,
    });
}
