export function decimalToNumber(value: unknown): number {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && typeof value === "object" && "toNumber" in value) {
        const parsed = (value as { toNumber: () => number }).toNumber();
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && typeof value === "object" && "toString" in value) {
        const parsed = Number(value.toString());
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

export function formatCurrencyAmount(amount: number, currencyCode: string) {
    try {
        return new Intl.NumberFormat("en", {
            style: "currency",
            currency: currencyCode,
            maximumFractionDigits: amount >= 1000 ? 0 : 2,
        }).format(amount);
    } catch {
        return `${currencyCode} ${amount.toFixed(2)}`;
    }
}
