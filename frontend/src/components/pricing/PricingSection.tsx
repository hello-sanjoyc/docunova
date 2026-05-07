"use client";

import { useEffect, useState } from "react";
import { formatApiError } from "@/lib/api/errors";
import { getPricing } from "@/lib/api/pricing";
import type { BillingCycle } from "@/lib/api/pricing";
import {
    detectPricingCountryCode,
    readStoredPricingCountryCode,
} from "@/lib/api/pricingCountry";
import { useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";
import BillingCycleToggle from "./BillingCycleToggle";
import PlanCard from "./PlanCard";

interface PricingSectionProps {
    hideHeader?: boolean;
    compactHeader?: boolean;
    className?: string;
}

type CountryState = {
    code: string | null;
    ready: boolean;
};

export default function PricingSection({
    hideHeader = false,
    compactHeader = false,
    className = "",
}: PricingSectionProps) {
    const [country, setCountry] = useState<CountryState>(() => {
        const code = readStoredPricingCountryCode();
        return { code, ready: Boolean(code) };
    });
    const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

    useEffect(() => {
        if (country.ready) return;

        let cancelled = false;

        async function detectCountry() {
            const code = await detectPricingCountryCode();
            if (!cancelled) {
                setCountry({ code, ready: true });
            }
        }

        detectCountry();

        return () => {
            cancelled = true;
        };
    }, [country.ready]);

    const pricingQuery = useApiQuery({
        queryKey: queryKeys.pricing.listing(
            country.code ? `country:${country.code}` : "DEFAULT",
        ),
        queryFn: () =>
            getPricing(country.code ? { countryCode: country.code } : undefined),
        enabled: country.ready,
    });
    const pricing = pricingQuery.data;

    const controls = (
        <div className="flex flex-wrap items-center justify-center gap-3">
            <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />
        </div>
    );

    return (
        <section id="pricing" className={className}>
            <div className="mx-auto max-w-6xl px-6">
                {hideHeader ? (
                    <div className="mb-8 flex justify-center">{controls}</div>
                ) : (
                    <div
                        className={`mb-10 flex flex-col gap-5 ${
                            compactHeader
                                ? "lg:flex-row lg:items-end lg:justify-between"
                                : "items-center text-center"
                        }`}
                    >
                        <div className={compactHeader ? "" : "max-w-2xl"}>
                            <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">
                                Pricing
                            </p>
                            <h2
                                className={
                                    compactHeader
                                        ? "font-serif text-4xl font-semibold tracking-tight text-ink"
                                        : "text-4xl font-light tracking-tight"
                                }
                            >
                                Simple pricing for{" "}
                                <span className="font-serif-italic">
                                    every stage.
                                </span>
                            </h2>
                            <p className="mt-3 text-[15px] text-muted">
                                Plans are global. Prices localize by region and
                                fall back automatically when a regional price is
                                unavailable.
                            </p>
                        </div>

                        {controls}
                    </div>
                )}

                {(pricingQuery.isPending || !country.ready) && (
                    <div className="grid gap-5 md:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={`pricing-skeleton-${index}`}
                                className="h-[560px] animate-pulse rounded-lg border border-border bg-cream"
                            />
                        ))}
                    </div>
                )}

                {pricingQuery.isError && (
                    <div className="rounded-lg border border-danger-light bg-danger-light p-4 text-sm text-danger">
                        {formatApiError(pricingQuery.error) ||
                            "Unable to load pricing."}
                    </div>
                )}

                {pricing && (
                    <div className="grid gap-5 md:grid-cols-3">
                        {pricing.plans.map((plan) => (
                            <PlanCard
                                key={plan.slug}
                                plan={plan}
                                price={plan.price}
                                limits={plan.limits}
                                features={plan.features}
                                billingCycle={billingCycle}
                                highlighted={plan.slug === "professional"}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
