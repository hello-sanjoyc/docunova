import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PricingSection from "@/components/pricing/PricingSection";
import JsonLd from "@/components/seo/JsonLd";
import { createPageMetadata, createPricingSchema } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
    title: "Pricing",
    description:
        "Compare DocuNova AI plans for AI contract summaries, red flag detection, document history, and team document workflows.",
    path: "/pricing",
});

export default function PricingPage() {
    return (
        <>
            <JsonLd id="pricing-schema" data={createPricingSchema()} />
            <Navbar />
            <main className="bg-parchment py-16">
                <section className="mx-auto max-w-6xl px-6 pt-4">
                    <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">
                        Pricing
                    </p>
                    <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">
                        Simple pricing for{" "}
                        <span className="font-serif-italic">every stage.</span>
                    </h1>
                    <p className="mt-3 max-w-2xl text-[15px] text-muted">
                        Plans are global. Prices localize by region and fall
                        back automatically when a regional price is unavailable.
                    </p>
                </section>
                <PricingSection hideHeader className="pt-8" />
            </main>
            <Footer />
        </>
    );
}
