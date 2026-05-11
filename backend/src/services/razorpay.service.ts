import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "../config/prisma";
import { resolveRequestedRegion } from "../helpers/regionFallback";
import { getPlanBySlug } from "./pricing.service";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY!,
    key_secret: process.env.RAZORPAY_SECRET!,
});

export async function createPaymentOrder(
    actorUserUuid: string,
    body: { plan_slug: string; billing_cycle: "monthly" | "yearly" },
) {
    // 1. Resolve user
    const user = await prisma.user.findFirst({
        where: { uuid: actorUserUuid, deletedAt: null },
        select: { id: true, uuid: true, countryCode: true, email: true, fullName: true },
    });
    if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

    // 2. Resolve region from country_code
    const regionCode = resolveRequestedRegion({ countryCode: user.countryCode });

    // 3. Get plan
    const plan = await prisma.plan.findUnique({
        where: { slug: body.plan_slug },
        select: { id: true, slug: true, name: true },
    });
    if (!plan) throw Object.assign(new Error("Plan not found"), { statusCode: 404 });

    // 4. Get price for region
    const planPrice = await prisma.planPrice.findFirst({
        where: { planId: plan.id, regionCode, isActive: true },
        select: { monthlyPrice: true, yearlyPrice: true, currencyCode: true },
    });
    if (!planPrice) throw Object.assign(new Error("Pricing not available for your region"), { statusCode: 422 });

    const amount =
        body.billing_cycle === "yearly"
            ? Number(planPrice.yearlyPrice)
            : Number(planPrice.monthlyPrice);

    if (amount <= 0) throw Object.assign(new Error("This plan is free, no payment required"), { statusCode: 422 });

    // 5. Create Razorpay order (amount in smallest currency unit, e.g. paise for INR)
    const amountInSmallestUnit = Math.round(amount * 100);
    const rzpOrder = await razorpay.orders.create({
        amount: amountInSmallestUnit,
        currency: planPrice.currencyCode,
        receipt: `order_${Date.now()}`,
        notes: {
            plan_slug: plan.slug,
            billing_cycle: body.billing_cycle,
            user_uuid: actorUserUuid,
            region_code: regionCode,
        },
    });

    // 6. Persist order in DB
    const dbOrder = await prisma.paymentOrder.create({
        data: {
            userId: user.id,
            planId: plan.id,
            regionCode,
            billingCycle: body.billing_cycle === "yearly" ? "YEARLY" : "MONTHLY",
            razorpayOrderId: rzpOrder.id,
            amount,
            currencyCode: planPrice.currencyCode,
            status: "CREATED",
            notes: rzpOrder.notes as object,
        },
    });

    return {
        orderId: rzpOrder.id,
        amount: amountInSmallestUnit,
        currency: planPrice.currencyCode,
        keyId: process.env.RAZORPAY_KEY,
        name: "DocuNova",
        description: `${plan.name} – ${body.billing_cycle} plan`,
        prefill: {
            name: user.fullName ?? "",
            email: user.email,
        },
        dbOrderId: dbOrder.id.toString(),
    };
}

export async function verifyAndActivatePayment(
    actorUserUuid: string,
    body: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    },
) {
    // 1. Verify HMAC signature
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET!)
        .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== body.razorpay_signature) {
        throw Object.assign(new Error("Payment verification failed: invalid signature"), { statusCode: 400 });
    }

    // 2. Fetch order from DB
    const dbOrder = await prisma.paymentOrder.findUnique({
        where: { razorpayOrderId: body.razorpay_order_id },
        include: { user: { select: { id: true, uuid: true } } },
    });
    if (!dbOrder) throw Object.assign(new Error("Order not found"), { statusCode: 404 });
    if (dbOrder.user.uuid !== actorUserUuid) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

    // 3. Fetch payment details from Razorpay
    let rzpPayment: any;
    try {
        rzpPayment = await razorpay.payments.fetch(body.razorpay_payment_id);
    } catch {
        rzpPayment = null;
    }

    const now = new Date();

    // 4. Create transaction record + activate subscription in a single DB transaction
    const result = await prisma.$transaction(async (tx) => {
        // Record transaction
        const txn = await tx.paymentTransaction.create({
            data: {
                paymentOrderId: dbOrder.id,
                razorpayPaymentId: body.razorpay_payment_id,
                razorpaySignature: body.razorpay_signature,
                amount: dbOrder.amount,
                currencyCode: dbOrder.currencyCode,
                status: "CAPTURED",
                method: rzpPayment?.method ?? null,
                bank: rzpPayment?.bank ?? null,
                wallet: rzpPayment?.wallet ?? null,
                vpa: rzpPayment?.vpa ?? null,
                cardNetwork: rzpPayment?.card?.network ?? null,
                cardLast4: rzpPayment?.card?.last4 ?? null,
                email: rzpPayment?.email ?? null,
                contact: rzpPayment?.contact ?? null,
                rawPayload: rzpPayment ?? {},
                capturedAt: now,
            },
        });

        // Cancel any active subscriptions
        await tx.subscription.updateMany({
            where: { userId: dbOrder.userId, status: { in: ["ACTIVE", "TRIALING"] } },
            data: { status: "CANCELLED", cancelledAt: now, updatedAt: now },
        });

        const periodEnd =
            dbOrder.billingCycle === "YEARLY"
                ? addMonths(now, 12)
                : addMonths(now, 1);

        // Create new subscription
        const subscription = await tx.subscription.create({
            data: {
                userId: dbOrder.userId,
                planId: dbOrder.planId,
                regionCode: dbOrder.regionCode,
                billingCycle: dbOrder.billingCycle,
                status: "ACTIVE",
                startedAt: now,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
            },
            include: { plan: true },
        });

        // Link subscription to order
        await tx.paymentOrder.update({
            where: { id: dbOrder.id },
            data: { status: "PAID", subscriptionId: subscription.id, updatedAt: now },
        });

        return { subscription, txn };
    });

    const plan = await getPlanBySlug(result.subscription.plan.slug, {
        region_code: dbOrder.regionCode,
    });

    return {
        success: true,
        subscription: {
            id: result.subscription.id.toString(),
            status: result.subscription.status.toLowerCase(),
            billingCycle: result.subscription.billingCycle.toLowerCase(),
            regionCode: result.subscription.regionCode,
            currentPeriodStart: result.subscription.currentPeriodStart,
            currentPeriodEnd: result.subscription.currentPeriodEnd,
            plan,
        },
    };
}

export async function handleRazorpayWebhook(
    rawBody: string,
    signature: string,
) {
    let payload: any;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        throw Object.assign(new Error("Invalid webhook payload"), { statusCode: 400 });
    }

    const eventType = payload.event ?? "unknown";
    const entity = payload.payload?.payment?.entity ?? payload.payload?.order?.entity ?? {};
    const entityId = entity.id ?? entity.order_id ?? "unknown";

    // Persist raw webhook for audit
    const webhookRecord = await prisma.webhookEvent.create({
        data: {
            source: "razorpay",
            eventType,
            entityId,
            payload: payload as object,
            status: "received",
        },
    });

    // Verify signature if secret is configured
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
        const expectedSig = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");
        if (expectedSig !== signature) {
            await prisma.webhookEvent.update({
                where: { id: webhookRecord.id },
                data: { status: "invalid_signature", processedAt: new Date() },
            });
            throw Object.assign(new Error("Invalid webhook signature"), { statusCode: 400 });
        }
    }

    try {
        await processWebhookEvent(eventType, payload);
        await prisma.webhookEvent.update({
            where: { id: webhookRecord.id },
            data: { status: "processed", processedAt: new Date() },
        });
    } catch (err: any) {
        await prisma.webhookEvent.update({
            where: { id: webhookRecord.id },
            data: { status: "failed", errorMsg: err?.message ?? "Unknown error", processedAt: new Date() },
        });
        // Don't rethrow — return 200 to Razorpay to avoid retries for application errors
    }

    return { received: true };
}

async function processWebhookEvent(eventType: string, payload: any) {
    const payment = payload.payload?.payment?.entity;
    const order = payload.payload?.order?.entity;

    switch (eventType) {
        case "payment.captured": {
            if (!payment) return;
            const dbOrder = await prisma.paymentOrder.findFirst({
                where: { razorpayOrderId: payment.order_id },
            });
            if (!dbOrder || dbOrder.status === "PAID") return;

            await prisma.paymentTransaction.upsert({
                where: { razorpayPaymentId: payment.id },
                update: {
                    status: "CAPTURED",
                    capturedAt: new Date(),
                    rawPayload: payment,
                },
                create: {
                    paymentOrderId: dbOrder.id,
                    razorpayPaymentId: payment.id,
                    amount: payment.amount / 100,
                    currencyCode: payment.currency,
                    status: "CAPTURED",
                    method: payment.method ?? null,
                    bank: payment.bank ?? null,
                    wallet: payment.wallet ?? null,
                    vpa: payment.vpa ?? null,
                    cardNetwork: payment.card?.network ?? null,
                    cardLast4: payment.card?.last4 ?? null,
                    email: payment.email ?? null,
                    contact: payment.contact ?? null,
                    rawPayload: payment,
                    capturedAt: new Date(),
                },
            });
            break;
        }

        case "payment.failed": {
            if (!payment) return;
            const dbOrder = await prisma.paymentOrder.findFirst({
                where: { razorpayOrderId: payment.order_id },
            });
            if (!dbOrder) return;

            await prisma.paymentTransaction.upsert({
                where: { razorpayPaymentId: payment.id },
                update: {
                    status: "FAILED",
                    errorCode: payment.error_code ?? null,
                    errorDescription: payment.error_description ?? null,
                    rawPayload: payment,
                },
                create: {
                    paymentOrderId: dbOrder.id,
                    razorpayPaymentId: payment.id,
                    amount: payment.amount / 100,
                    currencyCode: payment.currency,
                    status: "FAILED",
                    errorCode: payment.error_code ?? null,
                    errorDescription: payment.error_description ?? null,
                    rawPayload: payment,
                },
            });

            await prisma.paymentOrder.update({
                where: { id: dbOrder.id },
                data: { status: "FAILED", updatedAt: new Date() },
            });
            break;
        }

        case "refund.created":
        case "refund.processed": {
            const refund = payload.payload?.refund?.entity;
            if (!refund) return;
            await prisma.paymentTransaction.updateMany({
                where: { razorpayPaymentId: refund.payment_id },
                data: { status: "REFUNDED" },
            });
            break;
        }

        case "order.paid": {
            if (!order) return;
            await prisma.paymentOrder.updateMany({
                where: { razorpayOrderId: order.id },
                data: { status: "PAID", updatedAt: new Date() },
            });
            break;
        }
    }
}

function addMonths(input: Date, months: number): Date {
    const out = new Date(input);
    out.setMonth(out.getMonth() + months);
    return out;
}
