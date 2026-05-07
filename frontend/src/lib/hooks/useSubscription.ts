"use client";

import { useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";
import { getCurrentSubscription, type PricingPlan } from "@/lib/api/pricing";

export function useSubscription() {
    const query = useApiQuery({
        queryKey: queryKeys.subscriptions.current(),
        queryFn: getCurrentSubscription,
        staleTime: 60_000,
    });

    const plan: PricingPlan | undefined = query.data?.plan;
    const planSlug = plan?.slug ?? "starter";

    function hasFeature(key: string): boolean {
        return plan?.features.find((f) => f.key === key)?.included ?? false;
    }

    function getLimit(key: string): number {
        return plan?.limits.find((l) => l.key === key)?.value ?? 0;
    }

    return {
        subscription: query.data,
        plan,
        planSlug,
        isLoading: query.isPending,
        hasFeature,
        getLimit,
    };
}
