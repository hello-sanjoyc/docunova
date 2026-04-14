/**
 * Home page — landing page composition.
 *
 * Section order follows a standard SaaS conversion flow:
 *   Hero        → hook + primary upload CTA
 *   StatsBar    → immediate social proof / credibility
 *   HowItWorks  → remove uncertainty about the product
 *   Features    → reinforce value proposition
 *   SocialProof → peer validation (testimonials)
 *   Pricing     → convert intent to action
 *   FAQ         → remove last objections
 *   FinalCTA    → second conversion opportunity for scroll-readers
 *
 * Each section wraps itself in <ScrollReveal> where appropriate — this
 * page doesn't need to add any animation wrappers.
 */

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import SocialProof from "@/components/SocialProof";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import MoveToUpButton from "@/components/MoveToUpButton";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
    title: `${SITE_NAME} | Understand any contract in 60 seconds`,
    description: SITE_DESCRIPTION,
    alternates: {
        canonical: "/",
    },
};

const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
    },
};

export default function Home() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema),
                }}
            />
            <Navbar />
            <main>
                <Hero />
                <StatsBar />
                <HowItWorks />
                <Features />
                <SocialProof />
                <Pricing />
                <FAQ />
                <FinalCTA />
            </main>
            <Footer />
            <MoveToUpButton />
        </>
    );
}
