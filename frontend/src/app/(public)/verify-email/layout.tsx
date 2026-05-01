import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata({
    title: "Verify email",
    description: "Confirm the email address for your DocuNova AI account.",
    path: "/verify-email",
});

export default function VerifyEmailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
