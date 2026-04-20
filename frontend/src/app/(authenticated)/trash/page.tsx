import type { Metadata } from "next";
import TrashPageClient from "@/components/authenticated/TrashPageClient";

export const metadata: Metadata = {
    title: "Trash",
    description: "Deleted documents that can be restored.",
};

export default function TrashPage() {
    return <TrashPageClient />;
}
