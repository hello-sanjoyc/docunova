import type { Metadata } from "next";
import DocumentsPageClient from "@/components/authenticated/DocumentsPageClient";

export const metadata: Metadata = {
    title: "Documents",
    description: "All files and archive records.",
};

export default function DocumentsPage() {
    return <DocumentsPageClient />;
}
