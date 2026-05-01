import prisma from '../config/prisma';
import { createCanvas, loadImage } from 'canvas';
import { Readable } from 'stream';
import { getPaginationParams, buildPaginatedResult } from '../utils/pagination';
import { PaginationQuery } from '../types';
import { comparePassword, hashPassword } from '../utils/hash';
import { toAppRole, toRoleCode, toRoleName } from '../utils/roles';
import {
    UpdateProfileBody,
    ChangePasswordBody,
    UpdateNotificationPreferencesBody,
} from '../models/user.model';
import { cacheDel, cacheGetOrSet, cacheKey } from './cache.service';
import env from '../config/env';
import { uploadToStorage } from './storage.service';
import {
    sendSecurityAlertEmail,
    sendWeeklyEmailDigest,
} from './notification.service';

const USER_PROFILE_TTL_SECONDS = 300;
const ORGANIZATION_ROLE_CODES = ['superadmin', 'admin', 'member'] as const;
const AVATAR_SIZE_PX = 512;

function userProfileKey(uuid: string) {
    return cacheKey('user', 'profile', uuid);
}

function authKey(uuid: string) {
    return cacheKey('auth', uuid);
}

export async function invalidateUserCaches(uuid: string) {
    await cacheDel(userProfileKey(uuid), authKey(uuid));
}

export async function getUserById(uuid: string) {
    return cacheGetOrSet(userProfileKey(uuid), USER_PROFILE_TTL_SECONDS, async () => {
        const user = await prisma.user.findUnique({
            where: { uuid, deletedAt: null },
            select: {
                uuid:           true,
                fullName:       true,
                firstName:      true,
                lastName:       true,
                email:          true,
                phone:          true,
                avatarUrl:      true,
                authProvider:   true,
                emailVerifiedAt: true,
                emailDigestEnabled: true,
                securityAlertsEnabled: true,
                twoFactorEnabled: true,
                lastLoginAt:    true,
                createdAt:      true,
                updatedAt:      true,
                organization: {
                    select: { name: true },
                },
                organizationMembers: {
                    where: { status: 'ACTIVE' },
                    take: 1,
                    select: {
                        role: {
                            select: { code: true, name: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        }

        return toUserProfile(user);
    });
}

export async function getAllUsers(query: PaginationQuery) {
    const { page, limit, skip } = getPaginationParams(query);

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            skip,
            take: limit,
            where: { deletedAt: null },
            select: {
                uuid: true,
                fullName: true,
                email: true,
                createdAt: true,
                organizationMembers: {
                    where: { status: 'ACTIVE' },
                    take: 1,
                    select: {
                        role: { select: { code: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return buildPaginatedResult(
        users.map((u) => {
            const role = toAppRole(u.organizationMembers[0]?.role?.code);
            return {
                id: u.uuid,
                name: u.fullName ?? '',
                email: u.email,
                role,
                roleCode: toRoleCode(role),
                roleName: u.organizationMembers[0]?.role?.name ?? toRoleName(role),
                createdAt: u.createdAt,
            };
        }),
        total,
        page,
        limit,
    );
}

export async function updateUser(uuid: string, data: UpdateProfileBody) {
    const currentUser = await prisma.user.findUnique({
        where: { uuid, deletedAt: null },
        select: {
            id: true,
            organizationId: true,
            firstName: true,
            lastName: true,
            organizationMembers: {
                where: { status: 'ACTIVE' },
                take: 1,
                select: {
                    role: { select: { code: true } },
                },
            },
        },
    });

    if (!currentUser) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const actorRole = toAppRole(currentUser.organizationMembers?.[0]?.role?.code);
    const canManageRoleAndOrganization = actorRole === 'SUPERADMIN' || actorRole === 'ADMIN';
    const hasRoleUpdate = data.roleCode !== undefined;
    const hasOrganizationUpdate = data.organizationName !== undefined;

    if ((hasRoleUpdate || hasOrganizationUpdate) && !canManageRoleAndOrganization) {
        throw Object.assign(new Error('Only admin can update role and organization'), {
            statusCode: 403,
        });
    }

    // Derive fullName if individual name parts are provided
    let fullName: string | undefined;
    if (data.name) {
        fullName = data.name;
    } else if (data.firstName || data.lastName) {
        fullName = [data.firstName ?? currentUser.firstName ?? '', data.lastName ?? currentUser.lastName ?? '']
            .filter(Boolean)
            .join(' ') || undefined;
    }

    const user = await prisma.$transaction(async (tx) => {
        if (hasOrganizationUpdate) {
            const organizationName = data.organizationName?.trim();
            if (!organizationName) {
                throw Object.assign(new Error('Organization name cannot be empty'), {
                    statusCode: 400,
                });
            }

            await tx.organization.update({
                where: { id: currentUser.organizationId },
                data: {
                    name: organizationName,
                    updatedAt: new Date(),
                },
            });
        }

        if (hasRoleUpdate) {
            const normalizedRoleCode = data.roleCode?.trim().toLowerCase();
            if (!normalizedRoleCode) {
                throw Object.assign(new Error('Role is required'), {
                    statusCode: 400,
                });
            }

            if (!ORGANIZATION_ROLE_CODES.includes(normalizedRoleCode as (typeof ORGANIZATION_ROLE_CODES)[number])) {
                throw Object.assign(new Error('Invalid role for this organization'), {
                    statusCode: 400,
                });
            }

            if (normalizedRoleCode === 'superadmin' && actorRole !== 'SUPERADMIN') {
                throw Object.assign(new Error('Only superadmin can assign the superadmin role'), {
                    statusCode: 403,
                });
            }

            const role = await tx.role.upsert({
                where: {
                    organizationId_code: {
                        organizationId: currentUser.organizationId,
                        code: normalizedRoleCode,
                    },
                },
                create: {
                    organizationId: currentUser.organizationId,
                    code: normalizedRoleCode,
                    name: toRoleName(toAppRole(normalizedRoleCode)),
                    isSystem: true,
                },
                update: {},
                select: { id: true },
            });

            await tx.organizationMember.update({
                where: {
                    organizationId_userId: {
                        organizationId: currentUser.organizationId,
                        userId: currentUser.id,
                    },
                },
                data: {
                    roleId: role.id,
                    updatedAt: new Date(),
                },
            });
        }

        return tx.user.update({
            where: { id: currentUser.id },
            data: {
                ...(fullName        !== undefined ? { fullName }              : {}),
                ...(data.firstName  !== undefined ? { firstName: data.firstName } : {}),
                ...(data.lastName   !== undefined ? { lastName:  data.lastName  } : {}),
                ...(data.phone      !== undefined ? { phone:     data.phone      } : {}),
                updatedAt: new Date(),
            },
            select: {
                uuid:             true,
                fullName:         true,
                firstName:        true,
                lastName:         true,
                email:            true,
                phone:            true,
                avatarUrl:        true,
                authProvider:     true,
                emailVerifiedAt:  true,
                emailDigestEnabled: true,
                securityAlertsEnabled: true,
                twoFactorEnabled: true,
                lastLoginAt:      true,
                createdAt:        true,
                updatedAt:        true,
                organization: {
                    select: { name: true },
                },
                organizationMembers: {
                    where: { status: 'ACTIVE' },
                    take: 1,
                    select: {
                        role: {
                            select: { code: true, name: true },
                        },
                    },
                },
            },
        });
    });

    await invalidateUserCaches(uuid);
    return toUserProfile(user);
}

export async function changeUserPassword(uuid: string, data: ChangePasswordBody) {
    const user = await prisma.user.findUnique({
        where: { uuid, deletedAt: null },
        select: {
            id: true,
            authProvider: true,
            passwordHash: true,
        },
    });

    if (!user) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    if (user.authProvider !== 'LOCAL' || !user.passwordHash) {
        throw Object.assign(
            new Error('Password changes are only available for email/password accounts'),
            { statusCode: 400 },
        );
    }

    const currentPasswordMatches = await comparePassword(data.currentPassword, user.passwordHash);
    if (!currentPasswordMatches) {
        throw Object.assign(new Error('Current password is incorrect'), { statusCode: 401 });
    }

    if (data.currentPassword === data.newPassword) {
        throw Object.assign(new Error('New password must be different from current password'), { statusCode: 400 });
    }

    const newPasswordHash = await hashPassword(data.newPassword);
    const now = new Date();

    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
                updatedAt: now,
            },
        }),
        prisma.userSession.updateMany({
            where: {
                userId: user.id,
                status: 'ACTIVE',
            },
            data: {
                status: 'REVOKED',
                revokedAt: now,
            },
        }),
    ]);

    await sendSecurityAlertEmail({
        userId: user.id,
        event: 'PASSWORD_CHANGED',
    });

    await invalidateUserCaches(uuid);
}

export async function updateUserNotificationPreferences(
    uuid: string,
    data: UpdateNotificationPreferencesBody,
) {
    const user = await prisma.user.update({
        where: { uuid, deletedAt: null },
        data: {
            ...(data.emailDigests !== undefined
                ? { emailDigestEnabled: data.emailDigests }
                : {}),
            ...(data.securityAlerts !== undefined
                ? { securityAlertsEnabled: data.securityAlerts }
                : {}),
            updatedAt: new Date(),
        },
        select: {
            emailDigestEnabled: true,
            securityAlertsEnabled: true,
        },
    });

    await invalidateUserCaches(uuid);

    return {
        emailDigests: user.emailDigestEnabled,
        securityAlerts: user.securityAlertsEnabled,
    };
}

export async function sendUserEmailDigest(uuid: string) {
    const user = await prisma.user.findUnique({
        where: { uuid, deletedAt: null },
        select: { id: true },
    });
    if (!user) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    await sendWeeklyEmailDigest(user.id);
}

export async function uploadUserAvatar(uuid: string, input: {
    buffer: Buffer;
    mimeType: string;
}) {
    const user = await prisma.user.findUnique({
        where: { uuid, deletedAt: null },
        select: {
            id: true,
            uuid: true,
            organization: { select: { uuid: true } },
        },
    });
    if (!user) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const image = await loadImage(input.buffer);
    const canvas = createCanvas(AVATAR_SIZE_PX, AVATAR_SIZE_PX);
    const ctx = canvas.getContext('2d');

    // Keep source crop square-centered so server output always matches required JPG format.
    const sourceSize = Math.min(image.width, image.height);
    const sourceX = Math.max(0, (image.width - sourceSize) / 2);
    const sourceY = Math.max(0, (image.height - sourceSize) / 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX);
    ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        AVATAR_SIZE_PX,
        AVATAR_SIZE_PX,
    );

    const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: 0.92 });
    const relativePath = `${user.organization.uuid}/${user.uuid}/${user.uuid}.jpg`;
    const { storageKey } = await uploadToStorage(
        Readable.from(jpegBuffer),
        relativePath,
        'image/jpeg',
        { basePath: env.PROFILE_STORAGE_PATH },
    );

    const publicBase = env.S3_URL?.replace(/\/+$/, '') || '';
    const avatarUrl = publicBase ? `${publicBase}/${storageKey}` : storageKey;

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            avatarUrl,
            updatedAt: new Date(),
        },
        select: {
            uuid:           true,
            fullName:       true,
            firstName:      true,
            lastName:       true,
            email:          true,
            phone:          true,
            avatarUrl:      true,
            authProvider:   true,
            emailVerifiedAt: true,
            emailDigestEnabled: true,
            securityAlertsEnabled: true,
            twoFactorEnabled: true,
            lastLoginAt:    true,
            createdAt:      true,
            updatedAt:      true,
            organization: {
                select: { name: true },
            },
            organizationMembers: {
                where: { status: 'ACTIVE' },
                take: 1,
                select: {
                    role: {
                        select: { code: true, name: true },
                    },
                },
            },
        },
    });

    await invalidateUserCaches(uuid);
    return toUserProfile(updated);
}

export async function deleteUser(id: string) {
    await prisma.user.delete({ where: { uuid: id } });
    await invalidateUserCaches(id);
}

export async function deleteUserAccount(uuid: string) {
    const user = await prisma.user.findUnique({ where: { uuid }, select: { id: true } });
    if (!user) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    await prisma.$transaction([
        // Revoke all sessions
        prisma.userSession.updateMany({
            where: { userId: user.id, status: 'ACTIVE' },
            data:  { status: 'REVOKED', revokedAt: new Date() },
        }),
        // Soft-delete the user
        prisma.user.update({
            where: { id: user.id },
            data:  { deletedAt: new Date(), status: 'DELETED' },
        }),
    ]);

    await invalidateUserCaches(uuid);
}

export async function getUserSessions(uuid: string) {
    const user = await prisma.user.findUnique({ where: { uuid }, select: { id: true } });
    if (!user) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const sessions = await prisma.userSession.findMany({
        where:   { userId: user.id, status: 'ACTIVE', expiresAt: { gt: new Date() } },
        select:  {
            uuid:       true,
            userAgent:  true,
            deviceName: true,
            deviceType: true,
            browser:    true,
            os:         true,
            lastSeenAt: true,
            expiresAt:  true,
            createdAt:  true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
        id:         s.uuid,
        userAgent:  s.userAgent  ?? null,
        deviceName: s.deviceName ?? null,
        deviceType: s.deviceType ?? null,
        browser:    s.browser    ?? null,
        os:         s.os         ?? null,
        lastSeenAt: s.lastSeenAt ?? null,
        expiresAt:  s.expiresAt,
        createdAt:  s.createdAt,
    }));
}

export async function getUserAccessLogs(userUuid: string, query: PaginationQuery) {
    const user = await prisma.user.findUnique({ where: { uuid: userUuid }, select: { id: true } });
    if (!user) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const { page, limit, skip } = getPaginationParams(query);
    const now = new Date();

    const [rows, total] = await Promise.all([
        prisma.userSession.findMany({
            where: { userId: user.id },
            skip,
            take: limit,
            select: {
                uuid: true,
                status: true,
                userAgent: true,
                deviceName: true,
                deviceType: true,
                browser: true,
                os: true,
                lastSeenAt: true,
                expiresAt: true,
                revokedAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.userSession.count({ where: { userId: user.id } }),
    ]);

    const logs = rows.map((row) => {
        const status = row.status === 'REVOKED'
            ? 'REVOKED'
            : row.expiresAt <= now
              ? 'EXPIRED'
              : 'ACTIVE';

        return {
            id: row.uuid,
            event: 'SIGN_IN',
            status,
            userAgent: row.userAgent ?? null,
            deviceName: row.deviceName ?? null,
            deviceType: row.deviceType ?? null,
            browser: row.browser ?? null,
            os: row.os ?? null,
            createdAt: row.createdAt,
            lastSeenAt: row.lastSeenAt ?? null,
            endedAt: row.revokedAt ?? (status === 'EXPIRED' ? row.expiresAt : null),
        };
    });

    return buildPaginatedResult(logs, total, page, limit);
}

export async function revokeUserSession(userUuid: string, sessionUuid: string) {
    const user = await prisma.user.findUnique({ where: { uuid: userUuid }, select: { id: true } });
    if (!user) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const session = await prisma.userSession.findFirst({
        where: { uuid: sessionUuid, userId: user.id, status: 'ACTIVE' },
        select: { id: true },
    });

    if (!session) {
        throw Object.assign(new Error('Session not found'), { statusCode: 404 });
    }

    await prisma.userSession.update({
        where: { id: session.id },
        data:  { status: 'REVOKED', revokedAt: new Date() },
    });
}

function startOfUtcDay(input: Date) {
    const d = new Date(input);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function addUtcDays(input: Date, days: number) {
    const d = new Date(input);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}

function startOfUtcWeekMonday(input: Date) {
    const dayStart = startOfUtcDay(input);
    const day = dayStart.getUTCDay(); // 0 Sun ... 6 Sat
    const offsetFromMonday = (day + 6) % 7;
    return addUtcDays(dayStart, -offsetFromMonday);
}

function startOfUtcMonth(input: Date) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), 1, 0, 0, 0, 0));
}

function addUtcMonths(input: Date, months: number) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth() + months, 1, 0, 0, 0, 0));
}

type TrendBucket = {
    label: string;
    startDate: Date;
    endDate: Date;
    count: number;
};

function buildWeeklyBuckets(now: Date, weeks: number): TrendBucket[] {
    const currentWeekStart = startOfUtcWeekMonday(now);
    const firstWeekStart = addUtcDays(currentWeekStart, -7 * (weeks - 1));
    const out: TrendBucket[] = [];

    for (let i = 0; i < weeks; i += 1) {
        const startDate = addUtcDays(firstWeekStart, i * 7);
        const endDate = addUtcDays(startDate, 7);
        out.push({
            label: `W${i + 1}`,
            startDate,
            endDate,
            count: 0,
        });
    }

    return out;
}

function buildDailyBuckets(now: Date, days: number): TrendBucket[] {
    const currentDayStart = startOfUtcDay(now);
    const firstDayStart = addUtcDays(currentDayStart, -(days - 1));
    const out: TrendBucket[] = [];

    for (let i = 0; i < days; i += 1) {
        const startDate = addUtcDays(firstDayStart, i);
        const endDate = addUtcDays(startDate, 1);
        out.push({
            label: days <= 7
                ? startDate.toLocaleString('en-US', { weekday: 'short' })
                : startDate.toLocaleString('en-US', { month: 'short', day: 'numeric' }),
            startDate,
            endDate,
            count: 0,
        });
    }

    return out;
}

function buildMonthlyBuckets(now: Date, months: number): TrendBucket[] {
    const currentMonthStart = startOfUtcMonth(now);
    const firstMonthStart = addUtcMonths(currentMonthStart, -(months - 1));
    const out: TrendBucket[] = [];

    for (let i = 0; i < months; i += 1) {
        const startDate = addUtcMonths(firstMonthStart, i);
        const endDate = addUtcMonths(startDate, 1);
        out.push({
            label: startDate.toLocaleString('en-US', { month: 'short' }),
            startDate,
            endDate,
            count: 0,
        });
    }

    return out;
}

function incrementBucketsByDate(buckets: TrendBucket[], value: Date) {
    const t = value.getTime();
    for (const bucket of buckets) {
        if (t >= bucket.startDate.getTime() && t < bucket.endDate.getTime()) {
            bucket.count += 1;
            break;
        }
    }
}

type DashboardInsightDocument = {
    uuid: string;
    title: string;
    originalFilename: string;
    metadataJson: unknown;
    updatedAt: Date;
    aiSummaries: Array<{ summaryText: string }>;
};

type SummaryRiskItem = {
    title?: unknown;
    severity?: unknown;
    details?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function parseSummaryText(value: string | undefined): Record<string, unknown> {
    if (!value) return {};
    try {
        return asRecord(JSON.parse(value));
    } catch {
        return {};
    }
}

function firstString(
    source: Record<string, unknown>,
    keys: string[],
): string | null {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
}

function firstNumber(
    source: Record<string, unknown>,
    keys: string[],
): number | null {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            const parsed = Number(value.replace(/,/g, '').trim());
            if (Number.isFinite(parsed)) return parsed;
        }
    }
    return null;
}

function mergeDocumentInsightData(doc: DashboardInsightDocument) {
    return {
        ...parseSummaryText(doc.aiSummaries[0]?.summaryText),
        ...asRecord(doc.metadataJson),
    };
}

function normalizeSeverity(value: unknown): 'high' | 'medium' | 'low' | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
        return normalized;
    }
    return null;
}

function riskSeverityScore(value: 'high' | 'medium' | 'low') {
    if (value === 'high') return 3;
    if (value === 'medium') return 2;
    return 1;
}

function buildRiskiestContracts(docs: DashboardInsightDocument[]) {
    return docs
        .map((doc) => {
            const data = mergeDocumentInsightData(doc);
            const riskItems = Array.isArray(data.risk_items)
                ? (data.risk_items as SummaryRiskItem[])
                : [];
            const redFlags = firstString(data, ['redFlags', 'red_flags', 'riskFlags', 'risks']);
            const riskSummary =
                redFlags ||
                riskItems
                    .map((item) =>
                        typeof item.details === 'string' && item.details.trim()
                            ? item.details.trim()
                            : typeof item.title === 'string'
                              ? item.title.trim()
                              : '',
                    )
                    .filter(Boolean)
                    .slice(0, 2)
                    .join(' · ');
            const severities = riskItems
                .map((item) => normalizeSeverity(item.severity))
                .filter((value): value is 'high' | 'medium' | 'low' => value !== null);
            const baseScore = severities.reduce(
                (sum, severity) => sum + riskSeverityScore(severity),
                0,
            );
            const score = baseScore + (redFlags ? 2 : 0);
            const highestSeverity = severities.sort(
                (a, b) => riskSeverityScore(b) - riskSeverityScore(a),
            )[0] ?? (redFlags ? 'medium' : null);

            return {
                id: doc.uuid,
                title: doc.title || doc.originalFilename,
                score,
                riskCount: riskItems.length + (redFlags ? 1 : 0),
                highestSeverity,
                summary: riskSummary || null,
                updatedAt: doc.updatedAt,
            };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 5);
}

function parseRenewalDate(value: string | null): Date | null {
    if (!value) return null;

    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;

    const match = value.match(
        /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i,
    );
    if (!match) return null;
    const parsed = new Date(match[0]);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildUpcomingRenewals(docs: DashboardInsightDocument[], now: Date) {
    const today = startOfUtcDay(now);

    return docs
        .map((doc) => {
            const data = mergeDocumentInsightData(doc);
            const renewalText = firstString(data, [
                'renewalDate',
                'renewal_date',
                'renewalTerms',
                'renewal_terms',
                'term',
                'effectiveDate',
                'effective_date',
            ]);
            const renewalDate = parseRenewalDate(renewalText);
            if (!renewalDate || renewalDate < today) return null;

            const daysUntil = Math.ceil(
                (startOfUtcDay(renewalDate).getTime() - today.getTime()) /
                    (24 * 60 * 60 * 1000),
            );

            return {
                id: doc.uuid,
                title: doc.title || doc.originalFilename,
                renewalDate,
                daysUntil,
                renewalTerms:
                    firstString(data, ['renewalTerms', 'renewal_terms']) ?? renewalText,
            };
        })
        .filter(
            (item): item is {
                id: string;
                title: string;
                renewalDate: Date;
                daysUntil: number;
                renewalTerms: string | null;
            } => item !== null,
        )
        .sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime())
        .slice(0, 5);
}

function parseCurrencyAmount(value: string | null) {
    if (!value) return null;

    const match = value.match(
        /(?:(USD|INR|EUR|GBP|AUD|CAD)\s*)?([$€£₹])?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    );
    if (!match) return null;

    const amount = Number(match[3].replace(/,/g, ''));
    if (!Number.isFinite(amount)) return null;

    const symbolCurrencyMap: Record<string, string> = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '₹': 'INR',
    };
    const currency =
        match[1]?.toUpperCase() ??
        (match[2] ? symbolCurrencyMap[match[2]] : null);

    return { amount, currency };
}

function buildSpendOverview(docs: DashboardInsightDocument[]) {
    let amount = 0;
    let documentCount = 0;
    const currencyCounts = new Map<string, number>();

    for (const doc of docs) {
        const data = mergeDocumentInsightData(doc);
        const explicitAmount = firstNumber(data, [
            'totalSpend',
            'total_spend',
            'spendAmount',
            'spend_amount',
        ]);
        const explicitCurrency = firstString(data, [
            'spendCurrency',
            'spend_currency',
            'currency',
        ]);
        const parsed =
            explicitAmount !== null
                ? { amount: explicitAmount, currency: explicitCurrency }
                : parseCurrencyAmount(firstString(data, ['payment', 'paymentTerms']));

        if (!parsed || parsed.amount <= 0) continue;

        amount += parsed.amount;
        documentCount += 1;
        if (parsed.currency) {
            currencyCounts.set(
                parsed.currency,
                (currencyCounts.get(parsed.currency) ?? 0) + 1,
            );
        }
    }

    const currencyEntries = Array.from(currencyCounts.entries()).sort(
        (a, b) => b[1] - a[1],
    );

    return {
        amount,
        currency:
            currencyEntries.length === 1 ? currencyEntries[0][0] : null,
        documentCount,
        mixedCurrencies: currencyEntries.length > 1,
    };
}

export async function getUserDashboardOverview(userUuid: string) {
    const user = await prisma.user.findUnique({
        where: { uuid: userUuid, deletedAt: null },
        select: {
            id: true,
            fullName: true,
            organizationId: true,
            organization: {
                select: {
                    uuid: true,
                    name: true,
                    maxStorageBytes: true,
                },
            },
            organizationMembers: {
                where: { status: 'ACTIVE' },
                take: 1,
                select: {
                    role: { select: { code: true, name: true } },
                },
            },
        },
    });

    if (!user) {
        throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const now = new Date();

    const [
        activeStorageAgg,
        activeTeamMemberCount,
        docStatusCounts,
        trashedDocuments,
        recentDocuments,
        organizationMembers,
        uploadedDocsForTrend,
        classificationCounts,
        insightDocuments,
    ] = await Promise.all([
        prisma.document.aggregate({
            where: {
                organizationId: user.organizationId,
                deletedAt: null,
            },
            _sum: { fileSizeBytes: true },
        }),
        prisma.organizationMember.count({
            where: {
                organizationId: user.organizationId,
                status: 'ACTIVE',
            },
        }),
        // One grouped query replaces 6 separate count queries for non-deleted docs.
        prisma.document.groupBy({
            by: ['status'],
            where: {
                organizationId: user.organizationId,
                deletedAt: null,
            },
            _count: { _all: true },
        }),
        prisma.document.count({
            where: {
                organizationId: user.organizationId,
                status: 'TRASHED',
            },
        }),
        prisma.document.findMany({
            where: {
                organizationId: user.organizationId,
                deletedAt: null,
            },
            orderBy: { updatedAt: 'desc' },
            take: 6,
            select: {
                uuid: true,
                title: true,
                originalFilename: true,
                mimeType: true,
                fileSizeBytes: true,
                status: true,
                uploadedAt: true,
                updatedAt: true,
                owner: {
                    select: { fullName: true, email: true },
                },
            },
        }),
        prisma.organizationMember.findMany({
            where: {
                organizationId: user.organizationId,
                status: 'ACTIVE',
            },
            select: {
                uuid: true,
                joinedAt: true,
                invitedAt: true,
                createdAt: true,
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        lastLoginAt: true,
                    },
                },
            },
            take: 50,
        }),
        prisma.document.findMany({
            where: {
                organizationId: user.organizationId,
                uploadedAt: {
                    gte: addUtcMonths(startOfUtcMonth(now), -11),
                },
            },
            select: {
                uploadedAt: true,
            },
        }),
        prisma.documentClassification.groupBy({
            by: ['classLabel'],
            where: {
                isPrimary: true,
                document: {
                    organizationId: user.organizationId,
                    deletedAt: null,
                },
            },
            _count: {
                _all: true,
            },
        }),
        prisma.document.findMany({
            where: {
                organizationId: user.organizationId,
                deletedAt: null,
                status: 'READY',
            },
            orderBy: { updatedAt: 'desc' },
            take: 100,
            select: {
                uuid: true,
                title: true,
                originalFilename: true,
                metadataJson: true,
                updatedAt: true,
                aiSummaries: {
                    where: { summaryType: 'general' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { summaryText: true },
                },
            },
        }),
    ]);

    const usedBytes = activeStorageAgg._sum.fileSizeBytes ?? 0n;
    const totalBytes = user.organization.maxStorageBytes > 0n
        ? user.organization.maxStorageBytes
        : null;
    const usagePercent = totalBytes && totalBytes > 0n
        ? Number((usedBytes * 10000n) / totalBytes) / 100
        : null;

    const last7DaysBuckets = buildDailyBuckets(now, 7);
    const last30DaysBuckets = buildDailyBuckets(now, 30);
    const last12MonthsBuckets = buildMonthlyBuckets(now, 12);
    for (const d of uploadedDocsForTrend) {
        incrementBucketsByDate(last7DaysBuckets, d.uploadedAt);
        incrementBucketsByDate(last30DaysBuckets, d.uploadedAt);
        incrementBucketsByDate(last12MonthsBuckets, d.uploadedAt);
    }

    const teamEvents = organizationMembers
        .flatMap((member) => {
            const actor = member.user.fullName || member.user.email;
            const events: Array<{ id: string; type: string; actor: string; eventAt: Date; message: string; }> = [];

            if (member.user.lastLoginAt) {
                events.push({
                    id: `${member.uuid}-signin`,
                    type: 'SIGN_IN',
                    actor,
                    eventAt: member.user.lastLoginAt,
                    message: `${actor} signed in`,
                });
            }

            if (member.joinedAt) {
                events.push({
                    id: `${member.uuid}-joined`,
                    type: 'JOINED',
                    actor,
                    eventAt: member.joinedAt,
                    message: `${actor} joined the organization`,
                });
            } else if (member.invitedAt) {
                events.push({
                    id: `${member.uuid}-invited`,
                    type: 'INVITED',
                    actor,
                    eventAt: member.invitedAt,
                    message: `${actor} was invited`,
                });
            } else {
                events.push({
                    id: `${member.uuid}-created`,
                    type: 'MEMBER_ADDED',
                    actor,
                    eventAt: member.createdAt,
                    message: `${actor} became a team member`,
                });
            }

            return events;
        })
        .sort((a, b) => b.eventAt.getTime() - a.eventAt.getTime())
        .slice(0, 6);
    const riskiestContracts = buildRiskiestContracts(insightDocuments);
    const upcomingRenewals = buildUpcomingRenewals(insightDocuments, now);
    const totalSpend = buildSpendOverview(insightDocuments);

    return {
        generatedAt: now,
        user: {
            name: user.fullName ?? '',
            roleCode: user.organizationMembers?.[0]?.role?.code ?? null,
            roleName: user.organizationMembers?.[0]?.role?.name ?? null,
        },
        organization: {
            id: user.organization.uuid,
            name: user.organization.name,
        },
        storage: {
            usedBytes,
            totalBytes,
            usagePercent,
        },
        documentCounts: {
            total: docStatusCounts.reduce((sum, r) => sum + r._count._all, 0),
            ready: docStatusCounts.find((r) => r.status === 'READY')?._count._all ?? 0,
            processing: docStatusCounts.find((r) => r.status === 'PROCESSING')?._count._all ?? 0,
            uploaded: docStatusCounts.find((r) => r.status === 'UPLOADED')?._count._all ?? 0,
            archived: docStatusCounts.find((r) => r.status === 'ARCHIVED')?._count._all ?? 0,
            failed: docStatusCounts.find((r) => r.status === 'FAILED')?._count._all ?? 0,
            trashed: trashedDocuments,
        },
        contractInsights: {
            riskiestContracts,
            upcomingRenewals,
            totalSpend,
        },
        teamMemberCount: activeTeamMemberCount,
        recentDocuments: recentDocuments.map((doc) => ({
            id: doc.uuid,
            title: doc.title,
            originalFilename: doc.originalFilename,
            mimeType: doc.mimeType,
            fileSizeBytes: doc.fileSizeBytes,
            status: doc.status,
            uploadedAt: doc.uploadedAt,
            updatedAt: doc.updatedAt,
            ownerName: doc.owner.fullName || doc.owner.email,
        })),
        teamActivity: teamEvents,
        uploadTrend: {
            last7Days: last7DaysBuckets,
            last30Days: last30DaysBuckets,
            last12Months: last12MonthsBuckets,
        },
        documentClassificationCounts: classificationCounts
            .map((item) => ({
                label: item.classLabel,
                count: item._count._all,
            }))
            .sort((a, b) => b.count - a.count),
    };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function toUserProfile(user: {
    uuid:             string;
    fullName?:        string | null;
    firstName?:       string | null;
    lastName?:        string | null;
    email:            string;
    phone?:           string | null;
    avatarUrl?:       string | null;
    authProvider?:    string;
    emailVerifiedAt?: Date | null;
    emailDigestEnabled?: boolean;
    securityAlertsEnabled?: boolean;
    twoFactorEnabled?: boolean;
    lastLoginAt?:     Date | null;
    createdAt?:       Date;
    updatedAt?:       Date;
    organization?:    { name: string } | null;
    organizationMembers?: Array<{
        role?: {
            code: string;
            name: string;
        } | null;
    }>;
}) {
    const activeRole = user.organizationMembers?.[0]?.role ?? null;
    const appRole = toAppRole(activeRole?.code);

    return {
        id:               user.uuid,
        name:             user.fullName    ?? '',
        firstName:        user.firstName   ?? null,
        lastName:         user.lastName    ?? null,
        email:            user.email,
        phone:            user.phone       ?? null,
        avatarUrl:        user.avatarUrl   ?? null,
        authProvider:     user.authProvider ?? 'LOCAL',
        emailVerifiedAt:  user.emailVerifiedAt ?? null,
        emailDigestsEnabled: user.emailDigestEnabled ?? true,
        securityAlertsEnabled: user.securityAlertsEnabled ?? true,
        twoFactorEnabled: user.twoFactorEnabled ?? false,
        lastLoginAt:      user.lastLoginAt  ?? null,
        createdAt:        user.createdAt    ?? null,
        updatedAt:        user.updatedAt    ?? null,
        organizationName: user.organization?.name ?? null,
        role:             appRole,
        roleCode:         activeRole?.code ?? toRoleCode(appRole),
        roleName:         activeRole?.name ?? toRoleName(appRole),
    };
}
