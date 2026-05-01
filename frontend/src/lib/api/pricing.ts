import { apiRequest } from "./request";
import { API_ENDPOINTS } from "./endpoints";

export type BillingCycle = "monthly" | "yearly";
export type LimitPeriod = "lifetime" | "monthly" | "yearly" | "none";
export type SubscriptionStatus = "active" | "trialing" | "cancelled" | "expired";

export interface PricingRegion {
    code: string;
    name: string;
    currencyCode: string;
}

export interface PlanFeature {
    key: string;
    name: string;
    description: string | null;
    included: boolean;
}

export interface PlanLimit {
    key: string;
    value: number;
    period: LimitPeriod;
}

export interface PlanPrice {
    regionCode: string;
    requestedRegionCode: string;
    isFallback: boolean;
    currencyCode: string;
    monthlyPrice: number;
    yearlyPrice: number;
    extraPagePrice: number;
    extraOcrPagePrice: number;
}

export interface PricingPlan {
    id: string;
    slug: "starter" | "professional" | "team" | string;
    name: string;
    description: string | null;
    isActive: boolean;
    sortOrder: number;
    features: PlanFeature[];
    limits: PlanLimit[];
    price: PlanPrice | null;
    prices: PlanPrice[];
}

export interface PricingResponse {
    requestedRegionCode: string;
    regions: PricingRegion[];
    plans: PricingPlan[];
}

export interface SubscriptionSummary {
    id: string | null;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    countryCode: string | null;
    regionCode: string;
    startedAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelledAt?: string | null;
    plan: PricingPlan;
}

export interface CreateSubscriptionRequest {
    user_id?: string;
    plan_slug: string;
    region_code?: string;
    billing_cycle: BillingCycle;
}

export interface UsageSummary {
    subscription: SubscriptionSummary;
    pages: {
        used: number;
        limit: number;
        remaining: number;
        period: "lifetime" | "monthly";
    };
    ocrPages: {
        used: number;
        limit: number;
        remaining: number;
        period: "lifetime" | "monthly";
    };
    extraUsageEstimate: {
        amount: number;
        currencyCode: string;
        formatted: string;
    };
}

export interface UsageCheckRequest {
    user_id?: string;
    page_count: number;
    ocr_page_count?: number;
}

export interface UsageCheckResponse {
    allowed: boolean;
    reason: string | null;
    currentUsage: {
        pagesUsed: number;
        ocrPagesUsed: number;
    };
    planLimit: {
        planSlug: string;
        pages: number;
        ocrPages: number;
        maxPagesPerUpload: number | null;
    };
    estimatedExtraPageCharge: number;
    estimatedOcrCharge: number;
    estimatedTotalCharge: number;
    formattedEstimate: string;
    currencyCode: string;
}

export interface UsageRecordRequest {
    user_id?: string;
    document_id?: string;
    pages_used: number;
    ocr_pages_used?: number;
}

type PricingRequest = {
    regionCode?: string;
    countryCode?: string;
};

export function getPricing(request?: string | PricingRequest) {
    const params =
        typeof request === "string"
            ? { region_code: request }
            : {
                  ...(request?.regionCode
                      ? { region_code: request.regionCode }
                      : {}),
                  ...(request?.countryCode
                      ? { country_code: request.countryCode }
                      : {}),
              };

    return apiRequest<PricingResponse>({
        method: "GET",
        url: API_ENDPOINTS.PRICING.BASE,
        params: Object.keys(params).length ? params : undefined,
    });
}

export function getPlan(slug: string, regionCode?: string) {
    return apiRequest<PricingPlan>({
        method: "GET",
        url: API_ENDPOINTS.PRICING.PLAN(slug),
        params: regionCode ? { region_code: regionCode } : undefined,
    });
}

export function createSubscription(payload: CreateSubscriptionRequest) {
    return apiRequest<SubscriptionSummary>({
        method: "POST",
        url: API_ENDPOINTS.SUBSCRIPTIONS.BASE,
        data: payload,
    });
}

export function getCurrentSubscription() {
    return apiRequest<SubscriptionSummary>({
        method: "GET",
        url: API_ENDPOINTS.SUBSCRIPTIONS.CURRENT,
    });
}

export function cancelSubscription() {
    return apiRequest<{ cancelled: boolean }>({
        method: "POST",
        url: API_ENDPOINTS.SUBSCRIPTIONS.CANCEL,
    });
}

export function getUsageSummary() {
    return apiRequest<UsageSummary>({
        method: "GET",
        url: API_ENDPOINTS.USAGE.SUMMARY,
    });
}

export function checkUsage(payload: UsageCheckRequest) {
    return apiRequest<UsageCheckResponse>({
        method: "POST",
        url: API_ENDPOINTS.USAGE.CHECK,
        data: payload,
    });
}

export function recordUsage(payload: UsageRecordRequest) {
    return apiRequest<{ id: string }>({
        method: "POST",
        url: API_ENDPOINTS.USAGE.RECORD,
        data: payload,
    });
}
