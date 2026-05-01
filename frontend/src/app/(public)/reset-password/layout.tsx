import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata({
    title: "Reset password",
    description: "Set a new password for your DocuNova AI account.",
    path: "/reset-password",
});

export default function ResetPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
