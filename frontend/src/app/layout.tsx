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
  title: "DocuNova AI — Understand any contract in 60 seconds",
  description:
    "Upload a PDF or DOCX. Get a structured 1-page brief with key dates, obligations, red flags, and renewal clauses — in plain English.",
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
