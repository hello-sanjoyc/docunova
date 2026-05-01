"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import type {
    BillingCycle,
    PlanFeature,
    PlanLimit,
    PlanPrice,
    PricingPlan,
} from "@/lib/api/pricing";

interface PlanCardProps {
    plan: PricingPlan;
    price: PlanPrice | null;
    limits: PlanLimit[];
    features: PlanFeature[];
    billingCycle: BillingCycle;
    highlighted?: boolean;
    onChoose?: (planSlug: string) => void;
    actionHref?: string;
    actionLabel?: string;
    busy?: boolean;
    disabled?: boolean;
}

function formatMoney(amount: number, currencyCode: string) {
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currencyCode,
            maximumFractionDigits: amount >= 1000 ? 0 : 2,
        }).format(amount);
    } catch {
        return `${currencyCode} ${amount.toLocaleString()}`;
    }
}

function getLimit(limits: PlanLimit[], key: string) {
    return limits.find((limit) => limit.key === key)?.value ?? null;
}

function includedPagesLabel(limits: PlanLimit[]) {
    const monthlyPages = getLimit(limits, "pages_per_month");
    const lifetimePages = getLimit(limits, "lifetime_pages");
    if (monthlyPages !== null)
        return `${monthlyPages.toLocaleString()} pages/month`;
    if (lifetimePages !== null)
        return `${lifetimePages.toLocaleString()} lifetime pages`;
    return "Usage limit configured";
}

function periodLabel(planSlug: string, billingCycle: BillingCycle) {
    if (planSlug === "starter") return "";
    return billingCycle === "yearly" ? "/year" : "/month";
}

export default function PlanCard({
    plan,
    price,
    limits,
    features,
    billingCycle,
    highlighted = false,
    onChoose,
    actionHref = "/signup",
    actionLabel,
    busy = false,
    disabled = false,
}: PlanCardProps) {
    const amount = price
        ? billingCycle === "yearly"
            ? price.yearlyPrice
            : price.monthlyPrice
        : 0;
    const currencyCode = price?.currencyCode ?? "INR";
    const maxPages = getLimit(limits, "max_pages_per_upload");
    const ocrIncluded = getLimit(limits, "ocr_pages_included");
    const minimumSeats = getLimit(limits, "minimum_team_seats");
    const cta =
        actionLabel ??
        (plan.slug === "starter"
            ? "Start Free"
            : plan.slug === "team"
              ? "Choose Team"
              : "Choose Professional");

    const buttonClasses = highlighted
        ? "bg-ink text-cream hover:bg-amber"
        : "border border-border text-ink hover:border-amber hover:text-amber";

    const action = onChoose ? (
        <button
            type="button"
            onClick={() => onChoose(plan.slug)}
            disabled={busy || disabled}
            className={`mt-auto block w-full rounded-full py-3 text-center text-[14px] font-medium transition-colors disabled:opacity-60 ${buttonClasses}`}
        >
            {busy ? "Updating..." : cta}
        </button>
    ) : (
        <Link
            href={actionHref}
            className={`mt-auto block rounded-full py-3 text-center text-[14px] font-medium transition-colors ${buttonClasses}`}
        >
            {cta}
        </Link>
    );

    return (
        <article
            className={`relative flex min-h-[560px] flex-col rounded-2xl border bg-cream p-6 ${
                highlighted ? "border-amber shadow-sm" : "border-border"
            }`}
        >
            {highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-amber px-3 py-1 text-[11px] font-medium text-cream">
                        Most Popular
                    </span>
                </div>
            )}

            <div>
                <p
                    className={`text-[13px] font-semibold uppercase tracking-[0.14em] ${
                        highlighted ? "text-amber-dark" : "text-muted"
                    }`}
                >
                    {plan.name}
                </p>
                <div className="mt-4 flex items-end gap-1">
                    <span className="font-serif text-4xl font-light text-ink">
                        {amount === 0
                            ? "Free"
                            : formatMoney(amount, currencyCode)}
                    </span>
                    {amount > 0 && (
                        <span className="pb-1 text-sm text-muted">
                            {periodLabel(plan.slug, billingCycle)}
                        </span>
                    )}
                </div>
                <p className="mt-2 min-h-10 text-sm leading-relaxed text-muted">
                    {plan.description}
                </p>
            </div>

            <div className="mt-6 space-y-2 rounded-md border border-border bg-parchment p-4 text-sm">
                <p className="font-medium text-ink">
                    {includedPagesLabel(limits)}
                </p>
                {maxPages !== null && (
                    <p className="text-muted">
                        Max {maxPages.toLocaleString()} pages per upload
                    </p>
                )}
                {ocrIncluded !== null && (
                    <p className="text-muted">
                        OCR included: {ocrIncluded.toLocaleString()} pages
                    </p>
                )}
                {minimumSeats !== null && (
                    <p className="text-muted">
                        Minimum {minimumSeats.toLocaleString()} team seats
                    </p>
                )}
                {price && plan.slug !== "starter" && (
                    <p className="text-muted">
                        Extra pages{" "}
                        {formatMoney(price.extraPagePrice, currencyCode)} each,
                        OCR {formatMoney(price.extraOcrPagePrice, currencyCode)}{" "}
                        each
                    </p>
                )}
                {price?.isFallback && (
                    <p className="text-[12px] text-amber-dark">
                        Pricing fallback: {price.regionCode}
                    </p>
                )}
            </div>

            <ul className="my-6 flex-1 space-y-3">
                {features.map((feature) => (
                    <li
                        key={feature.key}
                        className={`flex items-start gap-2.5 text-[13px] ${
                            feature.included ? "text-ink" : "text-muted"
                        }`}
                    >
                        <span
                            className={
                                feature.included
                                    ? "mt-0.5 text-sage"
                                    : "mt-0.5 text-border"
                            }
                        >
                            {feature.included ? (
                                <Check
                                    size={15}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />
                            ) : (
                                <X
                                    size={15}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />
                            )}
                        </span>
                        <span>{feature.name}</span>
                    </li>
                ))}
            </ul>

            {action}
        </article>
    );
}
