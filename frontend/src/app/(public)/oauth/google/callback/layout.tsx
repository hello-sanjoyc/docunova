import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata({
    title: "Google sign-in callback",
    description: "Complete Google sign-in for DocuNova AI.",
    path: "/oauth/google/callback",
});

export default function GoogleOAuthCallbackLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
