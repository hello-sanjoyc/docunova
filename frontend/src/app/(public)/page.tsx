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
import Navbar from "@/components/public/Navbar";
import Hero from "@/components/public/Hero";
import StatsBar from "@/components/public/StatsBar";
import HowItWorks from "@/components/public/HowItWorks";
import Features from "@/components/public/Features";
import SocialProof from "@/components/public/SocialProof";
import Pricing from "@/components/public/Pricing";
import FAQ from "@/components/public/FAQ";
import FinalCTA from "@/components/public/FinalCTA";
import Footer from "@/components/public/Footer";
import MoveToUpButton from "@/components/public/MoveToUpButton";
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
