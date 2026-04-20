import { FastifyInstance } from "fastify";
import {
    forgotPassword,
    googleCallback,
    googleStart,
    login,
    logout,
    me,
    refresh,
    register,
    resetUserPassword,
    verifyEmail,
    twoFactorEnable,
    twoFactorVerify,
    twoFactorDisable,
    twoFactorLogin,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import {
    forgotPasswordSchema,
    loginSchema,
    logoutSchema,
    refreshSchema,
    registerSchema,
    resetPasswordSchema,
    verifyEmailSchema,
    twoFactorVerifySchema,
    twoFactorLoginSchema,
} from "../models/auth.model";

export default async function authRoutes(fastify: FastifyInstance) {
    fastify.get("/google", {
        handler: googleStart,
    });

    fastify.get("/google/callback", {
        handler: googleCallback,
    });

    fastify.post("/register", {
        schema: registerSchema,
        handler: register,
    });

    fastify.post("/login", {
        schema: loginSchema,
        handler: login,
    });

    fastify.post("/logout", {
        schema: logoutSchema,
        handler: logout,
    });

    fastify.post("/refresh", {
        schema: refreshSchema,
        handler: refresh,
    });

    fastify.post("/forgot-password", {
        schema: forgotPasswordSchema,
        handler: forgotPassword,
    });

    fastify.post("/reset-password", {
        schema: resetPasswordSchema,
        handler: resetUserPassword,
    });

    fastify.post("/verify-email", {
        schema: verifyEmailSchema,
        handler: verifyEmail,
    });

    fastify.get("/me", { preHandler: authenticate, handler: me });

    // ── 2FA ──────────────────────────────────────────────────────────────────
    fastify.post("/2fa/enable",  { preHandler: authenticate, handler: twoFactorEnable });

    fastify.post("/2fa/verify", {
        preHandler: authenticate,
        schema:     twoFactorVerifySchema,
        handler:    twoFactorVerify,
    });

    fastify.delete("/2fa/disable", {
        preHandler: authenticate,
        handler:    twoFactorDisable,
    });

    // No auth middleware — uses a short-lived challenge token instead.
    fastify.post("/2fa/login", {
        schema:  twoFactorLoginSchema,
        handler: twoFactorLogin,
    });
}
