/**
 * FAQ
 *
 * Accordion built on native <details>/<summary> — no JS state required.
 * The browser handles open/close natively; CSS handles the chevron rotation
 * via the `group-open:rotate-180` Tailwind variant.
 *
 * The `last` flag on the final FAQS entry suppresses the bottom border to
 * avoid a double-border where the item meets the container's rounded corner.
 *
 * Content note: the "Is this a replacement for a lawyer?" answer is
 * deliberately prominent — it manages legal liability for the product.
 * Don't remove or soften it.
 */

import ScrollReveal from "./ScrollReveal";

const FAQS = [
  {
    question: "Is my document stored after processing?",
    answer:
      "Your document and brief are stored securely in Supabase associated with your account. You can delete any document from your dashboard at any time. We do not use your documents to train AI models.",
  },
  {
    question: "Does it work with scanned PDFs?",
    answer:
      "Not yet — DocuNova works with text-based PDFs and DOCX files. Image-only or scanned documents require OCR processing which we don't support currently. If you upload a scanned doc, we'll tell you clearly rather than returning a blank brief.",
  },
  {
    question: "How long can my contract be?",
    answer:
      "Up to 50 pages. For longer documents, we use a map-reduce approach — summarising each section and then the summaries — so quality stays high even on complex agreements.",
  },
  {
    question: "Is this a replacement for a lawyer?",
    answer:
      "No — and we say so clearly. DocuNova is the first read: it helps you understand what you're looking at and spot things worth asking a lawyer about. For high-stakes contracts, always get legal counsel to review before signing.",
    last: true,
  },
];

export default function FAQ() {
  return (
    <ScrollReveal className="py-20 px-6 max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-light tracking-tight">Common questions</h2>
      </div>

      {/* Single rounded container with internal dividers — each <details> is
          a row. overflow-hidden clips the child border-radius at the ends. */}
      <div className="space-y-0 border border-border rounded-2xl overflow-hidden">
        {FAQS.map(({ question, answer, last }) => (
          <details
            key={question}
            className={`group${!last ? " border-b border-border" : ""}`}
          >
            <summary className="flex justify-between items-center px-6 py-4 cursor-pointer text-[14px] font-medium text-ink list-none hover:bg-parchment transition-colors">
              {question}
              {/* Chevron rotates 180° when <details> is open via group-open: */}
              <svg
                className="w-4 h-4 text-muted group-open:rotate-180 transition-transform shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <p className="px-6 pb-4 text-[13px] text-muted leading-relaxed">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </ScrollReveal>
  );
}
