import type { Metadata } from "next";
import DashboardPageClient from "@/components/authenticated/DashboardPageClient";

export const metadata: Metadata = {
    title: "Overview",
    description: "DocuNova archival dashboard.",
};

export default function DashboardPage() {
    return <DashboardPageClient />;
}
