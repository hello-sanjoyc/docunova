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
import JsonLd from "@/components/seo/JsonLd";
import {
    DEFAULT_TITLE,
    SITE_DESCRIPTION,
    createOrganizationSchema,
    createPageMetadata,
    createSoftwareApplicationSchema,
    createWebsiteSchema,
} from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    path: "/",
    absoluteTitle: true,
});

export default function Home() {
    return (
        <>
            <JsonLd
                id="home-schema"
                data={[
                    createOrganizationSchema(),
                    createWebsiteSchema(),
                    createSoftwareApplicationSchema(),
                ]}
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
