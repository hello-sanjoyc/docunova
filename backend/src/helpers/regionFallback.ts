const EUROPE_COUNTRIES = new Set([
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
    "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
    "SI", "ES", "SE",
]);

const MIDDLE_EAST_COUNTRIES = new Set([
    "AE", "SA", "QA", "KW", "BH", "OM", "JO", "LB", "IL", "TR",
]);

const REGION_ALIASES: Record<string, string> = {
    IN: "IN",
    US: "US",
    CA: "CA",
    UK: "UK",
    GB: "UK",
    AU: "AU",
    EU: "EU",
    ME: "ME",
    DEFAULT: "DEFAULT",
};

export function normalizeRegionCode(input?: string | null) {
    if (!input) return null;
    return REGION_ALIASES[input.trim().toUpperCase()] ?? null;
}

export function regionFromCountryCode(countryCode?: string | null) {
    if (!countryCode) return null;
    const normalized = countryCode.trim().toUpperCase();
    if (REGION_ALIASES[normalized]) return REGION_ALIASES[normalized];
    if (EUROPE_COUNTRIES.has(normalized)) return "EU";
    if (MIDDLE_EAST_COUNTRIES.has(normalized)) return "ME";
    return null;
}

export function resolveRequestedRegion(input: {
    regionCode?: string | null;
    countryCode?: string | null;
}) {
    return (
        normalizeRegionCode(input.regionCode) ??
        regionFromCountryCode(input.countryCode) ??
        "DEFAULT"
    );
}
