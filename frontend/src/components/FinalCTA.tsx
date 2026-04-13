/**
 * FinalCTA
 *
 * Inverted (dark bg-ink) closing call-to-action section at the bottom of the
 * landing page. The dark background provides visual weight and a clear page
 * ending before the footer.
 *
 * The CTA button anchors back to #upload in the Hero — users don't leave the
 * page; they scroll back up to the upload zone to convert.
 */

import ScrollReveal from "./ScrollReveal";

export default function FinalCTA() {
  return (
    <ScrollReveal className="py-24 px-6 bg-ink text-cream">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.15em] text-amber mb-4">
          Get started free
        </p>
        <h2 className="text-5xl font-light tracking-tight mb-6 leading-[1.1]">
          <span className="font-serif">Stop signing things</span>
          <br />
          <span className="font-serif-italic text-amber">
            you don&apos;t fully understand.
          </span>
        </h2>
        {/* cream/60 = 60% opacity on the inverted background for the sub-copy */}
        <p className="text-[16px] text-cream/60 leading-relaxed mb-10 max-w-md mx-auto">
          Upload your first contract free. No credit card. No legal jargon.
          Just clarity.
        </p>
        <a
          href="#upload"
          className="inline-block bg-amber text-cream text-[15px] font-medium px-8 py-3.5 rounded-full hover:bg-amber-dark transition-colors"
        >
          Upload a contract →
        </a>
        {/* Fine print: reinforces the free trial without a separate pricing callout */}
        <p className="text-[12px] text-cream/30 mt-4">
          Free for 3 documents. No signup required to try.
        </p>
      </div>
    </ScrollReveal>
  );
}
