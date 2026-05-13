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
 * Section links use root-relative anchors so they work from legal pages and
 * other public routes, not only from the landing page.
 */

import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-border py-2 md:py-3">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 sm:px-6 md:h-14 md:flex-row md:justify-between md:gap-0">
                {/* Logo mark: document icon with amber checkmark badge */}
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2"
                    aria-label="DocuNova AI home"
                >
                    <Image
                        src="/logo.png"
                        alt="DocuNova AI logo"
                        width={48}
                        height={48}
                        priority
                        className="h-10 w-auto md:h-12"
                    />
                    <span className="text-[22px] font-medium tracking-tight text-ink md:text-[24px]">
                        DocuNova{" "}
                        <span className="text-amber font-semibold">AI</span>
                    </span>
                </Link>

                {/* Section anchor links */}
                <div className="flex items-center justify-center gap-5 md:gap-8">
                    <Link
                        href="/#features"
                        className="nav-link text-xs text-muted transition-colors hover:text-ink md:text-sm"
                    >
                        Features
                    </Link>
                    <Link
                        href="/#how-it-works"
                        className="nav-link text-xs text-muted transition-colors hover:text-ink md:text-sm"
                    >
                        How it works
                    </Link>
                    <Link
                        href="/#pricing"
                        className="nav-link text-xs text-muted transition-colors hover:text-ink md:text-sm"
                    >
                        Pricing
                    </Link>
                </div>

                {/* Auth actions */}
                <div className="flex items-center justify-center gap-2 md:gap-3">
                    <a
                        href="/signup"
                        className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-amber md:px-4 md:py-2 md:text-sm"
                    >
                        Start free
                    </a>
                    <a
                        href="/login"
                        className="rounded-full border border-amber bg-transparent px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-amber md:px-4 md:py-2 md:text-sm"
                    >
                        Sign-in
                    </a>
                </div>
            </div>
        </nav>
    );
}
