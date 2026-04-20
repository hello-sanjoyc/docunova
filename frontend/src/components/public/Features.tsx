/**
 * Features
 *
 * 3-column card grid showcasing the six core product capabilities.
 * Ordered by perceived value: AI extraction and red flag detection first
 * (the core differentiators), then sharing, history, team, and chat.
 *
 * Icon background color semantics:
 *   amber-light  → AI / core intelligence features
 *   danger-light → risk / warning features (red flag detection)
 *   sage-light   → collaboration / sharing features
 *   parchment    → standard utility features
 */

import ScrollReveal from "./ScrollReveal";

const FEATURES = [
    {
        title: "AI-powered extraction",
        description:
            "AI reads the full contract and pulls out what matters — obligations, dates, penalties, and red flags — in plain English.",
        iconBg: "bg-amber-light",
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C8852A"
                strokeWidth="1.5"
            >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        ),
    },
    {
        title: "Red flag detection",
        description:
            "Unusual clauses, one-sided liability, and auto-renewal traps are surfaced and highlighted automatically — before you sign.",
        iconBg: "bg-danger-light",
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B03A2E"
                strokeWidth="1.5"
            >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
    },
    {
        title: "Share without login",
        description:
            "Generate a read-only link to any brief. Teammates and clients can view it without an account — perfect for async review.",
        iconBg: "bg-sage-light",
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3A6B4E"
                strokeWidth="1.5"
            >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
        ),
    },
    {
        title: "Document history",
        description:
            "Every brief is saved to your dashboard. Compare old and new versions of a contract or pull up any doc from your history instantly.",
        iconBg: "bg-parchment border border-border",
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7A7569"
                strokeWidth="1.5"
            >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        title: "Team vault",
        description:
            "Shared workspace where your whole team sees every uploaded contract. Ideal for agencies, legal teams, and growing startups.",
        // Team features are Pro+; gating is enforced in the backend, not here.
        iconBg: "bg-parchment border border-border",
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7A7569"
                strokeWidth="1.5"
            >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
    },
    {
        title: "Ask a follow-up",
        description:
            'After your brief is ready, ask any question about the doc — "What happens if I miss a payment?" — and get a direct answer.',
        // Follow-up chat is a second Claude call with the original doc context.
        iconBg: "bg-parchment border border-border",
        icon: (
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7A7569"
                strokeWidth="1.5"
            >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
        ),
    },
];

export default function Features() {
    return (
        <ScrollReveal
            id="features"
            className="py-20 px-6 bg-parchment border-y border-border"
        >
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-14">
                    <p className="text-xs uppercase tracking-[0.15em] text-muted mb-3">
                        Features
                    </p>
                    <h2 className="text-4xl font-light tracking-tight">
                        Everything a busy founder
                        <br />
                        <span className="font-serif-italic">
                            needs to review a contract fast.
                        </span>
                    </h2>
                </div>

                {/* 3-col grid collapses to 1-col on mobile via md: breakpoint */}
                <div className="grid md:grid-cols-3 gap-5">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.title}
                            className="bg-cream rounded-2xl border border-border p-7"
                        >
                            <div
                                className={`w-10 h-10 ${feature.iconBg} rounded-xl flex items-center justify-center mb-5`}
                            >
                                {feature.icon}
                            </div>
                            <h3 className="font-medium text-ink mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-[14px] text-muted leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </ScrollReveal>
    );
}
