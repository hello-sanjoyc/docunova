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

export default function Home() {
  return (
    <>
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
    </>
  );
}
