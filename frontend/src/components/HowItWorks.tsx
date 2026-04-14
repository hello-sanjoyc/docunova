/**
 * HowItWorks
 *
 * Four-step process walkthrough rendered as a horizontal card row with
 * decorative arrows between steps on desktop (arrows are hidden on mobile
 * where the layout stacks vertically).
 *
 * Data lives in STEPS rather than inline JSX so the copy and icons can be
 * updated without touching layout logic.
 *
 * AI integration note (Step 2):
 *   "Claude extracts text, chunks long docs, and identifies all 8 key fields"
 *   The "8 key fields" are: parties, effectiveDate, obligations, payment,
 *   penalties, renewalTerms, redFlags, recommendedActions. These map 1:1 to
 *   the fields shown in BriefCardPreview.
 */

import ScrollReveal from "./ScrollReveal";

/**
 * Each step in the user journey from upload to shareable brief.
 * `color` is a Tailwind bg utility applied to the icon container.
 * `icon` is an inline SVG — kept here rather than a separate icon library
 * to avoid a dependency just for 4 small icons.
 */
const STEPS = [
    {
        number: "Step 1",
        title: "Upload doc",
        description:
            "Drop any PDF or DOCX — lease, NDA, SaaS terms, vendor agreement",
        color: "bg-amber-light",
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C8852A"
                strokeWidth="1.5"
            >
                <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ),
    },
    {
        number: "Step 2",
        title: "AI reads it",
        // Claude API call happens here in the backend; long docs are chunked
        // with a map-reduce summarisation strategy (see FAQ for user copy).
        description:
            "Claude extracts text, chunks long docs, and identifies all 8 key fields",
        color: "bg-danger-light",
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B03A2E"
                strokeWidth="1.5"
            >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
        ),
    },
    {
        number: "Step 3",
        title: "Get your brief",
        description:
            "Clean 1-page summary with expandable sections, red flags highlighted",
        // Neutral color: step 3 is the output — no action color needed.
        color: "bg-parchment border border-border",
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7A7569"
                strokeWidth="1.5"
            >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    {
        number: "Step 4",
        title: "Download or share",
        // Shareable links are read-only and do not require the recipient to sign up.
        description:
            "Export as PDF or send a read-only link — no login required for recipients",
        color: "bg-sage-light",
        icon: (
            <svg
                width="20"
                height="20"
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
];

/** Decorative horizontal arrow rendered between steps on md+ screens. */
const ArrowIcon = () => (
    <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
        <path
            d="M2 8h26M22 3l6 5-6 5"
            stroke="#C8C3B8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default function HowItWorks() {
    return (
        <ScrollReveal
            id="how-it-works"
            className="py-20 px-6 max-w-5xl mx-auto"
        >
            <div className="text-center mb-14">
                <p className="text-xs uppercase tracking-[0.15em] text-muted mb-3">
                    How it works
                </p>
                <h2 className="text-4xl font-light tracking-tight">
                    <span className="font-serif">File in,</span> brief out.
                </h2>
            </div>

            {/* Steps are laid out manually (not .map) so ArrowIcon separators
                can be interspersed without awkward index checks.
                On mobile this collapses to a vertical stack (flex-col). */}
            <div className="flex flex-col md:flex-row items-start md:items-start gap-4">
                <StepCard step={STEPS[0]} />
                <div className="hidden md:flex items-center justify-center mt-6 shrink-0">
                    <ArrowIcon />
                </div>
                <StepCard step={STEPS[1]} />
                <div className="hidden md:flex items-center justify-center mt-6 shrink-0">
                    <ArrowIcon />
                </div>
                <StepCard step={STEPS[2]} />
                <div className="hidden md:flex items-center justify-center mt-6 shrink-0">
                    <ArrowIcon />
                </div>
                <StepCard step={STEPS[3]} />
            </div>
        </ScrollReveal>
    );
}

/** Renders a single step card. Private to this module — not exported. */
function StepCard({ step }: { step: (typeof STEPS)[number] }) {
    return (
        <div className="text-center flex-1 min-w-0">
            <div
                className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4`}
            >
                {step.icon}
            </div>
            <p className="text-[11px] text-muted uppercase tracking-wider mb-1">
                {step.number}
            </p>
            <p className="font-medium text-ink mb-2 text-[15px]">
                {step.title}
            </p>
            <p className="text-[13px] text-muted leading-relaxed">
                {step.description}
            </p>
        </div>
    );
}
