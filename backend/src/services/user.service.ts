import prisma from '../config/prisma';
import { getPaginationParams, buildPaginatedResult } from '../utils/pagination';
import { PaginationQuery } from '../types';
import { UpdateProfileBody } from '../models/user.model';

export async function getUserById(uuid: string) {
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
}

export async function getAllUsers(query: PaginationQuery) {
    const { page, limit, skip } = getPaginationParams(query);

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            skip,
            take: limit,
            where: { deletedAt: null },
            select: { uuid: true, fullName: true, email: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return buildPaginatedResult(
        users.map((u) => ({ id: u.uuid, name: u.fullName ?? '', email: u.email, role: 'USER', createdAt: u.createdAt })),
        total,
        page,
        limit,
    );
}

export async function updateUser(uuid: string, data: UpdateProfileBody) {
    // Derive fullName if individual name parts are provided
    let fullName: string | undefined;
    if (data.name) {
        fullName = data.name;
    } else if (data.firstName || data.lastName) {
        const user = await prisma.user.findUnique({ where: { uuid }, select: { firstName: true, lastName: true } });
        fullName = [data.firstName ?? user?.firstName ?? '', data.lastName ?? user?.lastName ?? '']
            .filter(Boolean)
            .join(' ') || undefined;
    }

    const user = await prisma.user.update({
        where: { uuid, deletedAt: null },
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

    return toUserProfile(user);
}

export async function deleteUser(id: string) {
    await prisma.user.delete({ where: { uuid: id } });
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
        twoFactorEnabled: user.twoFactorEnabled ?? false,
        lastLoginAt:      user.lastLoginAt  ?? null,
        createdAt:        user.createdAt    ?? null,
        updatedAt:        user.updatedAt    ?? null,
        organizationName: user.organization?.name ?? null,
        roleCode:         activeRole?.code ?? null,
        roleName:         activeRole?.name ?? null,
    };
}
