/**
 * Navbar
 *
 * Fixed top bar with frosted-glass background (bg-cream/90 + backdrop-blur).
 * The blur creates visual separation from scrolled content without a harsh
 * hard edge.
 *
 * Nav links use the `.nav-link` CSS class which adds an animated amber
 * underline on hover via a ::after pseudo-element (see globals.css).
 *
 * CTA ("Start free") anchors to #upload on the Hero — single-page flow,
 * no separate sign-up page yet.
 *
 * TODO: Replace `href="#"` on "Log in" with the real auth route once the
 * login page exists (e.g. /login).
 */

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo mark: document icon with amber checkmark badge */}
        <div className="flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-amber"
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
              fill="#F5E6CC"
              stroke="#C8852A"
              strokeWidth="1.5"
            />
            <path
              d="M16.5 17l1 1 2-2"
              stroke="#C8852A"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-medium text-ink text-[15px] tracking-tight">
            DocuNova{" "}
            <span className="text-amber font-semibold">AI</span>
          </span>
        </div>

        {/* Section anchor links — hidden on mobile to avoid clutter */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="nav-link text-sm text-muted hover:text-ink transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="nav-link text-sm text-muted hover:text-ink transition-colors"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="nav-link text-sm text-muted hover:text-ink transition-colors"
          >
            Pricing
          </a>
        </div>

        {/* Auth actions */}
        <div className="flex items-center gap-3">
          {/* Log in: hidden on mobile — space is reserved for the CTA pill */}
          <a
            href="/login"
            className="text-sm text-muted hover:text-ink transition-colors hidden md:block"
          >
            Log in
          </a>
          <a
            href="#upload"
            className="text-sm bg-ink text-cream px-4 py-2 rounded-full hover:bg-amber transition-colors font-medium"
          >
            Start free
          </a>
        </div>
      </div>
    </nav>
  );
}
