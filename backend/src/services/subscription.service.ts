import prisma from "../config/prisma";
import { resolveRequestedRegion } from "../helpers/regionFallback";
import {
    CreateSubscriptionBody,
    CurrentSubscriptionQuery,
} from "../models/subscription.model";
import { getPlanBySlug } from "./pricing.service";

function addMonths(input: Date, months: number) {
    const out = new Date(input);
    out.setMonth(out.getMonth() + months);
    return out;
}

export async function resolveUserByIdentifier(identifier: string) {
    const numericId = /^\d+$/.test(identifier) ? BigInt(identifier) : null;
    const user = await prisma.user.findFirst({
        where: {
            deletedAt: null,
            OR: [
                { uuid: identifier },
                ...(numericId ? [{ id: numericId }] : []),
            ],
        },
        select: {
            id: true,
            uuid: true,
            countryCode: true,
            regionCode: true,
        },
    });

    if (!user) {
        throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }

    return user;
}

export async function createSubscription(
    actorUserUuid: string,
    body: CreateSubscriptionBody,
) {
    const targetUser = await resolveUserByIdentifier(body.user_id ?? actorUserUuid);
    const regionCode = resolveRequestedRegion({
        countryCode: targetUser.countryCode,
    });
    const plan = await prisma.plan.findUnique({
        where: { slug: body.plan_slug },
        select: { id: true, slug: true },
    });
    if (!plan) {
        throw Object.assign(new Error("Plan not found"), { statusCode: 404 });
    }

    const now = new Date();
    const periodEnd = body.billing_cycle === "yearly" ? addMonths(now, 12) : addMonths(now, 1);

    await prisma.subscription.updateMany({
        where: {
            userId: targetUser.id,
            status: { in: ["ACTIVE", "TRIALING"] },
        },
        data: {
            status: "CANCELLED",
            cancelledAt: now,
            updatedAt: now,
        },
    });

    const subscription = await prisma.subscription.create({
        data: {
            userId: targetUser.id,
            planId: plan.id,
            regionCode,
            billingCycle: body.billing_cycle === "yearly" ? "YEARLY" : "MONTHLY",
            status: "ACTIVE",
            startedAt: now,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
        },
        include: { plan: true },
    });

    const localizedPlan = await getPlanBySlug(subscription.plan.slug, {
        region_code: regionCode,
    });

    return {
        id: subscription.id.toString(),
        userId: targetUser.uuid,
        status: subscription.status.toLowerCase(),
        billingCycle: subscription.billingCycle.toLowerCase(),
        countryCode: targetUser.countryCode,
        regionCode: subscription.regionCode,
        startedAt: subscription.startedAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        plan: localizedPlan,
    };
}

export async function getCurrentSubscription(
    actorUserUuid: string,
    query: CurrentSubscriptionQuery = {},
) {
    const targetUser = await resolveUserByIdentifier(query.user_id ?? actorUserUuid);
    const now = new Date();
    const subscription = await prisma.subscription.findFirst({
        where: {
            userId: targetUser.id,
            status: { in: ["ACTIVE", "TRIALING"] },
            currentPeriodEnd: { gt: now },
        },
        orderBy: { createdAt: "desc" },
        include: { plan: true },
    });

    if (!subscription) {
        const regionCode = resolveRequestedRegion({
            countryCode: targetUser.countryCode,
        });
        return {
            id: null,
            userId: targetUser.uuid,
            status: "active",
            billingCycle: "monthly",
            countryCode: targetUser.countryCode,
            regionCode,
            startedAt: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelledAt: null,
            plan: await getPlanBySlug("starter", { region_code: regionCode }),
        };
    }

    return {
        id: subscription.id.toString(),
        userId: targetUser.uuid,
        status: subscription.status.toLowerCase(),
        billingCycle: subscription.billingCycle.toLowerCase(),
        countryCode: targetUser.countryCode,
        regionCode: subscription.regionCode,
        startedAt: subscription.startedAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        plan: await getPlanBySlug(subscription.plan.slug, {
            region_code: subscription.regionCode,
        }),
    };
}

export async function cancelSubscriptionPlaceholder(actorUserUuid: string) {
    const targetUser = await resolveUserByIdentifier(actorUserUuid);
    const now = new Date();
    await prisma.subscription.updateMany({
        where: {
            userId: targetUser.id,
            status: { in: ["ACTIVE", "TRIALING"] },
        },
        data: {
            status: "CANCELLED",
            cancelledAt: now,
            updatedAt: now,
        },
    });
}
