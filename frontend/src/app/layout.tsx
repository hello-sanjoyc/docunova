/**
 * Root layout — applies to every route in the app.
 *
 * Fonts:
 *   Instrument Serif — editorial serif used for headlines and italic accents.
 *     Loaded in both normal and italic styles so `font-serif-italic` works
 *     without a synthetic oblique.
 *   DM Sans — clean geometric sans for UI copy; weights 300/400/500/600 cover
 *     light body text through medium labels.
 *
 * Both fonts inject their CSS custom properties via the `variable` option,
 * which makes them available as `--font-instrument-serif` and `--font-dm-sans`
 * in the @theme block in globals.css.
 *
 * `display: "swap"` prevents FOIT (flash of invisible text) — the browser
 * renders the fallback font until the custom font loads.
 *
 * The two variable class names are added to <html> so the CSS variables are
 * available on every descendant element.
 */

import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import "./globals.css";
import {
    SITE_DESCRIPTION,
    SITE_KEYWORDS,
    SITE_NAME,
    SITE_URL,
} from "@/lib/seo";

const instrumentSerif = Instrument_Serif({
    weight: ["400"],
    style: ["normal", "italic"],
    subsets: ["latin"],
    variable: "--font-instrument-serif",
    display: "swap",
});

const dmSans = DM_Sans({
    weight: ["300", "400", "500", "600"],
    subsets: ["latin"],
    variable: "--font-dm-sans",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: `${SITE_NAME} | Understand any contract in 60 seconds`,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: SITE_KEYWORDS,
    alternates: {
        canonical: "/",
    },
    icons: {
        icon: [{ url: "/icon.png", type: "image/png" }],
        shortcut: ["/icon.png"],
        apple: ["/icon.png"],
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "/",
        siteName: SITE_NAME,
        title: `${SITE_NAME} | Understand any contract in 60 seconds`,
        description: SITE_DESCRIPTION,
        images: [
            {
                url: "/opengraph-image",
                width: 1200,
                height: 630,
                alt: `${SITE_NAME} social preview`,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: `${SITE_NAME} | Understand any contract in 60 seconds`,
        description: SITE_DESCRIPTION,
        images: ["/twitter-image"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-video-preview": -1,
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            // Font CSS variables must be on <html> so they cascade into <body>
            // and any portals/modals that mount outside the component tree.
            className={`${instrumentSerif.variable} ${dmSans.variable}`}
        >
            <body>{children}</body>
        </html>
    );
}
