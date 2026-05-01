import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const regions = [
    { code: "IN", name: "India", currencyCode: "INR" },
    { code: "US", name: "United States", currencyCode: "USD" },
    { code: "CA", name: "Canada", currencyCode: "CAD" },
    { code: "UK", name: "United Kingdom", currencyCode: "GBP" },
    { code: "AU", name: "Australia", currencyCode: "AUD" },
    { code: "EU", name: "Europe", currencyCode: "EUR" },
    { code: "ME", name: "Middle East", currencyCode: "AED" },
    { code: "DEFAULT", name: "Default", currencyCode: "INR" },
] as const;

const plans = [
    {
        slug: "starter",
        name: "Starter",
        description: "Free plan for trying DocuNova with text-based PDFs.",
        sortOrder: 10,
    },
    {
        slug: "professional",
        name: "Professional",
        description: "Monthly document intelligence for individuals and growing teams.",
        sortOrder: 20,
    },
    {
        slug: "team",
        name: "Team",
        description: "Shared contract workspace with higher limits and team controls.",
        sortOrder: 30,
    },
] as const;

const features = [
    { key: "pdf_upload", name: "PDF upload", description: "Upload PDF documents." },
    { key: "docx_upload", name: "DOCX upload", description: "Upload Microsoft Word documents." },
    { key: "text_based_only", name: "Text-based documents only", description: "Only documents with extractable text are supported." },
    { key: "ocr", name: "OCR", description: "OCR support for scanned PDFs and images." },
    { key: "one_page_ai_brief", name: "1-page AI brief", description: "Generate a concise AI summary." },
    { key: "pdf_summary_download", name: "PDF summary download", description: "Download AI summaries as PDF." },
    { key: "shareable_links", name: "Shareable links", description: "Share read-only links." },
    { key: "team_members", name: "Team members", description: "Invite team members." },
    { key: "shared_vault", name: "Shared vault", description: "Shared team document workspace." },
    { key: "activity_log", name: "Activity log", description: "Track team activity." },
    { key: "priority_support", name: "Priority support", description: "Prioritized customer support." },
] as const;

const featureMatrix: Record<string, Record<string, boolean>> = {
    starter: {
        pdf_upload: true,
        docx_upload: false,
        text_based_only: true,
        ocr: false,
        one_page_ai_brief: true,
        pdf_summary_download: true,
        shareable_links: false,
        team_members: false,
        shared_vault: false,
        activity_log: false,
        priority_support: false,
    },
    professional: {
        pdf_upload: true,
        docx_upload: true,
        text_based_only: false,
        ocr: true,
        one_page_ai_brief: true,
        pdf_summary_download: true,
        shareable_links: true,
        team_members: false,
        shared_vault: false,
        activity_log: false,
        priority_support: false,
    },
    team: {
        pdf_upload: true,
        docx_upload: true,
        text_based_only: false,
        ocr: true,
        one_page_ai_brief: true,
        pdf_summary_download: true,
        shareable_links: true,
        team_members: true,
        shared_vault: true,
        activity_log: true,
        priority_support: true,
    },
};

const limits: Record<string, Array<{ key: string; value: number; period: "LIFETIME" | "MONTHLY" | "NONE" }>> = {
    starter: [
        { key: "lifetime_pages", value: 50, period: "LIFETIME" },
        { key: "max_pages_per_upload", value: 20, period: "NONE" },
        { key: "storage_mb", value: 100, period: "NONE" },
        { key: "ocr_pages_included", value: 0, period: "LIFETIME" },
    ],
    professional: [
        { key: "pages_per_month", value: 1000, period: "MONTHLY" },
        { key: "max_pages_per_upload", value: 100, period: "NONE" },
        { key: "ocr_pages_included", value: 250, period: "MONTHLY" },
        { key: "storage_mb", value: 5120, period: "NONE" },
        { key: "team_members_included", value: 1, period: "NONE" },
    ],
    team: [
        { key: "pages_per_month", value: 3000, period: "MONTHLY" },
        { key: "max_pages_per_upload", value: 200, period: "NONE" },
        { key: "ocr_pages_included", value: 1000, period: "MONTHLY" },
        { key: "storage_mb", value: 20480, period: "NONE" },
        { key: "team_members_included", value: 3, period: "NONE" },
        { key: "minimum_team_seats", value: 3, period: "NONE" },
    ],
};

const paidPricing: Record<string, Record<string, {
    monthlyPrice: number;
    yearlyPrice: number;
    extraPagePrice: number;
    extraOcrPagePrice: number;
}>> = {
    IN: {
        professional: { monthlyPrice: 499, yearlyPrice: 4999, extraPagePrice: 0.4, extraOcrPagePrice: 0.8 },
        team: { monthlyPrice: 999, yearlyPrice: 9990, extraPagePrice: 0.3, extraOcrPagePrice: 0.6 },
    },
    US: {
        professional: { monthlyPrice: 19, yearlyPrice: 199, extraPagePrice: 0.02, extraOcrPagePrice: 0.04 },
        team: { monthlyPrice: 49, yearlyPrice: 490, extraPagePrice: 0.015, extraOcrPagePrice: 0.03 },
    },
    UK: {
        professional: { monthlyPrice: 19, yearlyPrice: 190, extraPagePrice: 0.02, extraOcrPagePrice: 0.04 },
        team: { monthlyPrice: 39, yearlyPrice: 390, extraPagePrice: 0.015, extraOcrPagePrice: 0.03 },
    },
    EU: {
        professional: { monthlyPrice: 19, yearlyPrice: 190, extraPagePrice: 0.02, extraOcrPagePrice: 0.04 },
        team: { monthlyPrice: 45, yearlyPrice: 450, extraPagePrice: 0.015, extraOcrPagePrice: 0.03 },
    },
    CA: {
        professional: { monthlyPrice: 25, yearlyPrice: 250, extraPagePrice: 0.025, extraOcrPagePrice: 0.05 },
        team: { monthlyPrice: 59, yearlyPrice: 590, extraPagePrice: 0.02, extraOcrPagePrice: 0.04 },
    },
    AU: {
        professional: { monthlyPrice: 29, yearlyPrice: 290, extraPagePrice: 0.03, extraOcrPagePrice: 0.06 },
        team: { monthlyPrice: 69, yearlyPrice: 690, extraPagePrice: 0.025, extraOcrPagePrice: 0.05 },
    },
    ME: {
        professional: { monthlyPrice: 69, yearlyPrice: 690, extraPagePrice: 0.08, extraOcrPagePrice: 0.16 },
        team: { monthlyPrice: 179, yearlyPrice: 1790, extraPagePrice: 0.06, extraOcrPagePrice: 0.12 },
    },
    DEFAULT: {
        professional: { monthlyPrice: 499, yearlyPrice: 4999, extraPagePrice: 0.4, extraOcrPagePrice: 0.8 },
        team: { monthlyPrice: 999, yearlyPrice: 9990, extraPagePrice: 0.3, extraOcrPagePrice: 0.6 },
    },
};

async function main() {
    for (const region of regions) {
        await prisma.region.upsert({
            where: { code: region.code },
            create: region,
            update: { name: region.name, currencyCode: region.currencyCode },
        });
    }

    const featureByKey = new Map<string, bigint>();
    for (const feature of features) {
        const saved = await prisma.feature.upsert({
            where: { key: feature.key },
            create: feature,
            update: { name: feature.name, description: feature.description },
            select: { id: true, key: true },
        });
        featureByKey.set(saved.key, saved.id);
    }

    for (const plan of plans) {
        const savedPlan = await prisma.plan.upsert({
            where: { slug: plan.slug },
            create: { ...plan, isActive: true },
            update: {
                name: plan.name,
                description: plan.description,
                isActive: true,
                sortOrder: plan.sortOrder,
                updatedAt: new Date(),
            },
            select: { id: true, slug: true },
        });

        for (const [featureKey, included] of Object.entries(featureMatrix[plan.slug])) {
            const featureId = featureByKey.get(featureKey);
            if (!featureId) continue;
            await prisma.planFeature.upsert({
                where: {
                    planId_featureId: {
                        planId: savedPlan.id,
                        featureId,
                    },
                },
                create: { planId: savedPlan.id, featureId, included },
                update: { included },
            });
        }

        for (const limit of limits[plan.slug]) {
            await prisma.planLimit.upsert({
                where: {
                    planId_key: {
                        planId: savedPlan.id,
                        key: limit.key,
                    },
                },
                create: {
                    planId: savedPlan.id,
                    key: limit.key,
                    value: limit.value,
                    period: limit.period,
                },
                update: { value: limit.value, period: limit.period },
            });
        }
    }

    const savedPlans = await prisma.plan.findMany({
        where: { slug: { in: plans.map((plan) => plan.slug) } },
        select: { id: true, slug: true },
    });
    const planBySlug = new Map(savedPlans.map((plan) => [plan.slug, plan]));
    const regionByCode = new Map(regions.map((region) => [region.code, region]));

    for (const region of regions) {
        const starter = planBySlug.get("starter");
        if (starter) {
            await prisma.planPrice.upsert({
                where: { planId_regionCode: { planId: starter.id, regionCode: region.code } },
                create: {
                    planId: starter.id,
                    regionCode: region.code,
                    currencyCode: region.currencyCode,
                    monthlyPrice: 0,
                    yearlyPrice: 0,
                    extraPagePrice: 0,
                    extraOcrPagePrice: 0,
                    isActive: true,
                },
                update: {
                    currencyCode: region.currencyCode,
                    monthlyPrice: 0,
                    yearlyPrice: 0,
                    extraPagePrice: 0,
                    extraOcrPagePrice: 0,
                    isActive: true,
                    updatedAt: new Date(),
                },
            });
        }
    }

    for (const [regionCode, plansForRegion] of Object.entries(paidPricing)) {
        const region = regionByCode.get(regionCode);
        if (!region) continue;
        for (const [planSlug, price] of Object.entries(plansForRegion)) {
            const plan = planBySlug.get(planSlug);
            if (!plan) continue;
            await prisma.planPrice.upsert({
                where: { planId_regionCode: { planId: plan.id, regionCode } },
                create: {
                    planId: plan.id,
                    regionCode,
                    currencyCode: region.currencyCode,
                    ...price,
                    isActive: true,
                },
                update: {
                    currencyCode: region.currencyCode,
                    ...price,
                    isActive: true,
                    updatedAt: new Date(),
                },
            });
        }
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
