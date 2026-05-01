import type { MetadataRoute } from "next";
import { INDEXABLE_ROUTES, absoluteUrl } from "@/lib/seo";

const LAST_MODIFIED = new Date("2026-04-30");

export default function sitemap(): MetadataRoute.Sitemap {
    return INDEXABLE_ROUTES.map((route) => ({
        url: absoluteUrl(route.path),
        lastModified: LAST_MODIFIED,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));
}
