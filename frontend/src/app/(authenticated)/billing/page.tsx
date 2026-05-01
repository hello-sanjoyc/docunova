import type { Metadata } from "next";
import SubscriptionPageClient from "@/components/authenticated/SubscriptionPageClient";

export const metadata: Metadata = {
    title: "Subscription",
    description: "Manage DocuNova AI subscription and usage plan.",
};

export default function BillingPage() {
    return <SubscriptionPageClient />;
}
