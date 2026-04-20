/**
 * StatsBar
 *
 * Horizontal social-proof band with three key metrics.
 * Sits between Hero and HowItWorks to add credibility immediately after
 * the upload prompt.
 *
 * STATS are hardcoded placeholder values — replace with real figures from
 * your analytics / Supabase aggregate queries before launch.
 */

import ScrollReveal from "./ScrollReveal";

const STATS = [
  { value: "12,000", suffix: "+", label: "contracts processed" },
  { value: "94",     suffix: "%", label: "catch at least one red flag" },
  { value: "58",     suffix: "s", label: "average review time" },
];

export default function StatsBar() {
  return (
    <ScrollReveal className="border-y border-border bg-parchment py-10 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
        {STATS.map(({ value, suffix, label }) => (
          <div key={label}>
            {/* Serif number + amber-colored suffix for visual punch */}
            <p className="font-serif text-4xl text-ink mb-1">
              {value}
              <span className="text-amber">{suffix}</span>
            </p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>
    </ScrollReveal>
  );
}
