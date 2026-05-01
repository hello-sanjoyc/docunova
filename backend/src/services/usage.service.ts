import prisma from "../config/prisma";
import { decimalToNumber, formatCurrencyAmount } from "../helpers/currencyFormatter";
import { calculateUsage } from "../helpers/usageCalculator";
import { UsageCheckBody, UsageRecordBody } from "../models/usage.model";
import { getCurrentSubscription, resolveUserByIdentifier } from "./subscription.service";

function startOfMonth(input = new Date()) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), 1));
}

function limitsToMap(plan: Awaited<ReturnType<typeof getCurrentSubscription>>["plan"]) {
    return Object.fromEntries(plan.limits.map((limit) => [limit.key, limit.value]));
}

async function getUsageTotals(userId: bigint, planSlug: string) {
    const where =
        planSlug === "starter"
            ? { userId }
            : { userId, usageMonth: startOfMonth() };
    const totals = await prisma.usageRecord.aggregate({
        where,
        _sum: {
            pagesUsed: true,
            ocrPagesUsed: true,
            // Token usage is intentionally internal for future analytics.
            tokensUsed: true,
        },
    });

    return {
        pagesUsed: totals._sum.pagesUsed ?? 0,
        ocrPagesUsed: totals._sum.ocrPagesUsed ?? 0,
        tokensUsed: totals._sum.tokensUsed ?? 0,
    };
}

async function buildUsageState(actorUserUuid: string, userIdentifier?: string) {
    const user = await resolveUserByIdentifier(userIdentifier ?? actorUserUuid);
    const subscription = await getCurrentSubscription(actorUserUuid, {
        user_id: user.uuid,
    });
    const usage = await getUsageTotals(user.id, subscription.plan.slug);
    const limits = limitsToMap(subscription.plan);
    const price = subscription.plan.price;

    return {
        user,
        subscription,
        usage,
        limits,
        price,
    };
}

export async function checkUsage(actorUserUuid: string, body: UsageCheckBody) {
    const state = await buildUsageState(actorUserUuid, body.user_id);
    const pageCount = body.page_count ?? 0;
    const ocrPageCount = body.ocr_page_count ?? 0;
    const extraPagePrice = state.price ? decimalToNumber(state.price.extraPagePrice) : 0;
    const extraOcrPagePrice = state.price ? decimalToNumber(state.price.extraOcrPagePrice) : 0;
    const currencyCode = state.price?.currencyCode ?? "INR";
    const calculated = calculateUsage({
        planSlug: state.subscription.plan.slug,
        pageCount,
        ocrPageCount,
        pagesUsed: state.usage.pagesUsed,
        ocrPagesUsed: state.usage.ocrPagesUsed,
        limits: state.limits,
        extraPagePrice,
        extraOcrPagePrice,
        currencyCode,
    });

    return {
        allowed: calculated.allowed,
        reason: calculated.reason,
        currentUsage: {
            pagesUsed: state.usage.pagesUsed,
            ocrPagesUsed: state.usage.ocrPagesUsed,
        },
        planLimit: {
            planSlug: state.subscription.plan.slug,
            pages: calculated.pageLimit,
            ocrPages: calculated.ocrIncluded,
            maxPagesPerUpload: state.limits.max_pages_per_upload ?? null,
        },
        estimatedExtraPageCharge: calculated.estimatedExtraPageCharge,
        estimatedOcrCharge: calculated.estimatedOcrCharge,
        estimatedTotalCharge:
            calculated.estimatedExtraPageCharge + calculated.estimatedOcrCharge,
        formattedEstimate: formatCurrencyAmount(
            calculated.estimatedExtraPageCharge + calculated.estimatedOcrCharge,
            currencyCode,
        ),
        currencyCode,
    };
}

export async function recordUsage(actorUserUuid: string, body: UsageRecordBody) {
    const state = await buildUsageState(actorUserUuid, body.user_id);
    let documentDbId: bigint | null = null;
    if (body.document_id) {
        const document = await prisma.document.findFirst({
            where: {
                OR: [
                    { uuid: body.document_id },
                    ...(/^\d+$/.test(body.document_id)
                        ? [{ id: BigInt(body.document_id) }]
                        : []),
                ],
            },
            select: { id: true, ownerUserId: true },
        });
        if (!document) {
            throw Object.assign(new Error("Document not found"), { statusCode: 404 });
        }
        if (document.ownerUserId !== state.user.id) {
            throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
        }
        documentDbId = document.id;
    }

    const subscriptionId = state.subscription.id ? BigInt(state.subscription.id) : null;
    const record = await prisma.usageRecord.create({
        data: {
            userId: state.user.id,
            subscriptionId,
            documentId: documentDbId,
            pagesUsed: body.pages_used ?? 0,
            ocrPagesUsed: body.ocr_pages_used ?? 0,
            usageMonth: startOfMonth(),
        },
    });

    return {
        id: record.id.toString(),
        usageMonth: record.usageMonth,
        pagesUsed: record.pagesUsed,
        ocrPagesUsed: record.ocrPagesUsed,
    };
}

export async function getUsageOverview(actorUserUuid: string) {
    const state = await buildUsageState(actorUserUuid);
    const price = state.price;
    const extraPagePrice = price ? decimalToNumber(price.extraPagePrice) : 0;
    const extraOcrPagePrice = price ? decimalToNumber(price.extraOcrPagePrice) : 0;
    const currencyCode = price?.currencyCode ?? "INR";
    const pagesLimit =
        state.subscription.plan.slug === "starter"
            ? state.limits.lifetime_pages ?? 0
            : state.limits.pages_per_month ?? 0;
    const ocrLimit = state.limits.ocr_pages_included ?? 0;
    const extraPages = Math.max(0, state.usage.pagesUsed - pagesLimit);
    const extraOcrPages = Math.max(0, state.usage.ocrPagesUsed - ocrLimit);
    const extraCharge =
        extraPages * extraPagePrice + extraOcrPages * extraOcrPagePrice;

    return {
        subscription: state.subscription,
        pages: {
            used: state.usage.pagesUsed,
            limit: pagesLimit,
            remaining: Math.max(0, pagesLimit - state.usage.pagesUsed),
            period: state.subscription.plan.slug === "starter" ? "lifetime" : "monthly",
        },
        ocrPages: {
            used: state.usage.ocrPagesUsed,
            limit: ocrLimit,
            remaining: Math.max(0, ocrLimit - state.usage.ocrPagesUsed),
            period: state.subscription.plan.slug === "starter" ? "lifetime" : "monthly",
        },
        extraUsageEstimate: {
            amount: extraCharge,
            currencyCode,
            formatted: formatCurrencyAmount(extraCharge, currencyCode),
        },
    };
}
