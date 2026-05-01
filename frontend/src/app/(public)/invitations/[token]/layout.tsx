import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata({
    title: "Team invitation",
    description: "Accept your invitation to join a DocuNova workspace.",
    path: "/invitations",
});

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
    return children;
}
