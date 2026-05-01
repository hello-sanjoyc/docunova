export interface UsageCalculationInput {
    planSlug: string;
    pageCount: number;
    ocrPageCount: number;
    pagesUsed: number;
    ocrPagesUsed: number;
    limits: Record<string, number>;
    extraPagePrice: number;
    extraOcrPagePrice: number;
    currencyCode: string;
}

export function calculateUsage(input: UsageCalculationInput) {
    const maxPagesPerUpload = input.limits.max_pages_per_upload ?? Infinity;
    const pageLimit =
        input.planSlug === "starter"
            ? input.limits.lifetime_pages ?? 0
            : input.limits.pages_per_month ?? 0;
    const ocrIncluded = input.limits.ocr_pages_included ?? 0;

    if (input.pageCount > maxPagesPerUpload) {
        return {
            allowed: false,
            reason: `This plan allows a maximum of ${maxPagesPerUpload} pages per upload.`,
            pageLimit,
            ocrIncluded,
            extraPages: 0,
            extraOcrPages: 0,
            estimatedExtraPageCharge: 0,
            estimatedOcrCharge: 0,
        };
    }

    if (input.planSlug === "starter" && input.ocrPageCount > 0) {
        return {
            allowed: false,
            reason: "Starter supports text-based documents only. OCR requires a paid plan.",
            pageLimit,
            ocrIncluded,
            extraPages: 0,
            extraOcrPages: 0,
            estimatedExtraPageCharge: 0,
            estimatedOcrCharge: 0,
        };
    }

    const projectedPages = input.pagesUsed + input.pageCount;
    if (input.planSlug === "starter" && projectedPages > pageLimit) {
        return {
            allowed: false,
            reason: `Starter includes ${pageLimit} lifetime pages. Upgrade to continue.`,
            pageLimit,
            ocrIncluded,
            extraPages: 0,
            extraOcrPages: 0,
            estimatedExtraPageCharge: 0,
            estimatedOcrCharge: 0,
        };
    }

    const extraPages =
        input.planSlug === "starter"
            ? 0
            : Math.max(0, projectedPages - pageLimit);
    const projectedOcrPages = input.ocrPagesUsed + input.ocrPageCount;
    const extraOcrPages =
        input.planSlug === "starter"
            ? 0
            : Math.max(0, projectedOcrPages - ocrIncluded);

    return {
        allowed: true,
        reason: null,
        pageLimit,
        ocrIncluded,
        extraPages,
        extraOcrPages,
        estimatedExtraPageCharge: extraPages * input.extraPagePrice,
        estimatedOcrCharge: extraOcrPages * input.extraOcrPagePrice,
    };
}
