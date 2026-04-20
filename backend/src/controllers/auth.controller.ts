import { FastifyRequest, FastifyReply } from "fastify";
import env from "../config/env";
import { appLogger } from "../config/logger";
import {
    authenticateGoogleUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    requestPasswordReset,
    resetPassword,
    verifyEmailAddress,
    completeTwoFactorLogin,
} from "../services/auth.service";
import { initiate2FA, verify2FA, disable2FA } from "../services/twoFactor.service";
import {
    ForgotPasswordBody,
    LoginBody,
    LogoutBody,
    RefreshBody,
    RegisterBody,
    ResetPasswordBody,
    VerifyEmailBody,
    TwoFactorVerifyBody,
    TwoFactorLoginBody,
} from "../models/auth.model";
import { successResponse } from "../utils/response";

function signAccessToken(request: FastifyRequest, user: { id: string; email: string; role: string }) {
    return request.server.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
}

export async function register(
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply,
) {
    const auth = await registerUser(request.body, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
    });

    const accessToken = signAccessToken(request, auth.user);

    reply.status(201).send(
        successResponse("User registered successfully", {
            user: auth.user,
            accessToken,
            refreshToken: auth.refreshToken,
            token: accessToken,
            ...(process.env.NODE_ENV === "development" && {
                verifyToken: auth.verifyToken,
            }),
        }, 201),
    );
}

export async function login(
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
) {
    const result = await loginUser(request.body, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
    });

    // 2FA required — issue a short-lived challenge token and return early.
    if (result.twoFactorRequired) {
        const twoFactorToken = request.server.jwt.sign(
            { purpose: "2fa_challenge", userId: result.pendingUserId } as unknown as import("../types").JwtPayload,
            { expiresIn: "5m" },
        );
        return reply.send(
            successResponse("Two-factor authentication required", {
                twoFactorRequired: true,
                twoFactorToken,
            }),
        );
    }

    const accessToken = signAccessToken(request, result.user);
    reply.send(
        successResponse("Login successful", {
            user: result.user,
            accessToken,
            refreshToken: result.refreshToken,
            token: accessToken,
        }),
    );
}

export async function twoFactorLogin(
    request: FastifyRequest<{ Body: TwoFactorLoginBody }>,
    reply: FastifyReply,
) {
    // Verify the short-lived challenge token issued by login().
    let pendingUserId: string;
    try {
        const payload = request.server.jwt.verify(request.body.twoFactorToken) as {
            userId: string;
            purpose?: string;
        };
        if (payload.purpose !== "2fa_challenge") {
            throw new Error("Invalid token purpose");
        }
        pendingUserId = payload.userId;
    } catch {
        throw Object.assign(new Error("Invalid or expired 2FA session — please log in again"), {
            statusCode: 401,
        });
    }

    const auth = await completeTwoFactorLogin(pendingUserId, request.body.code, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
    });

    const accessToken = signAccessToken(request, auth.user);
    reply.send(
        successResponse("Login successful", {
            user: auth.user,
            accessToken,
            refreshToken: auth.refreshToken,
            token: accessToken,
        }),
    );
}

export async function logout(
    request: FastifyRequest<{ Body: LogoutBody }>,
    reply: FastifyReply,
) {
    await logoutUser(request.user?.userId, request.body ?? {});
    reply.send(successResponse("Logout successful"));
}

export async function refresh(
    request: FastifyRequest<{ Body: RefreshBody }>,
    reply: FastifyReply,
) {
    const auth = await refreshAccessToken(request.body, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
    });

    const accessToken = signAccessToken(request, auth.user);

    reply.send(
        successResponse("Token refreshed", {
            user: auth.user,
            accessToken,
            refreshToken: auth.refreshToken,
            token: accessToken,
        }),
    );
}

export async function forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordBody }>,
    reply: FastifyReply,
) {
    const result = await requestPasswordReset(request.body);
    reply.send(
        successResponse("Please check your email address for reset instructions.", {
            ...(process.env.NODE_ENV === "development" && {
                resetToken: result.resetToken,
            }),
        }),
    );
}

export async function resetUserPassword(
    request: FastifyRequest<{ Body: ResetPasswordBody }>,
    reply: FastifyReply,
) {
    const user = await resetPassword(request.body);
    reply.send(successResponse("Password reset successful", { user }));
}

export async function verifyEmail(
    request: FastifyRequest<{ Body: VerifyEmailBody }>,
    reply: FastifyReply,
) {
    const user = await verifyEmailAddress(request.body);
    reply.send(successResponse("Email verified successfully", { user }));
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
    reply.send(successResponse("Current user", request.user));
}

// ─── 2FA ─────────────────────────────────────────────────────────────────────

export async function twoFactorEnable(request: FastifyRequest, reply: FastifyReply) {
    const result = await initiate2FA(request.user.userId);
    reply.send(successResponse("2FA enabled successfully", result));
}

export async function twoFactorVerify(
    request: FastifyRequest<{ Body: TwoFactorVerifyBody }>,
    reply: FastifyReply,
) {
    await verify2FA(request.user.userId, request.body.code);
    reply.send(successResponse("2FA enabled successfully"));
}

export async function twoFactorDisable(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    await disable2FA(request.user.userId);
    reply.send(successResponse("2FA disabled successfully"));
}

export async function googleStart(
    request: FastifyRequest<{ Querystring: { source?: string; target?: string } }>,
    reply: FastifyReply,
) {
    const missingEnv = [
        !env.GOOGLE_CLIENT_ID && "GOOGLE_CLIENT_ID",
        !env.GOOGLE_CLIENT_SECRET && "GOOGLE_CLIENT_SECRET",
        !env.GOOGLE_REDIRECT_URI && "GOOGLE_REDIRECT_URI",
        !env.FRONTEND_APP_URL && "FRONTEND_APP_URL",
    ].filter(Boolean);

    if (missingEnv.length > 0) {
        throw Object.assign(
            new Error(`Google OAuth is not configured: missing ${missingEnv.join(", ")}`),
            {
            statusCode: 503,
            },
        );
    }

    const googleClientId = env.GOOGLE_CLIENT_ID as string;
    const googleRedirectUri = env.GOOGLE_REDIRECT_URI as string;

    const source = request.query.source === "signup" ? "signup" : "login";
    const rawTarget = request.query.target || "/dashboard";
    const target = rawTarget.startsWith("/") ? rawTarget : "/dashboard";

    const state = request.server.jwt.sign(
        {
            purpose: "google_oauth",
            source,
            target,
        } as unknown as { userId: string; email: string; role: string },
        { expiresIn: "10m" },
    );

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", googleClientId);
    authUrl.searchParams.set("redirect_uri", googleRedirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    reply.redirect(authUrl.toString());
}

export async function googleCallback(
    request: FastifyRequest<{ Querystring: { code?: string; state?: string; error?: string } }>,
    reply: FastifyReply,
) {
    const frontendUrl = env.FRONTEND_APP_URL.replace(/\/+$/, "");
    let source: "login" | "signup" = "login";
    const failureRedirect = () =>
        new URL(source === "signup" ? "/signup" : "/login", frontendUrl);

    if (request.query.error) {
        const redirect = failureRedirect();
        redirect.searchParams.set("oauthError", request.query.error);
        reply.redirect(redirect.toString());
        return;
    }

    if (!request.query.code || !request.query.state) {
        const redirect = failureRedirect();
        redirect.searchParams.set("oauthError", "missing_code_or_state");
        reply.redirect(redirect.toString());
        return;
    }

    let target = "/dashboard";
    try {
        const statePayload = (await request.server.jwt.verify(request.query.state)) as {
            purpose?: string;
            target?: string;
            source?: string;
        };

        if (statePayload.purpose !== "google_oauth") {
            throw new Error("Invalid OAuth state");
        }

        source = statePayload.source === "signup" ? "signup" : "login";

        if (statePayload.target && statePayload.target.startsWith("/")) {
            target = statePayload.target;
        }
    } catch {
        const redirect = failureRedirect();
        redirect.searchParams.set("oauthError", "invalid_state");
        reply.redirect(redirect.toString());
        return;
    }

    try {
        const auth = await authenticateGoogleUser(request.query.code, {
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"],
        }, { source });

        const accessToken = signAccessToken(request, auth.user);
        const callbackRedirect = new URL("/oauth/google/callback", frontendUrl);
        callbackRedirect.searchParams.set("accessToken", accessToken);
        callbackRedirect.searchParams.set("refreshToken", auth.refreshToken);
        callbackRedirect.searchParams.set("target", target);
        callbackRedirect.searchParams.set("email", auth.user.email);
        callbackRedirect.searchParams.set(
            "verified",
            auth.user.emailVerifiedAt ? "1" : "0",
        );
        reply.redirect(callbackRedirect.toString());
    } catch (error) {
        appLogger.error("Google OAuth callback failed", {
            err: error,
            requestId: request.id,
            url: request.url,
            query: request.query,
        });

        const redirect = failureRedirect();
        redirect.searchParams.set("oauthError", "oauth_callback_failed");
        if (env.NODE_ENV !== "production" && error instanceof Error) {
            redirect.searchParams.set("oauthReason", error.message);
        }
        reply.redirect(redirect.toString());
    }
}
