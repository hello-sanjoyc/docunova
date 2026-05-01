"use client";

import type { BillingCycle } from "@/lib/api/pricing";

interface BillingCycleToggleProps {
    value: BillingCycle;
    onChange: (value: BillingCycle) => void;
}

export default function BillingCycleToggle({
    value,
    onChange,
}: BillingCycleToggleProps) {
    return (
        <div className="inline-flex rounded-full border border-border bg-cream p-1 text-sm">
            {(["monthly", "yearly"] as const).map((cycle) => (
                <button
                    key={cycle}
                    type="button"
                    onClick={() => onChange(cycle)}
                    className={`h-9 min-w-24 rounded-full px-4 capitalize transition-colors ${
                        value === cycle
                            ? "bg-ink text-cream"
                            : "text-muted hover:text-ink"
                    }`}
                >
                    {cycle}
                </button>
            ))}
        </div>
    );
}
