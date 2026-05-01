import { createHash, randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import env from "../config/env";
import { enqueueEmail } from "../queues/email.queue";
import { comparePassword, hashPassword } from "../utils/hash";
import { toAppRole } from "../utils/roles";
import {
    ORGANIZATION_ROLE_CODES,
    OrganizationRoleCode,
} from "../models/organization.model";
import { invalidateUserCaches } from "./user.service";
import { sendSecurityAlertEmail } from "./notification.service";
import {
    ForgotPasswordBody,
    LoginBody,
    RegisterBody,
    RefreshBody,
    ResetPasswordBody,
    VerifyEmailBody,
} from "../models/auth.model";

const REFRESH_TOKEN_TTL_DAYS = 30;
const PASSWORD_RESET_TTL_MINUTES = 30;
const EMAIL_VERIFY_TTL_HOURS = 24;

interface SessionMetadata {
    ipAddress?: string;
    userAgent?: string;
}

interface ParsedSessionClientInfo {
    deviceName: string | null;
    deviceType: string | null;
    browser: string | null;
    os: string | null;
}

interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    id_token?: string;
}

interface GoogleUserProfile {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}

function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

function generateOpaqueToken() {
    return randomBytes(48).toString("hex");
}

function addDays(base: Date, days: number) {
    const date = new Date(base);
    date.setDate(date.getDate() + days);
    return date;
}

function addMinutes(base: Date, minutes: number) {
    const date = new Date(base);
    date.setMinutes(date.getMinutes() + minutes);
    return date;
}

function addHours(base: Date, hours: number) {
    const date = new Date(base);
    date.setHours(date.getHours() + hours);
    return date;
}

function detectBrowser(userAgent: string): string | null {
    if (!userAgent) return null;
    const ua = userAgent;

    let match =
        ua.match(/Edg\/([0-9.]+)/) ||
        ua.match(/OPR\/([0-9.]+)/) ||
        ua.match(/Chrome\/([0-9.]+)/) ||
        ua.match(/Firefox\/([0-9.]+)/) ||
        ua.match(/Version\/([0-9.]+).*Safari/) ||
        ua.match(/Safari\/([0-9.]+)/);

    if (!match) return null;

    if (ua.includes("Edg/")) return `Edge ${match[1]}`;
    if (ua.includes("OPR/")) return `Opera ${match[1]}`;
    if (ua.includes("Chrome/")) return `Chrome ${match[1]}`;
    if (ua.includes("Firefox/")) return `Firefox ${match[1]}`;
    if (ua.includes("Version/") && ua.includes("Safari")) {
        return `Safari ${match[1]}`;
    }
    return "Safari";
}

function detectOs(userAgent: string): string | null {
    if (!userAgent) return null;
    const ua = userAgent;

    let match =
        ua.match(/Windows NT ([0-9.]+)/) ||
        ua.match(/Android ([0-9.]+)/) ||
        ua.match(/iPhone OS ([0-9_]+)/) ||
        ua.match(/iPad; CPU OS ([0-9_]+)/) ||
        ua.match(/Mac OS X ([0-9_]+)/);

    if (match) {
        const version = (match[1] || "").replace(/_/g, ".");
        if (ua.includes("Windows NT")) return `Windows ${version}`;
        if (ua.includes("Android")) return `Android ${version}`;
        if (ua.includes("iPhone OS")) return `iOS ${version}`;
        if (ua.includes("iPad; CPU OS")) return `iPadOS ${version}`;
        if (ua.includes("Mac OS X")) return `macOS ${version}`;
    }

    if (ua.includes("Linux")) return "Linux";
    return null;
}

function detectDeviceType(userAgent: string): string | null {
    if (!userAgent) return null;
    const ua = userAgent.toLowerCase();

    if (ua.includes("bot") || ua.includes("spider") || ua.includes("crawler")) {
        return "bot";
    }
    if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
    if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) {
        return "mobile";
    }
    return "desktop";
}

function detectDeviceName(userAgent: string, os: string | null): string | null {
    if (!userAgent) return null;
    const ua = userAgent.toLowerCase();

    if (ua.includes("iphone")) return "iPhone";
    if (ua.includes("ipad")) return "iPad";
    if (ua.includes("android")) return "Android Device";
    if (ua.includes("macintosh") || ua.includes("mac os x")) return "Mac";
    if (ua.includes("windows")) return "Windows PC";
    if (ua.includes("linux")) return "Linux PC";
    if (ua.includes("bot") || ua.includes("spider") || ua.includes("crawler")) {
        return "Automated Client";
    }

    return os ? `${os} Device` : null;
}

function parseSessionClientInfo(userAgent?: string): ParsedSessionClientInfo {
    if (!userAgent) {
        return {
            deviceName: null,
            deviceType: null,
            browser: null,
            os: null,
        };
    }

    const os = detectOs(userAgent);
    return {
        deviceName: detectDeviceName(userAgent, os),
        deviceType: detectDeviceType(userAgent),
        browser: detectBrowser(userAgent),
        os,
    };
}

function toOrganizationRoleCode(
    roleCode: string | null | undefined,
): OrganizationRoleCode | null {
    if (!roleCode) return null;
    const normalized = roleCode.toLowerCase();
    if (normalized === "owner") return "admin";
    if (normalized === "viewer") return "member";
    return ORGANIZATION_ROLE_CODES.includes(normalized as OrganizationRoleCode)
        ? (normalized as OrganizationRoleCode)
        : null;
}

function toRoleName(roleCode: OrganizationRoleCode) {
    return roleCode.charAt(0).toUpperCase() + roleCode.slice(1);
}

async function getPendingInvitationForEmail(email: string) {
    return prisma.organizationInvitation.findFirst({
        where: {
            email: email.trim().toLowerCase(),
            status: "PENDING",
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            organizationId: true,
            roleCode: true,
        },
    });
}

async function ensureRoleId(
    tx: Prisma.TransactionClient,
    organizationId: bigint,
    roleCode: OrganizationRoleCode,
) {
    const role = await tx.role.upsert({
        where: {
            organizationId_code: {
                organizationId,
                code: roleCode,
            },
        },
        create: {
            organizationId,
            code: roleCode,
            name: toRoleName(roleCode),
            isSystem: true,
        },
        update: {},
        select: { id: true },
    });

    return role.id;
}

async function getDefaultOrganizationId(options?: {
    organizationName?: string;
    fallbackFullName?: string;
}) {
    const organizationDelegate = (prisma as unknown as {
        organization?: {
            findFirst: (args: unknown) => Promise<{ id: bigint } | null>;
            create: (args: unknown) => Promise<{ id: bigint }>;
        };
    }).organization;

    if (organizationDelegate?.findFirst) {
        const existing = await organizationDelegate.findFirst({
            orderBy: { id: "asc" },
            select: { id: true },
        });

        if (existing) {
            return existing.id;
        }

        const orgName =
            options?.organizationName?.trim() ||
            options?.fallbackFullName?.trim() ||
            "Default Organization";
        const slugBase = orgName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 120) || "default-organization";
        const slug = `${slugBase}-${Date.now()}`;
        const organization = await organizationDelegate.create({
            data: {
                name: orgName,
                slug,
            },
            select: { id: true },
        });

        return organization.id;
    }

    // Fallback for stale Prisma clients where `prisma.organization` is missing
    // at runtime but the database schema already contains `organizations`.
    const existing = await prisma.$queryRaw<{ id: bigint }[]>`
        SELECT id
        FROM organizations
        ORDER BY id ASC
        LIMIT 1
    `;

    if (existing.length > 0) {
        return existing[0].id;
    }

    const orgName =
        options?.organizationName?.trim() ||
        options?.fallbackFullName?.trim() ||
        "Default Organization";
    const slugBase = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120) || "default-organization";
    const slug = `${slugBase}-${Date.now()}`;
    const created = await prisma.$queryRaw<{ id: bigint }[]>`
        INSERT INTO organizations (name, slug)
        VALUES (${orgName}, ${slug})
        RETURNING id
    `;

    return created[0].id;
}

async function createSession(userId: bigint, metadata?: SessionMetadata) {
    const refreshToken = generateOpaqueToken();
    const refreshTokenHash = hashToken(refreshToken);
    const clientInfo = parseSessionClientInfo(metadata?.userAgent);

    const session = await prisma.userSession.create({
        data: {
            userId,
            refreshTokenHash,
            status: "ACTIVE",
            deviceName: clientInfo.deviceName,
            deviceType: clientInfo.deviceType,
            browser: clientInfo.browser,
            os: clientInfo.os,
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            expiresAt: addDays(new Date(), REFRESH_TOKEN_TTL_DAYS),
        },
        select: {
            uuid: true,
        },
    });

    return {
        refreshToken,
        sessionId: session.uuid,
    };
}

async function createEmailVerificationToken(userId: bigint) {
    const token = generateOpaqueToken();

    await prisma.emailVerificationToken.create({
        data: {
            userId,
            tokenHash: hashToken(token),
            expiresAt: addHours(new Date(), EMAIL_VERIFY_TTL_HOURS),
        },
    });

    return token;
}

function toAuthUser(user: {
    uuid: string;
    organizationId?: bigint;
    fullName: string | null;
    email: string;
    emailVerifiedAt: Date | null;
    organizationMembers?: Array<{
        organizationId?: bigint;
        role?: { code: string } | null;
    }>;
}, fallbackRoleCode?: string | null) {
    const activeMembership = user.organizationId
        ? user.organizationMembers?.find(
              (member) => member.organizationId === user.organizationId,
          )
        : undefined;
    const roleCode =
        fallbackRoleCode ??
        activeMembership?.role?.code ??
        user.organizationMembers?.[0]?.role?.code;

    return {
        id: user.uuid,
        name: user.fullName ?? "",
        email: user.email,
        role: toAppRole(roleCode),
        emailVerifiedAt: user.emailVerifiedAt,
    };
}

export async function registerUser(
    input: RegisterBody,
    metadata?: SessionMetadata,
) {
    const invitation = await getPendingInvitationForEmail(input.email);
    const invitationRole = toOrganizationRoleCode(invitation?.roleCode);
    const roleCode: OrganizationRoleCode = invitationRole ?? "admin";
    const organizationId =
        invitation?.organizationId ??
        (await getDefaultOrganizationId({
            organizationName: input.organizationName ?? input.organisationName,
            fallbackFullName: input.name,
        }));
    const existing = await prisma.user.findFirst({
        where: {
            organizationId,
            email: input.email,
            deletedAt: null,
        },
    });

    if (existing) {
        throw Object.assign(new Error("Email already in use"), {
            statusCode: 409,
        });
    }

    const hashed = await hashPassword(input.password);
    const joinedAt = new Date();
    const user = await prisma.$transaction(async (tx) => {
        const roleId = await ensureRoleId(tx, organizationId, roleCode);
        const createdUser = await tx.user.create({
            data: {
                organizationId,
                email: input.email,
                passwordHash: hashed,
                fullName: input.name,
                phone: input.phone?.trim() || null,
                authProvider: "LOCAL",
                status: "ACTIVE",
            },
            select: {
                id: true,
                uuid: true,
                organizationId: true,
                fullName: true,
                email: true,
                emailVerifiedAt: true,
            },
        });

        await tx.organizationMember.create({
            data: {
                organizationId,
                userId: createdUser.id,
                roleId,
                status: "ACTIVE",
                ...(invitation ? { invitedAt: joinedAt } : {}),
                joinedAt,
            },
        });

        return createdUser;
    });

    const [{ refreshToken, sessionId }, verifyToken] = await Promise.all([
        createSession(user.id, metadata),
        createEmailVerificationToken(user.id),
    ]);

    const verifyUrl = `${env.FRONTEND_APP_URL}/verify-email?token=${verifyToken}`;
    await enqueueEmail({
        to: user.email,
        subject: 'Verify your email address',
        template: 'verify-email',
        templateData: {
            name: user.fullName ?? 'there',
            verifyUrl,
            appUrl: env.FRONTEND_APP_URL,
        },
    });

    return {
        user: toAuthUser(user, roleCode),
        refreshToken,
        sessionId,
        verifyToken,
    };
}

export type LoginResult =
    | { twoFactorRequired: true; pendingUserId: string }
    | { twoFactorRequired: false; user: ReturnType<typeof toAuthUser>; refreshToken: string; sessionId: string };

export async function loginUser(input: LoginBody, metadata?: SessionMetadata): Promise<LoginResult> {
    const user = await prisma.user.findFirst({
        where: { email: input.email, deletedAt: null },
        select: {
            id: true,
            uuid: true,
            organizationId: true,
            fullName: true,
            email: true,
            emailVerifiedAt: true,
            passwordHash: true,
            status: true,
            twoFactorEnabled: true,
            organizationMembers: {
                where: { status: "ACTIVE" },
                select: {
                    organizationId: true,
                    role: { select: { code: true } },
                },
            },
        },
    });

    if (!user || !user.passwordHash) {
        throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    }

    if (user.status === "SUSPENDED" || user.status === "DELETED") {
        throw Object.assign(new Error("Account is not active"), { statusCode: 403 });
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
        throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    }

    // Password correct — if 2FA is enabled, stop here and return a challenge token.
    if (user.twoFactorEnabled) {
        return { twoFactorRequired: true, pendingUserId: user.uuid };
    }

    const { refreshToken, sessionId } = await createSession(user.id, metadata);
    await sendSecurityAlertEmail({
        userId: user.id,
        event: "NEW_LOGIN",
        metadata,
    });
    return { twoFactorRequired: false, user: toAuthUser(user), refreshToken, sessionId };
}

export async function completeTwoFactorLogin(
    pendingUserId: string,
    code: string,
    metadata?: SessionMetadata,
) {
    const user = await prisma.user.findUnique({
        where: { uuid: pendingUserId, deletedAt: null },
        select: {
            id: true,
            uuid: true,
            organizationId: true,
            fullName: true,
            email: true,
            emailVerifiedAt: true,
            status: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            organizationMembers: {
                where: { status: "ACTIVE" },
                select: {
                    organizationId: true,
                    role: { select: { code: true } },
                },
            },
        },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw Object.assign(new Error("Invalid 2FA session"), { statusCode: 401 });
    }

    if (user.status === "SUSPENDED" || user.status === "DELETED") {
        throw Object.assign(new Error("Account is not active"), { statusCode: 403 });
    }

    const speakeasy = await import("speakeasy");
    const isValid = speakeasy.default.totp.verify({
        secret:   user.twoFactorSecret,
        encoding: "base32",
        token:    code,
        window:   1,
    });

    if (!isValid) {
        throw Object.assign(new Error("Invalid or expired authenticator code"), { statusCode: 401 });
    }

    const { refreshToken, sessionId } = await createSession(user.id, metadata);
    await sendSecurityAlertEmail({
        userId: user.id,
        event: "NEW_LOGIN",
        metadata,
    });
    return { user: toAuthUser(user), refreshToken, sessionId };
}

export async function logoutUser(
    userId: string | undefined,
    body: { refreshToken?: string },
) {
    if (body.refreshToken) {
        await prisma.userSession.updateMany({
            where: {
                refreshTokenHash: hashToken(body.refreshToken),
                status: "ACTIVE",
            },
            data: {
                status: "REVOKED",
                revokedAt: new Date(),
            },
        });
        return;
    }

    if (!userId) {
        return;
    }

    const user = await prisma.user.findUnique({
        where: { uuid: userId },
        select: { id: true },
    });

    if (!user) {
        return;
    }

    await prisma.userSession.updateMany({
        where: {
            userId: user.id,
            status: "ACTIVE",
        },
        data: {
            status: "REVOKED",
            revokedAt: new Date(),
        },
    });
}

export async function refreshAccessToken(
    input: RefreshBody,
    metadata?: SessionMetadata,
) {
    const tokenHash = hashToken(input.refreshToken);

    const session = await prisma.userSession.findFirst({
        where: {
            refreshTokenHash: tokenHash,
            status: "ACTIVE",
            revokedAt: null,
            expiresAt: { gt: new Date() },
        },
        include: {
            user: {
                select: {
                    id: true,
                    uuid: true,
                    organizationId: true,
                    fullName: true,
                    email: true,
                    emailVerifiedAt: true,
                    deletedAt: true,
                    status: true,
                    organizationMembers: {
                        where: { status: "ACTIVE" },
                        select: {
                            organizationId: true,
                            role: { select: { code: true } },
                        },
                    },
                },
            },
        },
    });

    if (
        !session ||
        !session.user ||
        session.user.deletedAt ||
        session.user.status === "DELETED"
    ) {
        throw Object.assign(new Error("Invalid refresh token"), {
            statusCode: 401,
        });
    }

    if (!session.user.emailVerifiedAt) {
        throw Object.assign(new Error("Email verification required"), {
            statusCode: 403,
        });
    }

    await prisma.userSession.update({
        where: { id: session.id },
        data: {
            status: "REVOKED",
            revokedAt: new Date(),
        },
    });

    const { refreshToken, sessionId } = await createSession(
        session.user.id,
        metadata,
    );

    return {
        user: toAuthUser(session.user),
        refreshToken,
        sessionId,
    };
}

export async function requestPasswordReset(input: ForgotPasswordBody) {
    const user = await prisma.user.findFirst({
        where: {
            email: input.email,
            deletedAt: null,
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        throw Object.assign(new Error("Email address not found"), {
            statusCode: 404,
        });
    }

    const resetToken = generateOpaqueToken();

    await prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            tokenHash: hashToken(resetToken),
            expiresAt: addMinutes(new Date(), PASSWORD_RESET_TTL_MINUTES),
        },
    });

    const resetUrl = `${env.FRONTEND_APP_URL}/reset-password?token=${resetToken}`;

    // We need the user's name for the template greeting
    const userRecord = await prisma.user.findFirst({
        where: { id: user.id },
        select: { fullName: true },
    });

    await enqueueEmail({
        to: input.email,
        subject: 'Reset your password',
        template: 'password-reset',
        templateData: {
            name: userRecord?.fullName ?? 'there',
            email: input.email,
            resetUrl,
            expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
            appUrl: env.FRONTEND_APP_URL,
        },
    });

    return { resetToken };
}

export async function resetPassword(input: ResetPasswordBody) {
    const token = await prisma.passwordResetToken.findFirst({
        where: {
            tokenHash: hashToken(input.token),
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
        include: {
            user: {
                select: {
                    id: true,
                    uuid: true,
                    organizationId: true,
                    fullName: true,
                    email: true,
                    emailVerifiedAt: true,
                    organizationMembers: {
                        where: { status: "ACTIVE" },
                        select: {
                            organizationId: true,
                            role: { select: { code: true } },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    if (!token || !token.user) {
        throw Object.assign(new Error("Invalid or expired reset token"), {
            statusCode: 400,
        });
    }

    const passwordHash = await hashPassword(input.password);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: token.userId },
            data: { passwordHash },
        }),
        prisma.passwordResetToken.update({
            where: { id: token.id },
            data: { usedAt: new Date() },
        }),
        prisma.userSession.updateMany({
            where: {
                userId: token.userId,
                status: "ACTIVE",
            },
            data: {
                status: "REVOKED",
                revokedAt: new Date(),
            },
        }),
    ]);

    await sendSecurityAlertEmail({
        userId: token.userId,
        event: "PASSWORD_RESET",
    });

    await invalidateUserCaches(token.user.uuid);
    return toAuthUser(token.user);
}

export async function verifyEmailAddress(input: VerifyEmailBody) {
    const record = await prisma.emailVerificationToken.findFirst({
        where: {
            tokenHash: hashToken(input.token),
            verifiedAt: null,
            expiresAt: { gt: new Date() },
        },
        include: {
            user: {
                select: {
                    id: true,
                    uuid: true,
                    organizationId: true,
                    fullName: true,
                    email: true,
                    emailVerifiedAt: true,
                    organizationMembers: {
                        where: { status: "ACTIVE" },
                        select: {
                            organizationId: true,
                            role: { select: { code: true } },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    if (!record || !record.user) {
        throw Object.assign(
            new Error("Invalid or expired verification token"),
            { statusCode: 400 },
        );
    }

    const now = new Date();

    await prisma.$transaction([
        prisma.emailVerificationToken.update({
            where: { id: record.id },
            data: { verifiedAt: now },
        }),
        prisma.user.update({
            where: { id: record.userId },
            data: {
                emailVerifiedAt: now,
                status: "ACTIVE",
            },
        }),
    ]);

    await invalidateUserCaches(record.user.uuid);

    await enqueueEmail({
        to: record.user.email,
        subject: 'Welcome to Docunova!',
        template: 'welcome',
        templateData: {
            name: record.user.fullName ?? 'there',
            dashboardUrl: `${env.FRONTEND_APP_URL}/dashboard`,
            appUrl: env.FRONTEND_APP_URL,
        },
    });

    return {
        ...toAuthUser(record.user),
        emailVerifiedAt: now,
    };
}

async function fetchGoogleAccessToken(code: string) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
        throw Object.assign(new Error("Google OAuth is not configured"), {
            statusCode: 503,
        });
    }

    const params = new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    });

    if (!response.ok) {
        let reason = "";
        try {
            const errorBody = (await response.json()) as {
                error?: string;
                error_description?: string;
            };
            reason = errorBody.error_description || errorBody.error || "";
        } catch {
            reason = await response.text();
        }

        throw Object.assign(
            new Error(
                `Google token exchange failed (status ${response.status})${
                    reason ? `: ${reason}` : ""
                }`,
            ),
            {
                statusCode: 401,
            },
        );
    }

    return (await response.json()) as GoogleTokenResponse;
}

async function fetchGoogleUserProfile(accessToken: string) {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        let reason = "";
        try {
            const errorBody = (await response.json()) as {
                error?: string;
                error_description?: string;
            };
            reason = errorBody.error_description || errorBody.error || "";
        } catch {
            reason = await response.text();
        }

        throw Object.assign(
            new Error(
                `Unable to fetch Google profile (status ${response.status})${
                    reason ? `: ${reason}` : ""
                }`,
            ),
            {
                statusCode: 401,
            },
        );
    }

    return (await response.json()) as GoogleUserProfile;
}

export async function authenticateGoogleUser(
    code: string,
    metadata?: SessionMetadata,
    options?: { source?: "login" | "signup" },
) {
    const tokenPayload = await fetchGoogleAccessToken(code);
    const profile = await fetchGoogleUserProfile(tokenPayload.access_token);

    if (!profile.email || !profile.sub) {
        throw Object.assign(
            new Error("Google account is missing required profile fields"),
            {
                statusCode: 400,
            },
        );
    }

    const invitation = await getPendingInvitationForEmail(profile.email);
    const invitationRole = toOrganizationRoleCode(invitation?.roleCode);
    const roleCode: OrganizationRoleCode = invitationRole ?? "admin";
    const organizationId =
        invitation?.organizationId ??
        (await getDefaultOrganizationId({
            fallbackFullName: profile.name ?? profile.given_name ?? "",
        }));

    let isNewUser = false;
    let user = await prisma.user.findFirst({
        where: {
            OR: [
                { providerUserId: profile.sub, authProvider: "GOOGLE" },
                { email: profile.email, deletedAt: null },
            ],
        },
        select: {
            id: true,
            uuid: true,
            organizationId: true,
            fullName: true,
            email: true,
            emailVerifiedAt: true,
            status: true,
            organizationMembers: {
                where: { status: "ACTIVE" },
                select: {
                    organizationId: true,
                    role: { select: { code: true } },
                },
            },
        },
    });

    if (!user) {
        isNewUser = true;
        const joinedAt = new Date();
        user = await prisma.$transaction(async (tx) => {
            const roleId = await ensureRoleId(tx, organizationId, roleCode);
            const createdUser = await tx.user.create({
                data: {
                    organizationId,
                    email: profile.email,
                    authProvider: "GOOGLE",
                    providerUserId: profile.sub,
                    fullName: profile.name ?? profile.given_name ?? "",
                    firstName: profile.given_name,
                    lastName: profile.family_name,
                    avatarUrl: profile.picture,
                    emailVerifiedAt: profile.email_verified ? new Date() : null,
                    status: "ACTIVE",
                },
                select: {
                    id: true,
                    uuid: true,
                    organizationId: true,
                    fullName: true,
                    email: true,
                    emailVerifiedAt: true,
                    status: true,
                },
            });

            await tx.organizationMember.create({
                data: {
                    organizationId,
                    userId: createdUser.id,
                    roleId,
                    status: "ACTIVE",
                    ...(invitation ? { invitedAt: joinedAt } : {}),
                    joinedAt,
                },
            });

            return {
                ...createdUser,
                organizationMembers: [
                    { organizationId: createdUser.organizationId, role: { code: roleCode } },
                ],
            };
        });
    } else {
        if (user.status === "SUSPENDED" || user.status === "DELETED") {
            throw Object.assign(new Error("Account is not active"), {
                statusCode: 403,
            });
        }

        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                authProvider: "GOOGLE",
                providerUserId: profile.sub,
                fullName: profile.name ?? user.fullName,
                firstName: profile.given_name,
                lastName: profile.family_name,
                avatarUrl: profile.picture,
                ...(profile.email_verified && !user.emailVerifiedAt
                    ? { emailVerifiedAt: new Date() }
                    : {}),
            },
            select: {
                id: true,
                uuid: true,
                organizationId: true,
                fullName: true,
                email: true,
                emailVerifiedAt: true,
                status: true,
                organizationMembers: {
                    where: { status: "ACTIVE" },
                    select: {
                        organizationId: true,
                        role: { select: { code: true } },
                    },
                },
            },
        });
    }

    if (options?.source === "signup" && isNewUser && user.emailVerifiedAt) {
        await enqueueEmail({
            to: user.email,
            subject: "Welcome to Docunova!",
            template: "welcome",
            templateData: {
                name: user.fullName ?? "there",
                dashboardUrl: `${env.FRONTEND_APP_URL}/dashboard`,
                appUrl: env.FRONTEND_APP_URL,
            },
        });
    }

    const { refreshToken, sessionId } = await createSession(user.id, metadata);
    await sendSecurityAlertEmail({
        userId: user.id,
        event: "NEW_LOGIN",
        metadata,
    });

    return {
        user: toAuthUser(user, isNewUser ? roleCode : undefined),
        refreshToken,
        sessionId,
        isNewUser,
    };
}
