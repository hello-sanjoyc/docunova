import prisma from '../config/prisma';
import env from '../config/env';
import { enqueueEmail } from '../queues/email.queue';
import { appLogger } from '../config/logger';

export type SecurityAlertEvent = 'NEW_LOGIN' | 'PASSWORD_CHANGED' | 'PASSWORD_RESET';

interface SecurityAlertInput {
    userId: bigint;
    event: SecurityAlertEvent;
    occurredAt?: Date;
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
    };
}

function formatTimestamp(value: Date) {
    return value.toISOString().replace('T', ' ').replace('Z', ' UTC');
}

function eventCopy(event: SecurityAlertEvent) {
    switch (event) {
        case 'NEW_LOGIN':
            return {
                subject: 'Security alert: New sign-in detected',
                title: 'New sign-in detected',
                description: 'A new sign-in to your Docunova account was detected.',
            };
        case 'PASSWORD_CHANGED':
            return {
                subject: 'Security alert: Password changed',
                title: 'Password changed',
                description: 'Your account password was changed.',
            };
        case 'PASSWORD_RESET':
            return {
                subject: 'Security alert: Password reset completed',
                title: 'Password reset completed',
                description: 'A password reset was completed for your account.',
            };
        default:
            return {
                subject: 'Security alert',
                title: 'Security activity',
                description: 'A security-relevant account activity occurred.',
            };
    }
}

export async function sendSecurityAlertEmail(input: SecurityAlertInput) {
    try {
        const user = await prisma.user.findFirst({
            where: { id: input.userId, deletedAt: null },
            select: {
                email: true,
                fullName: true,
                securityAlertsEnabled: true,
            },
        });

        if (!user || !user.email || !user.securityAlertsEnabled) {
            return;
        }

        const copy = eventCopy(input.event);
        const occurredAt = input.occurredAt ?? new Date();

        await enqueueEmail({
            to: user.email,
            subject: copy.subject,
            template: 'security-alert',
            templateData: {
                name: user.fullName ?? 'there',
                title: copy.title,
                description: copy.description,
                occurredAt: formatTimestamp(occurredAt),
                ipAddress: input.metadata?.ipAddress ?? null,
                userAgent: input.metadata?.userAgent ?? null,
                appUrl: env.FRONTEND_APP_URL,
                securityUrl: `${env.FRONTEND_APP_URL}/myprofile`,
            },
        });
    } catch (err) {
        // Notification delivery must not block auth/session flows.
        appLogger.error('[notification] failed to queue security alert email', {
            err,
            userId: input.userId.toString(),
            event: input.event,
        });
    }
}

export async function sendWeeklyEmailDigest(userId: bigint, days = 7) {
    const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
            email: true,
            fullName: true,
            emailDigestEnabled: true,
        },
    });

    if (!user || !user.email || !user.emailDigestEnabled) {
        return;
    }

    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - days);

    const [newDocuments, searchCount] = await Promise.all([
        prisma.document.findMany({
            where: {
                ownerUserId: userId,
                deletedAt: null,
                uploadedAt: { gte: since },
            },
            select: {
                title: true,
                uploadedAt: true,
            },
            orderBy: { uploadedAt: 'desc' },
            take: 5,
        }),
        prisma.searchHistory.count({
            where: {
                userId,
                createdAt: { gte: since },
            },
        }),
    ]);

    await enqueueEmail({
        to: user.email,
        subject: 'Your Docunova weekly digest',
        template: 'email-digest',
        templateData: {
            name: user.fullName ?? 'there',
            days,
            documentCount: newDocuments.length,
            searchCount,
            newDocuments,
            appUrl: env.FRONTEND_APP_URL,
            dashboardUrl: `${env.FRONTEND_APP_URL}/dashboard`,
        },
    });
}
