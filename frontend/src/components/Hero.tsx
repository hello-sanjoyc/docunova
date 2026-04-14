/**
 * Hero
 *
 * Two-column above-the-fold section:
 *   Left  — headline copy + UploadZone + doc-type pills
 *   Right — BriefCardPreview (static mock of the AI output)
 *
 * Animation: each left-column element uses `animate-fade-up` with a staggered
 * `anim-delay-N` class (0.1s increments). The CSS utility sets `opacity:0`
 * immediately so elements are hidden before the animation fires — this prevents
 * a brief flash of unstyled content on slow connections.
 * See globals.css `.anim-delay-*` and `@keyframes fadeUp`.
 *
 * BriefCardPreview shares the same anim-delay-3 as the sub-copy so both
 * columns reveal together visually.
 */

import BriefCardPreview from "./BriefCardPreview";
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
];

export default function Hero() {
    return (
        <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Left column — copy + upload */}
                <div id="upload">
                    {/* "No lawyer required" trust badge */}
                    <div className="inline-flex items-center gap-2 bg-amber-light text-amber-dark text-xs font-medium px-3 py-1.5 rounded-full mb-6 animate-fade-up anim-delay-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
                        No lawyer required
                    </div>

                    <h1 className="text-[52px] leading-[1.08] font-light tracking-tight mb-6 animate-fade-up anim-delay-2">
                        {/* font-serif / font-serif-italic mix adds editorial weight to
                key words without switching typefaces at the component level */}
                        <span className="font-serif">Understand</span> any
                        <br />
                        contract in
                        <br />
                        <span className="font-serif-italic text-amber">
                            60 seconds.
                        </span>
                    </h1>

                    <p className="text-[16px] text-muted leading-relaxed mb-8 max-w-md animate-fade-up anim-delay-3">
                        Upload a PDF or DOCX. Get a structured 1-page brief with
                        key dates, obligations, red flags, and renewal clauses —
                        in plain English.
                    </p>

                    {/* Primary conversion point — see UploadZone for state machine */}
                    <div className="animate-fade-up anim-delay-4">
                        <UploadZone />
                    </div>

                    {/* Supported doc-type pills — visual reassurance only, not a filter */}
                    <div className="flex flex-wrap gap-2 mt-6 animate-fade-up anim-delay-5">
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
                </div>

                {/* Right column — static AI output preview
            Replace <BriefCardPreview /> with a dynamic component once the
            upload API returns real data. */}
                <div className="animate-fade-up anim-delay-3">
                    <BriefCardPreview />
                </div>
            </div>
        </section>
    );
}
