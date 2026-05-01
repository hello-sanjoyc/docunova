/**
 * Root layout — applies to every route in the app.
 *
 * Fonts:
 *   Montserrat — used for display typography mapped to the app's `font-serif`
 *     utility for backward compatibility with existing class names.
 *   DM Sans — clean geometric sans for UI copy; weights 300/400/500/600 cover
 *     light body text through medium labels.
 *
 * Both fonts inject their CSS custom properties via the `variable` option,
 * which makes them available as `--font-montserrat` and `--font-dm-sans`
 * in the @theme block in globals.css.
 *
 * `display: "swap"` prevents FOIT (flash of invisible text) — the browser
 * renders the fallback font until the custom font loads.
 *
 * The two variable class names are added to <html> so the CSS variables are
 * available on every descendant element.
 */

import type { Metadata } from "next";
import { DM_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import {
    DEFAULT_OG_IMAGE,
    DEFAULT_TITLE,
    DEFAULT_TWITTER_IMAGE,
    SITE_DESCRIPTION,
    SITE_KEYWORDS,
    SITE_NAME,
    SITE_URL,
} from "@/lib/seo";
import ToastProvider from "@/components/ToastProvider";
import QueryProvider from "@/components/QueryProvider";

const montserrat = Montserrat({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    variable: "--font-montserrat",
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
        default: `${SITE_NAME} | ${DEFAULT_TITLE}`,
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
        title: `${SITE_NAME} | ${DEFAULT_TITLE}`,
        description: SITE_DESCRIPTION,
        images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
        card: "summary_large_image",
        title: `${SITE_NAME} | ${DEFAULT_TITLE}`,
        description: SITE_DESCRIPTION,
        images: [DEFAULT_TWITTER_IMAGE],
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
            className={`${montserrat.variable} ${dmSans.variable}`}
        >
            <body>
                <QueryProvider>
                    {children}
                    <ToastProvider />
                </QueryProvider>
            </body>
        </html>
    );
}
