import type { Metadata } from "next";
import TeamPageClient from "@/components/authenticated/TeamPageClient";

export const metadata: Metadata = {
    title: "Team",
    description: "Manage team members and workspace access.",
};

export default function TeamPage() {
    return <TeamPageClient />;
}
