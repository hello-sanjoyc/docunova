import { createHash, randomBytes } from "crypto";
import prisma from "../config/prisma";
import env from "../config/env";
import { enqueueEmail } from "../queues/email.queue";
import {
    InviteMembersBody,
    MemberListQuery,
    OrganizationRoleCode,
} from "../models/organization.model";
import { getPaginationParams, buildPaginatedResult } from "../utils/pagination";

const INVITATION_TTL_DAYS = 7;

function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

function generateOpaqueToken() {
    return randomBytes(32).toString("hex");
}

function addDays(base: Date, days: number) {
    const date = new Date(base);
    date.setDate(date.getDate() + days);
    return date;
}

async function getUserOrganizationId(userUuid: string) {
    const user = await prisma.user.findUnique({
        where: { uuid: userUuid, deletedAt: null },
        select: { id: true, organizationId: true },
    });

    if (!user) {
        throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }

    return { userId: user.id, organizationId: user.organizationId };
}

async function resolveRoleId(
    organizationId: bigint,
    roleCode: OrganizationRoleCode,
): Promise<bigint | null> {
    const role = await prisma.role.findFirst({
        where: { organizationId, code: roleCode },
        select: { id: true },
    });
    return role?.id ?? null;
}

export async function listMembers(userUuid: string, query: MemberListQuery) {
    const { organizationId } = await getUserOrganizationId(userUuid);
    const { page, limit, skip } = getPaginationParams(query);
    const statusFilter = query.status ?? "active";

    const memberWhere =
        statusFilter === "all"
            ? { organizationId }
            : statusFilter === "invited"
                ? { organizationId, status: "INVITED" as const }
                : { organizationId, status: "ACTIVE" as const };

    const members = await prisma.organizationMember.findMany({
        where: memberWhere,
        orderBy: { createdAt: "desc" },
        select: {
            uuid:      true,
            title:     true,
            status:    true,
            invitedAt: true,
            joinedAt:  true,
            createdAt: true,
            user: {
                select: {
                    uuid:      true,
                    email:     true,
                    fullName:  true,
                    avatarUrl: true,
                    status:    true,
                    lastLoginAt: true,
                },
            },
            role: { select: { code: true, name: true } },
        },
    });

    const memberData = members.map((m) => ({
        id:        m.uuid,
        status:    m.status,
        title:     m.title ?? null,
        invitedAt: m.invitedAt,
        joinedAt:  m.joinedAt,
        createdAt: m.createdAt,
        role:      m.role ? { code: m.role.code, name: m.role.name } : null,
        user: {
            id:          m.user.uuid,
            email:       m.user.email,
            name:        m.user.fullName ?? "",
            avatarUrl:   m.user.avatarUrl ?? null,
            status:      m.user.status,
            lastLoginAt: m.user.lastLoginAt ?? null,
        },
    }));

    let invitationData: Array<{
        id: string;
        status: "INVITED";
        title: null;
        invitedAt: Date;
        joinedAt: null;
        createdAt: Date;
        role: { code: string; name: string } | null;
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: null;
            status: "INVITED";
            lastLoginAt: null;
        };
    }> = [];

    if (statusFilter !== "active") {
        const pendingInvitations = await prisma.organizationInvitation.findMany({
            where: {
                organizationId,
                status: "PENDING",
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
            select: {
                uuid: true,
                email: true,
                roleCode: true,
                createdAt: true,
            },
        });

        const roleCodes = Array.from(
            new Set(
                pendingInvitations
                    .map((invitation) => invitation.roleCode)
                    .filter((value): value is string => Boolean(value)),
            ),
        );

        const roleNameMap = new Map<string, string>();
        if (roleCodes.length > 0) {
            const roles = await prisma.role.findMany({
                where: {
                    organizationId,
                    code: { in: roleCodes },
                },
                select: { code: true, name: true },
            });
            roles.forEach((role) => roleNameMap.set(role.code, role.name));
        }

        invitationData = pendingInvitations.map((invitation) => {
            const roleCode = invitation.roleCode?.toLowerCase() ?? null;
            const roleName = roleCode
                ? roleNameMap.get(roleCode) ??
                  `${roleCode.charAt(0).toUpperCase()}${roleCode.slice(1)}`
                : null;

            return {
                id:        invitation.uuid,
                status:    "INVITED",
                title:     null,
                invitedAt: invitation.createdAt,
                joinedAt:  null,
                createdAt: invitation.createdAt,
                role: roleCode && roleName ? { code: roleCode, name: roleName } : null,
                user: {
                    id:         invitation.uuid,
                    email:      invitation.email,
                    name:       invitation.email,
                    avatarUrl:  null,
                    status:     "INVITED",
                    lastLoginAt: null,
                },
            };
        });
    }

    const combinedData = [...memberData, ...invitationData].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = combinedData.length;
    const data = combinedData.slice(skip, skip + limit);

    return buildPaginatedResult(data, total, page, limit);
}

interface InviteOutcome {
    email: string;
    status: "invited" | "re-invited" | "already_member" | "failed";
    message?: string;
}

export async function inviteMembers(
    inviterUuid: string,
    body: InviteMembersBody,
) {
    const { userId: inviterId, organizationId } = await getUserOrganizationId(inviterUuid);

    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
    });
    if (!org) {
        throw Object.assign(new Error("Organization not found"), { statusCode: 404 });
    }

    const inviter = await prisma.user.findUnique({
        where: { id: inviterId },
        select: { fullName: true, email: true },
    });

    const normalizedEmails = Array.from(
        new Set(body.emails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
    );

    const outcomes: InviteOutcome[] = [];

    for (const email of normalizedEmails) {
        const existingMember = await prisma.organizationMember.findFirst({
            where: {
                organizationId,
                status: { in: ["ACTIVE", "INVITED"] },
                user: { email, deletedAt: null },
            },
            select: { id: true, status: true },
        });

        if (existingMember && existingMember.status === "ACTIVE") {
            outcomes.push({ email, status: "already_member" });
            continue;
        }

        // Revoke any prior pending invitations for this email on this org
        await prisma.organizationInvitation.updateMany({
            where: {
                organizationId,
                email,
                status: "PENDING",
            },
            data: { status: "REVOKED", revokedAt: new Date() },
        });

        const token = generateOpaqueToken();
        await prisma.organizationInvitation.create({
            data: {
                organizationId,
                email,
                roleCode:  body.role,
                tokenHash: hashToken(token),
                invitedBy: inviterId,
                expiresAt: addDays(new Date(), INVITATION_TTL_DAYS),
                status:    "PENDING",
            },
        });

        const inviteUrl = `${env.FRONTEND_APP_URL}/invitations/${token}`;

        await enqueueEmail({
            to: email,
            subject: `You're invited to join ${org.name} on Docunova`,
            template: "invite-member",
            templateData: {
                organizationName: org.name,
                inviterName:      inviter?.fullName || inviter?.email || "A teammate",
                inviterEmail:     inviter?.email ?? "",
                role:             body.role,
                inviteUrl,
                expiresInDays:    INVITATION_TTL_DAYS,
                appUrl:           env.FRONTEND_APP_URL,
            },
        });

        outcomes.push({
            email,
            status: existingMember ? "re-invited" : "invited",
        });
    }

    const sentCount = outcomes.filter(
        (o) => o.status === "invited" || o.status === "re-invited",
    ).length;

    return { sent: sentCount, total: normalizedEmails.length, results: outcomes };
}

export async function getInvitationByToken(token: string) {
    const invitation = await prisma.organizationInvitation.findFirst({
        where: {
            tokenHash: hashToken(token),
            status: "PENDING",
            expiresAt: { gt: new Date() },
        },
        select: {
            uuid:      true,
            email:     true,
            roleCode:  true,
            expiresAt: true,
            organization: { select: { uuid: true, name: true, slug: true, logoUrl: true } },
            invitedByUser: { select: { fullName: true, email: true } },
        },
    });

    if (!invitation) {
        throw Object.assign(new Error("Invitation is invalid or has expired"), {
            statusCode: 404,
        });
    }

    // Does a user already exist with that email? Tells the frontend whether to
    // redirect to sign-in vs sign-up.
    const existingUser = await prisma.user.findFirst({
        where: { email: invitation.email, deletedAt: null },
        select: { uuid: true },
    });

    return {
        id:               invitation.uuid,
        email:            invitation.email,
        role:             invitation.roleCode,
        expiresAt:        invitation.expiresAt,
        hasExistingUser:  Boolean(existingUser),
        organization: {
            id:      invitation.organization.uuid,
            name:    invitation.organization.name,
            slug:    invitation.organization.slug,
            logoUrl: invitation.organization.logoUrl ?? null,
        },
        invitedBy: invitation.invitedByUser
            ? {
                  name:  invitation.invitedByUser.fullName ?? "",
                  email: invitation.invitedByUser.email,
              }
            : null,
    };
}

export async function acceptInvitation(userUuid: string, token: string) {
    const user = await prisma.user.findUnique({
        where: { uuid: userUuid, deletedAt: null },
        select: { id: true, email: true },
    });
    if (!user) {
        throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }

    const invitation = await prisma.organizationInvitation.findFirst({
        where: {
            tokenHash: hashToken(token),
            status: "PENDING",
            expiresAt: { gt: new Date() },
        },
        select: {
            id:             true,
            organizationId: true,
            email:          true,
            roleCode:       true,
        },
    });

    if (!invitation) {
        throw Object.assign(new Error("Invitation is invalid or has expired"), {
            statusCode: 404,
        });
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw Object.assign(
            new Error("This invitation was sent to a different email address"),
            { statusCode: 403 },
        );
    }

    const roleId = invitation.roleCode
        ? await resolveRoleId(invitation.organizationId, invitation.roleCode as OrganizationRoleCode)
        : null;

    const now = new Date();

    await prisma.$transaction([
        prisma.organizationMember.upsert({
            where: {
                organizationId_userId: {
                    organizationId: invitation.organizationId,
                    userId:         user.id,
                },
            },
            create: {
                organizationId: invitation.organizationId,
                userId:         user.id,
                roleId,
                status:         "ACTIVE",
                invitedAt:      now,
                joinedAt:       now,
            },
            update: {
                status:    "ACTIVE",
                roleId:    roleId ?? undefined,
                joinedAt:  now,
                updatedAt: now,
            },
        }),
        prisma.organizationInvitation.update({
            where: { id: invitation.id },
            data: {
                status:     "ACCEPTED",
                acceptedAt: now,
                acceptedBy: user.id,
            },
        }),
    ]);

    const org = await prisma.organization.findUnique({
        where: { id: invitation.organizationId },
        select: { uuid: true, name: true, slug: true },
    });

    return {
        organization: org
            ? { id: org.uuid, name: org.name, slug: org.slug }
            : null,
        role: invitation.roleCode,
    };
}
