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
        <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-border py-3">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Logo mark: document icon with amber checkmark badge */}
                <div className="flex items-center gap-2">
                    <img
                        src="/logo.png"
                        alt="DocuNova AI logo"
                        className="h-12 w-auto"
                    />
                    <span className="font-medium text-ink text-[24px] tracking-tight">
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
                    <a
                        href="/login"
                        className="text-sm bg-ink text-cream px-4 py-2 rounded-full hover:bg-amber transition-colors font-medium"
                    >
                        Start free
                    </a>
                </div>
            </div>
        </nav>
    );
}
