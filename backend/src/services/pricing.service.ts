import prisma from "../config/prisma";
import { decimalToNumber } from "../helpers/currencyFormatter";
import { resolveRequestedRegion } from "../helpers/regionFallback";
import { PricingQuery } from "../models/pricing.model";

const DEFAULT_REGION = "DEFAULT";

type PlanWithCatalog = Awaited<ReturnType<typeof loadPlanCatalog>>[number];

function limitToApi(limit: PlanWithCatalog["limits"][number]) {
    return {
        key: limit.key,
        value: decimalToNumber(limit.value),
        period: limit.period.toLowerCase(),
    };
}

function featureToApi(feature: PlanWithCatalog["features"][number]) {
    return {
        key: feature.feature.key,
        name: feature.feature.name,
        description: feature.feature.description,
        included: feature.included,
    };
}

function priceToApi(price: PlanWithCatalog["prices"][number], requestedRegion: string) {
    return {
        regionCode: price.regionCode,
        requestedRegionCode: requestedRegion,
        isFallback: price.regionCode !== requestedRegion,
        currencyCode: price.currencyCode,
        monthlyPrice: decimalToNumber(price.monthlyPrice),
        yearlyPrice: decimalToNumber(price.yearlyPrice),
        extraPagePrice: decimalToNumber(price.extraPagePrice),
        extraOcrPagePrice: decimalToNumber(price.extraOcrPagePrice),
    };
}

function choosePrice(plan: PlanWithCatalog, requestedRegion: string) {
    return (
        plan.prices.find((price) => price.regionCode === requestedRegion && price.isActive) ??
        plan.prices.find((price) => price.regionCode === DEFAULT_REGION && price.isActive) ??
        plan.prices.find((price) => price.isActive) ??
        null
    );
}

async function loadPlanCatalog() {
    return prisma.plan.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: {
            features: {
                include: { feature: true },
                orderBy: { feature: { name: "asc" } },
            },
            limits: {
                orderBy: { key: "asc" },
            },
            prices: {
                where: { isActive: true },
                orderBy: { regionCode: "asc" },
            },
        },
    });
}

export function serializePlan(plan: PlanWithCatalog, requestedRegion: string) {
    const selectedPrice = choosePrice(plan, requestedRegion);

    return {
        id: plan.id.toString(),
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
        features: plan.features.map(featureToApi),
        limits: plan.limits.map(limitToApi),
        price: selectedPrice ? priceToApi(selectedPrice, requestedRegion) : null,
        prices: plan.prices.map((price) => priceToApi(price, requestedRegion)),
    };
}

export async function getPricing(query: PricingQuery = {}) {
    const requestedRegion = resolveRequestedRegion({
        regionCode: query.region_code,
        countryCode: query.country_code,
    });
    const [plans, regions] = await Promise.all([
        loadPlanCatalog(),
        prisma.region.findMany({ orderBy: { id: "asc" } }),
    ]);

    return {
        requestedRegionCode: requestedRegion,
        regions: regions.map((region) => ({
            code: region.code,
            name: region.name,
            currencyCode: region.currencyCode,
        })),
        plans: plans.map((plan) => serializePlan(plan, requestedRegion)),
    };
}

export async function getPlanBySlug(slug: string, query: PricingQuery = {}) {
    const requestedRegion = resolveRequestedRegion({
        regionCode: query.region_code,
        countryCode: query.country_code,
    });
    const plans = await loadPlanCatalog();
    const plan = plans.find((item) => item.slug === slug);
    if (!plan) {
        throw Object.assign(new Error("Plan not found"), { statusCode: 404 });
    }

    return serializePlan(plan, requestedRegion);
}

export async function getPlanCatalogForUsage(slug: string, regionCode: string) {
    const plans = await loadPlanCatalog();
    const plan = plans.find((item) => item.slug === slug);
    if (!plan) {
        throw Object.assign(new Error("Plan not found"), { statusCode: 404 });
    }
    return serializePlan(plan, regionCode);
}
