import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/pricing"],
                disallow: [
                    "/dashboard",
                    "/documents",
                    "/recent-activities",
                    "/team",
                    "/billing",
                    "/trash",
                    "/myprofile",
                    "/login",
                    "/signup",
                    "/forgot-password",
                    "/reset-password",
                    "/verify-email",
                    "/verification-pending",
                    "/oauth",
                    "/invitations",
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
