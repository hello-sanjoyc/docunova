import type { Metadata } from "next";
import DocumentsNewPageClient from "@/components/authenticated/DocumentsNewPageClient";

export const metadata: Metadata = {
    title: "New Document",
    description: "Upload and process a new document.",
};

export default function DocumentsNewPage() {
    return <DocumentsNewPageClient />;
}
