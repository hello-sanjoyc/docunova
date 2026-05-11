import type { Metadata } from "next";
import PaymentHistoryPageClient from "@/components/authenticated/PaymentHistoryPageClient";

export const metadata: Metadata = {
    title: "Payment History",
    description: "View all your payment transactions.",
};

export default function PaymentHistoryPage() {
    return <PaymentHistoryPageClient />;
}
