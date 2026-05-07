export const PRICING_COUNTRY_CODE_KEY = "docunova.pricing.countryCode";

export function normalizeCountryCode(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export function readStoredPricingCountryCode() {
  if (typeof window === "undefined") return null;

  try {
    return normalizeCountryCode(
      window.localStorage.getItem(PRICING_COUNTRY_CODE_KEY),
    );
  } catch {
    return null;
  }
}

export async function detectPricingCountryCode() {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) return null;

    const data = (await response.json()) as { country_code?: unknown };
    const code = normalizeCountryCode(data.country_code);

    if (code) {
      try {
        window.localStorage.setItem(PRICING_COUNTRY_CODE_KEY, code);
      } catch {
        // Storage is optional; callers can still use the detected value.
      }
    }

    return code;
  } catch {
    return null;
  }
}

export async function getPricingCountryCode() {
  return readStoredPricingCountryCode() ?? detectPricingCountryCode();
}
