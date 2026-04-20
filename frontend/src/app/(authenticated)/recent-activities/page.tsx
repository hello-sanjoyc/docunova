import type { Metadata } from "next";
import RecentActivitiesPageClient from "@/components/authenticated/RecentActivitiesPageClient";

export const metadata: Metadata = {
    title: "Recent Activities",
    description: "Recent activities and document updates.",
};

export default function RecentActivitiesPage() {
    return <RecentActivitiesPageClient />;
}
