"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
    cancelSubscription,
    createSubscription,
    getCurrentSubscription,
    getPricing,
} from "@/lib/api/pricing";
import type { BillingCycle } from "@/lib/api/pricing";
import { formatApiError } from "@/lib/api/errors";
import { useApiMutation, useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";
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

export default function SubscriptionPageClient() {
    const queryClient = useQueryClient();
    const [selectedBillingCycle, setSelectedBillingCycle] =
        useState<BillingCycle | null>(null);

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
            toast.info("Subscription cancellation recorded");
        },
        onError: (error) => {
            toast.error(formatApiError(error));
        },
    });

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
                        Manage your current plan and switch tiers. Payment collection is
                        intentionally not connected yet.
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
                {currentQuery.isPending && (
                    <div className="h-16 animate-pulse rounded bg-[#ece8e2]" />
                )}

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
                <div className="grid gap-5 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={`subscription-plan-skeleton-${index}`}
                            className="h-[560px] animate-pulse rounded-lg border border-border bg-cream"
                        />
                    ))}
                </div>
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
                        return (
                            <PlanCard
                                key={plan.slug}
                                plan={plan}
                                price={plan.price}
                                limits={plan.limits}
                                features={plan.features}
                                billingCycle={billingCycle}
                                highlighted={plan.slug === "professional"}
                                onChoose={(planSlug) => subscribeMutation.mutate(planSlug)}
                                actionLabel={isCurrent ? "Current Plan" : undefined}
                                busy={
                                    subscribeMutation.isPending &&
                                    subscribeMutation.variables === plan.slug
                                }
                                disabled={isCurrent}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}
