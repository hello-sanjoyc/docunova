import PricingSection from "@/components/pricing/PricingSection";
import ScrollReveal from "./ScrollReveal";

export default function Pricing() {
    return (
        <ScrollReveal className="border-y border-border bg-parchment py-20">
            <div className="mx-auto mb-10 max-w-2xl px-6 text-center">
                <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">
                    Pricing
                </p>
                <h2 className="text-4xl font-light tracking-tight">
                    Simple pricing for{" "}
                    <span className="font-serif-italic">every stage.</span>
                </h2>
                <p className="mt-3 text-[15px] text-muted">
                    Plans are global. Prices localize by region and fall back
                    automatically when a regional price is unavailable.
                </p>
            </div>
            <PricingSection hideHeader />
        </ScrollReveal>
    );
}
