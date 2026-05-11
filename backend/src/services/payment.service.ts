import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

export interface PaymentHistoryQuery {
    page?: number;
    limit?: number;
    method?: string;
    date_from?: string;
    date_to?: string;
}

export async function getPaymentHistory(
    actorUserUuid: string,
    query: PaymentHistoryQuery = {},
) {
    const user = await prisma.user.findFirst({
        where: { uuid: actorUserUuid, deletedAt: null },
        select: { id: true },
    });
    if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const txnWhere: Prisma.PaymentTransactionWhereInput = {
        order: { userId: user.id },
    };

    if (query.method) {
        txnWhere.method = { equals: query.method, mode: "insensitive" };
    }

    if (query.date_from || query.date_to) {
        txnWhere.createdAt = {
            ...(query.date_from ? { gte: new Date(query.date_from) } : {}),
            ...(query.date_to
                ? { lte: new Date(new Date(query.date_to).setHours(23, 59, 59, 999)) }
                : {}),
        };
    }

    const [transactions, total] = await Promise.all([
        prisma.paymentTransaction.findMany({
            where: txnWhere,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                razorpayPaymentId: true,
                amount: true,
                currencyCode: true,
                status: true,
                method: true,
                bank: true,
                wallet: true,
                vpa: true,
                cardNetwork: true,
                cardLast4: true,
                errorCode: true,
                errorDescription: true,
                capturedAt: true,
                createdAt: true,
                order: {
                    select: {
                        razorpayOrderId: true,
                        billingCycle: true,
                        plan: { select: { name: true, slug: true } },
                    },
                },
            },
        }),
        prisma.paymentTransaction.count({ where: txnWhere }),
    ]);

    const rows = transactions.map((txn) => ({
        id: txn.id.toString(),
        transactionId: txn.razorpayPaymentId,
        orderId: txn.order.razorpayOrderId,
        planName: txn.order.plan.name,
        planSlug: txn.order.plan.slug,
        billingCycle: txn.order.billingCycle.toLowerCase(),
        amount: Number(txn.amount),
        currencyCode: txn.currencyCode,
        status: txn.status.toLowerCase(),
        method: txn.method ?? null,
        methodDetail: resolveMethodDetail(txn),
        errorCode: txn.errorCode ?? null,
        errorDescription: txn.errorDescription ?? null,
        capturedAt: txn.capturedAt ?? null,
        createdAt: txn.createdAt,
    }));

    return {
        data: rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    };
}

export async function getPaymentMethodOptions(actorUserUuid: string) {
    const user = await prisma.user.findFirst({
        where: { uuid: actorUserUuid, deletedAt: null },
        select: { id: true },
    });
    if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

    const methods = await prisma.paymentTransaction.findMany({
        where: { order: { userId: user.id }, method: { not: null } },
        select: { method: true },
        distinct: ["method"],
    });

    return methods.map((m) => m.method).filter(Boolean) as string[];
}

function resolveMethodDetail(txn: {
    method: string | null;
    bank: string | null;
    wallet: string | null;
    vpa: string | null;
    cardNetwork: string | null;
    cardLast4: string | null;
}): string | null {
    switch (txn.method) {
        case "card":
            return txn.cardNetwork && txn.cardLast4
                ? `${txn.cardNetwork} •••• ${txn.cardLast4}`
                : txn.cardNetwork ?? null;
        case "netbanking":
            return txn.bank ?? null;
        case "wallet":
            return txn.wallet ?? null;
        case "upi":
            return txn.vpa ?? null;
        default:
            return null;
    }
}
