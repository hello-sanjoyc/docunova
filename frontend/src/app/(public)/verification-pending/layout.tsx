import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata({
    title: "Verification pending",
    description: "Check your email to finish verifying your DocuNova AI account.",
    path: "/verification-pending",
});

export default function VerificationPendingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
