"use client";

import { Gauge } from "lucide-react";
import { formatApiError } from "@/lib/api/errors";
import { getUsageSummary } from "@/lib/api/pricing";
import { useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";

function usagePercent(used: number, limit: number) {
    if (!Number.isFinite(limit) || limit <= 0) return 0;
    return Math.max(0, Math.min(100, (used / limit) * 100));
}

function formatCount(value: number) {
    return Number.isFinite(value) ? value.toLocaleString() : "0";
}

export default function UsageCard() {
    const usageQuery = useApiQuery({
        queryKey: queryKeys.usage.summary(),
        queryFn: getUsageSummary,
    });
    const usage = usageQuery.data;

    return (
        <article className="min-h-[160px] rounded-xl border border-[#e1dbd1] bg-[#f8f5ef] p-5">
            <div className="flex items-center gap-3">
                <span className="text-[#bd8228]">
                    <Gauge size={24} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                    <h2 className="text-xl leading-tight font-serif text-[#37322d]">
                        Usage
                    </h2>
                    {usage && (
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#8f867c]">
                            {usage.subscription.plan.name}
                        </p>
                    )}
                </div>
            </div>

            {usageQuery.isPending && (
                <div className="mt-6 space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-[#ece8e2]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#ece8e2]" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[#ece8e2]" />
                </div>
            )}

            {usageQuery.isError && (
                <p className="mt-5 text-sm text-[#c61b1b]">
                    {formatApiError(usageQuery.error) || "Unable to load usage."}
                </p>
            )}

            {usage && (
                <div className="mt-5 space-y-4">
                    <div>
                        <div className="mb-2 flex items-center justify-between text-sm text-[#6f675e]">
                            <span>
                                {formatCount(usage.pages.used)} pages used
                            </span>
                            <span>
                                {formatCount(usage.pages.remaining)} remaining
                            </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#ece8e2]">
                            <div
                                className="h-full rounded-full bg-[#b87013]"
                                style={{
                                    width: `${usagePercent(
                                        usage.pages.used,
                                        usage.pages.limit,
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-[#8f867c]">OCR used</p>
                            <p className="font-semibold text-[#37322d]">
                                {formatCount(usage.ocrPages.used)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[#8f867c]">OCR remaining</p>
                            <p className="font-semibold text-[#37322d]">
                                {formatCount(usage.ocrPages.remaining)}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-md border border-[#e3dbcf] bg-[#f3efe8] px-3 py-2 text-sm">
                        <span className="text-[#8f867c]">Extra estimate: </span>
                        <span className="font-semibold text-[#37322d]">
                            {usage.extraUsageEstimate.formatted}
                        </span>
                    </div>
                </div>
            )}
        </article>
    );
}
