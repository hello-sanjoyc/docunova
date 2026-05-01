"use client";

import { MapPin } from "lucide-react";
import type { PricingRegion } from "@/lib/api/pricing";

interface RegionSelectorProps {
    regions: PricingRegion[];
    value: string;
    onChange: (value: string) => void;
}

export default function RegionSelector({
    regions,
    value,
    onChange,
}: RegionSelectorProps) {
    return (
        <label className="inline-flex items-center gap-2 rounded-md border border-border bg-cream px-3 py-2 text-sm text-muted">
            <MapPin size={16} strokeWidth={1.8} aria-hidden="true" />
            <span className="sr-only">Region</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-w-40 bg-transparent text-ink outline-none"
            >
                {regions.map((region) => (
                    <option key={region.code} value={region.code}>
                        {region.name}
                    </option>
                ))}
            </select>
        </label>
    );
}
