"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
    cancelSubscription,
    createPaymentOrder,
    createSubscription,
    getCurrentSubscription,
    getPricing,
    verifyPayment,
} from "@/lib/api/pricing";
import type { BillingCycle } from "@/lib/api/pricing";
import { formatApiError } from "@/lib/api/errors";
import { useApiMutation, useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";
import { useRazorpay } from "@/lib/hooks/useRazorpay";
import BillingCycleToggle from "@/components/pricing/BillingCycleToggle";
import PlanCard from "@/components/pricing/PlanCard";

function formatDate(value: string | null) {
    if (!value) return "No period end";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No period end";
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

function CurrentSubscriptionSkeleton() {
    return (
        <div className="flex animate-pulse flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
                <div className="h-3 w-28 rounded bg-[#ddd6cb]" />
                <div className="h-9 w-44 rounded bg-[#e8e2d8]" />
                <div className="h-4 w-80 max-w-full rounded bg-[#eee8de]" />
            </div>
            <div className="h-11 w-40 rounded-md border border-[#ead7d3] bg-[#fff8f6]" />
        </div>
    );
}

function PlanCardSkeleton({ index }: { index: number }) {
    return (
        <article
            className={`relative flex min-h-[560px] animate-pulse flex-col rounded-2xl border bg-cream p-6 ${
                index === 1 ? "border-amber shadow-sm" : "border-border"
            }`}
        >
            {index === 1 && (
                <div className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-[#ddb36d]" />
            )}

            <div className="h-3 w-24 rounded bg-[#ddd6cb]" />
            <div className="mt-5 h-10 w-36 rounded bg-[#e8e2d8]" />
            <div className="mt-4 space-y-2">
                <div className="h-4 w-full rounded bg-[#eee8de]" />
                <div className="h-4 w-4/5 rounded bg-[#eee8de]" />
            </div>

            <div className="mt-6 space-y-3 rounded-md border border-border bg-parchment p-4">
                <div className="h-4 w-40 rounded bg-[#e5ddd1]" />
                <div className="h-4 w-52 rounded bg-[#eee8de]" />
                <div className="h-4 w-44 rounded bg-[#eee8de]" />
                <div className="h-4 w-48 rounded bg-[#eee8de]" />
            </div>

            <div className="my-6 flex-1 space-y-4">
                {Array.from({ length: 6 }).map((_, featureIndex) => (
                    <div
                        key={`plan-feature-skeleton-${index}-${featureIndex}`}
                        className="flex items-start gap-2.5"
                    >
                        <div className="mt-0.5 h-4 w-4 rounded bg-[#e3dbcf]" />
                        <div className="h-4 w-4/5 rounded bg-[#eee8de]" />
                    </div>
                ))}
            </div>

            <div className="mt-auto h-11 w-full rounded-full bg-[#e0d6c8]" />
        </article>
    );
}

function PlanGridSkeleton() {
    return (
        <div className="grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
                <PlanCardSkeleton
                    key={`subscription-plan-skeleton-${index}`}
                    index={index}
                />
            ))}
        </div>
    );
}

export default function SubscriptionPageClient() {
    const queryClient = useQueryClient();
    const { openCheckout } = useRazorpay();
    const [selectedBillingCycle, setSelectedBillingCycle] =
        useState<BillingCycle | null>(null);
    const [payingPlanSlug, setPayingPlanSlug] = useState<string | null>(null);

    const currentQuery = useApiQuery({
        queryKey: queryKeys.subscriptions.current(),
        queryFn: getCurrentSubscription,
    });
    const pricingQuery = useApiQuery({
        queryKey: queryKeys.pricing.listing(
            currentQuery.data?.countryCode
                ? `country:${currentQuery.data.countryCode}`
                : "DEFAULT",
        ),
        queryFn: () =>
            getPricing(
                currentQuery.data?.countryCode
                    ? { countryCode: currentQuery.data.countryCode }
                    : undefined,
            ),
        enabled: currentQuery.isSuccess,
    });

    const refreshSubscriptionState = () => {
        queryClient.invalidateQueries({
            queryKey: queryKeys.subscriptions.current(),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.usage.summary() });
    };

    // For free/starter plan — no payment needed
    const subscribeMutation = useApiMutation({
        mutationFn: (planSlug: string) =>
            createSubscription({
                plan_slug: planSlug,
                billing_cycle:
                    selectedBillingCycle ??
                    currentQuery.data?.billingCycle ??
                    "monthly",
            }),
        onSuccess: () => {
            refreshSubscriptionState();
            toast.success("Subscription updated");
        },
        onError: (error) => {
            toast.error(formatApiError(error));
        },
    });

    const cancelMutation = useApiMutation({
        mutationFn: cancelSubscription,
        onSuccess: () => {
            refreshSubscriptionState();
            toast.info("Subscription cancelled");
        },
        onError: (error) => {
            toast.error(formatApiError(error));
        },
    });

    const handleChoosePlan = async (planSlug: string) => {
        const cycle =
            selectedBillingCycle ??
            currentQuery.data?.billingCycle ??
            "monthly";

        // Free plan — no payment
        if (planSlug === "starter") {
            subscribeMutation.mutate(planSlug);
            return;
        }

        setPayingPlanSlug(planSlug);
        try {
            const order = await createPaymentOrder({ plan_slug: planSlug, billing_cycle: cycle });

            await openCheckout({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: order.name,
                description: order.description,
                order_id: order.orderId,
                prefill: order.prefill,
                theme: { color: "#3b5bdb" },
                onSuccess: async (response) => {
                    try {
                        await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        refreshSubscriptionState();
                        toast.success("Payment successful! Subscription activated.");
                    } catch (err) {
                        toast.error(formatApiError(err) || "Payment verification failed");
                    }
                },
                onDismiss: () => {
                    toast.info("Payment cancelled");
                },
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "";
            if (message !== "Payment dismissed") {
                toast.error(formatApiError(err) || "Failed to initiate payment");
            }
        } finally {
            setPayingPlanSlug(null);
        }
    };

    const pricing = pricingQuery.data;
    const current = currentQuery.data;
    const billingCycle =
        selectedBillingCycle ?? current?.billingCycle ?? "monthly";
    const plans = useMemo(() => pricing?.plans ?? [], [pricing?.plans]);

    return (
        <section className="max-w-[1180px]">
            <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="font-serif text-[32px] font-semibold leading-[0.95] tracking-tight text-[#2f2a25]">
                        Subscription
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6f675e]">
                        Manage your current plan and switch tiers.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <BillingCycleToggle
                        value={billingCycle}
                        onChange={setSelectedBillingCycle}
                    />
                </div>
            </header>

            <div className="mb-6 rounded-xl border border-[#e1dbd1] bg-[#f8f5ef] p-5">
                {currentQuery.isPending && <CurrentSubscriptionSkeleton />}

                {currentQuery.isError && (
                    <p className="text-sm text-[#c61b1b]">
                        {formatApiError(currentQuery.error) ||
                            "Unable to load subscription."}
                    </p>
                )}

                {current && (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-[#8f867c]">
                                Current Plan
                            </p>
                            <h2 className="mt-2 font-serif text-3xl text-[#2f2b27]">
                                {current.plan.name}
                            </h2>
                            <p className="mt-1 text-sm text-[#6f675e]">
                                {current.billingCycle} billing, {current.regionCode} region.
                                Period ends {formatDate(current.currentPeriodEnd)}.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => cancelMutation.mutate()}
                            disabled={cancelMutation.isPending || current.plan.slug === "starter"}
                            className="h-11 rounded-md border border-[#d9b4ad] px-4 text-sm font-medium text-[#9b2f2f] hover:bg-[#fff8f6] disabled:opacity-50"
                        >
                            {cancelMutation.isPending
                                ? "Cancelling..."
                                : "Cancel Subscription"}
                        </button>
                    </div>
                )}
            </div>

            {(currentQuery.isPending || pricingQuery.isPending) && (
                <PlanGridSkeleton />
            )}

            {pricingQuery.isError && (
                <p className="text-sm text-[#c61b1b]">
                    {formatApiError(pricingQuery.error) || "Unable to load plans."}
                </p>
            )}

            {pricing && (
                <div className="grid gap-5 md:grid-cols-3">
                    {plans.map((plan) => {
                        const isCurrent = current?.plan.slug === plan.slug;
                        const isPaying = payingPlanSlug === plan.slug;
                        return (
                            <PlanCard
                                key={plan.slug}
                                plan={plan}
                                price={plan.price}
                                limits={plan.limits}
                                features={plan.features}
                                billingCycle={billingCycle}
                                highlighted={plan.slug === "professional"}
                                onChoose={handleChoosePlan}
                                actionLabel={isCurrent ? "Current Plan" : undefined}
                                busy={isPaying || (subscribeMutation.isPending && subscribeMutation.variables === plan.slug)}
                                disabled={isCurrent || !!payingPlanSlug}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}
