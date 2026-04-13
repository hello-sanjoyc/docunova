/**
 * BriefCardPreview
 *
 * Static mock that demonstrates the AI brief output format in the Hero section.
 * All data is hardcoded — this is a marketing preview, not a live component.
 *
 * When the upload API is ready, this component should be replaced (or made
 * dynamic) to render the actual API response. The field schema it previews
 * maps to the 8 key extraction fields Claude produces:
 *   parties, effectiveDate, obligations, payment, penalties,
 *   renewalTerms, redFlags, recommendedActions
 *
 * BriefRow is a private sub-component (not exported) — it only exists to
 * avoid repeating the label/value layout across rows.
 */

export default function BriefCardPreview() {
  return (
    <div className="bg-cream border border-border rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(15,14,12,0.08)]">
      {/* Header: filename, page count, processing time, status badge */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-parchment">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-light rounded-lg flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C8852A"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-ink">
              vendor-agreement-2024.pdf
            </p>
            <p className="text-[11px] text-muted">
              12 pages · Processed in 47s
            </p>
          </div>
        </div>
        <span className="text-[11px] bg-sage-light text-sage-dark px-2.5 py-1 rounded-full font-medium">
          Ready
        </span>
      </div>

      {/* Brief field rows — one per extracted field */}
      <div className="divide-y divide-border">
        <BriefRow label="Parties">
          Acme Corp (Buyer) · Vertex Solutions Inc. (Vendor)
        </BriefRow>
        <BriefRow label="Effective date">
          Jan 1, 2024 – Dec 31, 2025 (24 months)
        </BriefRow>
        <BriefRow label="Obligations">
          Vendor delivers monthly reports by 5th. Buyer pays within 30 days of
          invoice.
        </BriefRow>
        <BriefRow label="Payment">
          $4,200/mo · 1.5% late fee after 30 days
        </BriefRow>

        {/* Red flag row — distinct background + left border accent via globals.css .red-flag-row */}
        <div className="red-flag-row px-5 py-3 flex gap-4">
          <span className="text-[11px] font-medium text-danger w-28 shrink-0 pt-0.5 uppercase tracking-wide flex items-center gap-1">
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="#B03A2E"
            >
              <path d="M8 1l7 13H1L8 1zm0 4v4m0 2v1" />
            </svg>
            Red flags
          </span>
          <span className="text-[13px] text-ink">
            Auto-renews silently unless cancelled 60 days before expiry.
            Liability cap is 1× fees only — no consequential damages.
          </span>
        </div>

        {/* Action row — recommended next steps surfaced by the AI */}
        <div className="action-row px-5 py-3 flex gap-4">
          <span className="text-[11px] font-medium text-sage w-28 shrink-0 pt-0.5 uppercase tracking-wide flex items-center gap-1">
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#3A6B4E"
              strokeWidth="2"
            >
              <polyline points="2,8 6,12 14,4" />
            </svg>
            Actions
          </span>
          <span className="text-[13px] text-ink">
            Set reminder for Nov 1, 2025 to review renewal. Get indemnification
            clause reviewed.
          </span>
        </div>
      </div>

      {/* Footer: export + share actions */}
      <div className="px-5 py-3 border-t border-border flex items-center gap-3 bg-parchment">
        <button className="flex items-center gap-1.5 text-[12px] font-medium text-ink bg-white border border-border px-3 py-1.5 rounded-lg hover:border-amber hover:text-amber transition-colors cursor-pointer">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Download PDF
        </button>
        <button className="flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-amber transition-colors cursor-pointer">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share link
        </button>
      </div>
    </div>
  );
}

/** Renders a single label + value row inside the brief card. */
function BriefRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3 flex gap-4">
      {/* Fixed-width label column keeps values left-aligned across all rows */}
      <span className="text-[11px] font-medium text-muted w-28 shrink-0 pt-0.5 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-[13px] text-ink">{children}</span>
    </div>
  );
}
