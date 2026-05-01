import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata({
    title: "Account Profile",
    description: "Manage DocuNova AI profile, security, and session settings.",
    path: "/myprofile",
});

export default function MyProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
