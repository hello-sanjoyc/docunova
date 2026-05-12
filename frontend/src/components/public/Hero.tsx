"use client";

import { useEffect, useState } from "react";
import { Languages, LockKeyhole, MessageSquareQuote, Zap } from "lucide-react";

import BriefCardPreview from "./BriefCardPreview";
import DocumentChatPreview from "./DocumentChatPreview";
import UploadZone from "./UploadZone";

/**
 * Document types surfaced as pills below the upload zone.
 * These are marketing copy only — the actual accept list is enforced
 * in UploadZone's <input accept=".pdf,.docx">.
 * Add or remove entries here as the product expands supported formats.
 */
const DOC_TYPES = [
    "NDA",
    "Lease",
    "Vendor contract",
    "Employment",
    "SaaS terms",
    "Tender",
];

const CHAT_CAPSULES = [
    {
        label: "Cited answers",
        icon: MessageSquareQuote,
        className: "bg-[#EAF5FF] text-[#075A92]",
    },
    {
        label: "Instant responses",
        icon: Zap,
        className: "bg-[#E8F5EF] text-[#00685E]",
    },
    {
        label: "Document-private",
        icon: LockKeyhole,
        className: "bg-[#F0EDFF] text-[#49439A]",
    },
    {
        label: "Plain English",
        icon: Languages,
        className: "bg-[#F8ECD9] text-[#8A4F08]",
    },
];

const SLIDE_DURATION = 7000;

export default function Hero() {
    const [activeSlide, setActiveSlide] = useState(0);
    const isChatSlide = activeSlide === 1;

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveSlide((current) => (current + 1) % 2);
        }, SLIDE_DURATION);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-start">
                <div
                    id="upload"
                    className="min-h-[740px] sm:min-h-[670px] md:min-h-[590px]"
                >
                    <div className="inline-flex items-center gap-2 bg-amber-light text-amber-dark text-xs font-medium px-3 py-1.5 rounded-full mb-6 animate-fade-up anim-delay-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
                        {isChatSlide
                            ? "Document chat included"
                            : "No lawyer required"}
                    </div>

                    <div className="relative min-h-[515px] sm:min-h-[475px] md:min-h-[445px]">
                        <div
                            className={`absolute inset-0 transition-all duration-700 ease-out ${
                                isChatSlide
                                    ? "translate-x-5 opacity-0 pointer-events-none"
                                    : "translate-x-0 opacity-100"
                            }`}
                            aria-hidden={isChatSlide}
                            inert={isChatSlide ? true : undefined}
                        >
                            <h1 className="text-4xl sm:text-5xl leading-[1.08] font-light mb-6">
                                <span className="font-serif">Understand</span>{" "}
                                any
                                <br />
                                contract in{" "}
                                <span className="font-serif-italic text-amber">
                                    seconds.
                                </span>
                            </h1>

                            <p className="text-[16px] text-muted leading-relaxed mb-8 max-w-md">
                                Upload a PDF or DOCX. Get a structured 1-page
                                brief with key dates, obligations, red flags,
                                and renewal clauses — in plain English.
                            </p>

                            <UploadZone />
                        </div>

                        <div
                            className={`absolute inset-0 transition-all duration-700 ease-out ${
                                isChatSlide
                                    ? "translate-x-0 opacity-100"
                                    : "-translate-x-5 opacity-0 pointer-events-none"
                            }`}
                            aria-hidden={!isChatSlide}
                            inert={!isChatSlide ? true : undefined}
                        >
                            <div className="hero-chat-copy">
                                <h1 className="text-4xl sm:text-5xl leading-[1.08] font-light mb-6">
                                    <span className="font-serif">Ask</span> your
                                    contract
                                    <br />
                                    anything.{" "}
                                    <span className="font-serif-italic text-amber">
                                        Instantly.
                                    </span>
                                </h1>

                                <p className="text-[16px] text-muted leading-relaxed mb-8 max-w-md">
                                    After your 60-second analysis, go deeper.
                                    Ask questions in plain English — DocuNova AI
                                    responds with cited answers from your exact
                                    document.
                                </p>

                                <div className="grid grid-cols-2 gap-3 max-w-md">
                                    {CHAT_CAPSULES.map((item, index) => {
                                        const Icon = item.icon;

                                        return (
                                            <span
                                                key={item.label}
                                                className={`hero-capsule inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-[0_8px_22px_rgba(15,14,12,0.04)] ${item.className}`}
                                                style={{
                                                    animationDelay: `${index * 90}ms`,
                                                }}
                                            >
                                                <Icon
                                                    size={18}
                                                    strokeWidth={2.4}
                                                    aria-hidden="true"
                                                />
                                                {item.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-6 animate-fade-up anim-delay-4">
                        <span className="text-xs text-muted mr-1 self-center">
                            Works with:
                        </span>
                        {DOC_TYPES.map((type) => (
                            <span
                                key={type}
                                className="doc-type-pill text-xs px-3 py-1 rounded-full border border-border text-muted cursor-default transition-all"
                            >
                                {type}
                            </span>
                        ))}
                    </div>

                    <div
                        className="mt-8 flex items-center gap-2 animate-fade-up anim-delay-5"
                        aria-label="Hero carousel controls"
                    >
                        {[0, 1].map((slide) => (
                            <button
                                key={slide}
                                type="button"
                                onClick={() => setActiveSlide(slide)}
                                className={`h-2.5 rounded-full transition-all ${
                                    activeSlide === slide
                                        ? "w-8 bg-amber"
                                        : "w-2.5 bg-border hover:bg-amber-light"
                                }`}
                                aria-label={`Show slide ${slide + 1}`}
                                aria-current={
                                    activeSlide === slide ? "true" : undefined
                                }
                            />
                        ))}
                    </div>
                </div>

                <div className="relative min-h-[690px] sm:min-h-[620px] w-full animate-fade-up anim-delay-3">
                    <div
                        className={`absolute inset-x-0 top-0 transition-all duration-700 ease-out ${
                            isChatSlide
                                ? "translate-x-6 scale-[0.98] opacity-0 pointer-events-none"
                                : "translate-x-0 scale-100 opacity-100"
                        }`}
                        aria-hidden={isChatSlide}
                        inert={isChatSlide ? true : undefined}
                    >
                        <BriefCardPreview />
                    </div>

                    <div
                        className={`absolute inset-x-0 top-0 transition-all duration-700 ease-out ${
                            isChatSlide
                                ? "translate-x-0 scale-100 opacity-100"
                                : "-translate-x-6 scale-[0.98] opacity-0 pointer-events-none"
                        }`}
                        aria-hidden={!isChatSlide}
                        inert={!isChatSlide ? true : undefined}
                    >
                        <DocumentChatPreview />
                    </div>
                </div>
            </div>
        </section>
    );
}
