/**
 * SocialProof
 *
 * Three testimonial cards from early users, rendered as a 3-column grid.
 *
 * Avatar color pairs (avatarBg / avatarText) use the brand palette for
 * visual variety — amber for the first user, sage for the second, neutral
 * for the third — keeping the page color-consistent rather than using
 * arbitrary avatar photos.
 *
 * TESTIMONIALS are placeholder copy. Replace with real users before launch,
 * and optionally link initials to real profile photos.
 */

import ScrollReveal from "./ScrollReveal";

const TESTIMONIALS = [
  {
    initials: "RC",
    name: "Rachel C.",
    role: "E-commerce founder",
    avatarBg: "bg-amber-light",
    avatarText: "text-amber-dark",
    quote:
      "I uploaded my supplier agreement and got a clean summary in under a minute. Caught an auto-renewal clause I would have completely missed.",
  },
  {
    initials: "DM",
    name: "David M.",
    role: "SaaS founder",
    avatarBg: "bg-sage-light",
    avatarText: "text-sage-dark",
    quote:
      "Sent the shareable link to my co-founder instead of forwarding a 40-page PDF. Game changer for async teams reviewing vendor contracts.",
  },
  {
    initials: "SP",
    name: "Sara P.",
    role: "Agency owner",
    avatarBg: "bg-parchment border border-border",
    avatarText: "text-muted",
    quote:
      "Reviewed 6 client contracts in one afternoon. The red flags section alone is worth the subscription — it flagged indemnity language I'd have signed off on.",
  },
];

export default function SocialProof() {
  return (
    <ScrollReveal className="py-20 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-xs uppercase tracking-[0.15em] text-muted mb-3">
          From users
        </p>
        <h2 className="text-4xl font-light tracking-tight">
          Founders stop paying lawyers
          <br />
          <span className="font-serif-italic text-amber">
            for the first read.
          </span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {TESTIMONIALS.map(({ initials, name, role, avatarBg, avatarText, quote }) => (
          <div
            key={name}
            className="bg-cream border border-border rounded-2xl p-7"
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center text-[13px] font-medium ${avatarText} shrink-0`}
              >
                {initials}
              </div>
              <div>
                <p className="text-[14px] font-medium text-ink">{name}</p>
                <p className="text-[12px] text-muted">{role}</p>
              </div>
            </div>

            {/* &ldquo; / &rdquo; = proper typographic curly quotes */}
            <p className="text-[14px] text-ink leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>

            {/* Stars: hardcoded 5-star — replace with a dynamic rating if
                testimonials are stored in a CMS. */}
            <div className="flex gap-0.5 mt-4">
              <span className="text-amber text-sm">★★★★★</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollReveal>
  );
}
