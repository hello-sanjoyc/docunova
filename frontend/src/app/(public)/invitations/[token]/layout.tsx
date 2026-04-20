import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Team invitation",
    description: "Accept your invitation to join a DocuNova workspace.",
    robots: {
        index:  false,
        follow: false,
    },
};

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
    return children;
}
