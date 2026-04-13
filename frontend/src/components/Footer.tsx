/**
 * Footer
 *
 * Minimal dark footer with logo, legal links, and copyright.
 * Uses `text-cream/50` (50% opacity) for body copy on the dark background —
 * contrast is intentionally low to keep the footer recessive.
 *
 * TODO: Replace `href="#"` placeholders with real routes or hosted documents
 * (Privacy policy, Terms of service, Data deletion request form) before launch.
 */

export default function Footer() {
  return (
    <footer className="bg-ink text-cream/50 border-t border-white/10 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo: muted version of the Navbar logo (amber at 80% opacity) */}
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="text-amber/80"
          >
            <rect
              x="3"
              y="2"
              width="13"
              height="17"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M7 7h6M7 10h6M7 13h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx="18"
              cy="17"
              r="4"
              fill="transparent"
              stroke="#C8852A"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <path
              d="M16.5 17l1 1 2-2"
              stroke="#C8852A"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          </svg>
          <span className="text-[14px] font-medium text-cream/70">
            DocuNova AI
          </span>
        </div>

        {/* Legal links — TODO: point to real pages */}
        <div className="flex gap-6 text-[13px]">
          <a href="#" className="hover:text-cream/80 transition-colors">
            Privacy policy
          </a>
          <a href="#" className="hover:text-cream/80 transition-colors">
            Terms of service
          </a>
          <a href="#" className="hover:text-cream/80 transition-colors">
            Data deletion
          </a>
        </div>

        {/* "Not a law firm" disclaimer — required to accompany legal-adjacent tooling */}
        <p className="text-[12px]">© 2024 DocuNova AI. Not a law firm.</p>
      </div>
    </footer>
  );
}
