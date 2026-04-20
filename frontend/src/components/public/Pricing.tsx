/**
 * Pricing
 *
 * Three-tier pricing table: Free → Pro (highlighted) → Team.
 *
 * Layout notes:
 *   - All three cards use `flex flex-col` with `flex-1` on the feature list so
 *     CTA buttons align at the bottom regardless of list length.
 *   - The Pro card uses `border-[1.5px] border-amber` + an absolutely-positioned
 *     "Most popular" badge to draw the eye without changing card dimensions.
 *
 * Feature gate enforcement happens in the backend — the UI here is copy only.
 * CheckIcon / CrossIcon are file-private (not exported) since they're only
 * needed for this feature list pattern.
 *
 * TODO: Wire CTA hrefs to the real Stripe checkout or auth flow.
 */

import ScrollReveal from "./ScrollReveal";

/** Green checkmark for included features. */
const CheckIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="#3A6B4E"
        strokeWidth="2"
    >
        <polyline points="2,8 6,12 14,4" />
    </svg>
);

/** Muted cross for features not included in a tier. */
const CrossIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="#C8C3B8"
        strokeWidth="2"
    >
        <line x1="4" y1="4" x2="12" y2="12" />
        <line x1="12" y1="4" x2="4" y2="12" />
    </svg>
);

export default function Pricing() {
    return (
        <ScrollReveal
            id="pricing"
            className="py-20 px-6 bg-parchment border-y border-border"
        >
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-14">
                    <p className="text-xs uppercase tracking-[0.15em] text-muted mb-3">
                        Pricing
                    </p>
                    <h2 className="text-4xl font-light tracking-tight">
                        Simple pricing for{" "}
                        <span className="font-serif-italic">every stage.</span>
                    </h2>
                    <p className="text-muted mt-3 text-[15px]">
                        No credit card required for free tier. Cancel anytime.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-5">
                    {/* ── Free tier ─────────────────────────────────────────────── */}
                    <div className="bg-cream rounded-2xl border border-border p-7 flex flex-col">
                        <div className="mb-6">
                            <p className="text-[13px] font-medium text-muted uppercase tracking-wider mb-2">
                                Free
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-light text-ink font-serif">
                                    $0
                                </span>
                                <span className="text-muted text-sm">/mo</span>
                            </div>
                            <p className="text-[13px] text-muted mt-1">
                                3 documents lifetime
                            </p>
                        </div>

                        {/* flex-1 pushes the CTA to the card bottom */}
                        <ul className="space-y-3 mb-8 flex-1">
                            {[
                                "PDF + DOCX upload",
                                "1-page AI brief",
                                "Download PDF export",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-2.5 text-[13px] text-ink"
                                >
                                    <CheckIcon />
                                    {item}
                                </li>
                            ))}
                            {["Document history", "Shareable links"].map(
                                (item) => (
                                    <li
                                        key={item}
                                        className="flex items-center gap-2.5 text-[13px] text-muted"
                                    >
                                        <CrossIcon />
                                        {item}
                                    </li>
                                ),
                            )}
                        </ul>

                        <a
                            href="/signup"
                            className="block text-center text-[14px] font-medium border border-border rounded-full py-2.5 hover:border-amber hover:text-amber transition-colors"
                        >
                            Start free
                        </a>
                    </div>

                    {/* ── Pro tier (featured) ────────────────────────────────────── */}
                    {/* border-[1.5px] (not border-2) matches the 1.5px stroke used
              throughout the design system without being as heavy as 2px. */}
                    <div className="bg-cream rounded-2xl border-[1.5px] border-amber p-7 flex flex-col relative">
                        {/* Badge is absolutely positioned so it visually overlaps the card
                top edge without affecting the internal layout. */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-amber text-cream text-[11px] font-medium px-3 py-1 rounded-full">
                                Most popular
                            </span>
                        </div>

                        <div className="mb-6">
                            <p className="text-[13px] font-medium text-amber uppercase tracking-wider mb-2">
                                Pro
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-light text-ink font-serif">
                                    $49
                                </span>
                                <span className="text-muted text-sm">/mo</span>
                            </div>
                            <p className="text-[13px] text-muted mt-1">
                                Unlimited documents
                            </p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {[
                                "Everything in Free",
                                "Unlimited uploads",
                                "Full red flag analysis",
                                "Document history",
                                "Shareable read-only links",
                                "Follow-up questions",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-2.5 text-[13px] text-ink"
                                >
                                    <CheckIcon />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        {/* TODO: href → Stripe checkout for Pro plan */}
                        <a
                            href="/signup"
                            className="block text-center text-[14px] font-medium bg-ink text-cream rounded-full py-2.5 hover:bg-amber transition-colors"
                        >
                            Start 7-day trial
                        </a>
                    </div>

                    {/* ── Team tier ──────────────────────────────────────────────── */}
                    <div className="bg-cream rounded-2xl border border-border p-7 flex flex-col">
                        <div className="mb-6">
                            <p className="text-[13px] font-medium text-muted uppercase tracking-wider mb-2">
                                Team
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-light text-ink font-serif">
                                    $149
                                </span>
                                <span className="text-muted text-sm">/mo</span>
                            </div>
                            <p className="text-[13px] text-muted mt-1">
                                Shared team workspace
                            </p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {[
                                "Everything in Pro",
                                "Shared team vault",
                                "Multiple users",
                                "Admin permissions",
                                "Priority support",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-2.5 text-[13px] text-ink"
                                >
                                    <CheckIcon />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        {/* TODO: href → Stripe checkout for Team plan */}
                        <a
                            href="/signup"
                            className="block text-center text-[14px] font-medium border border-border rounded-full py-2.5 hover:border-amber hover:text-amber transition-colors"
                        >
                            Start 7-day trial
                        </a>
                    </div>
                </div>
            </div>
        </ScrollReveal>
    );
}
