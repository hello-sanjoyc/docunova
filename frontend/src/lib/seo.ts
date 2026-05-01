import type { Metadata } from "next";

export const SITE_NAME = "DocuNova AI";
export const SITE_URL =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://docunova.app";
export const DEFAULT_TITLE = "Understand any contract in 60 seconds";
export const SITE_DESCRIPTION =
    "Upload a PDF or DOCX. Get a structured 1-page brief with key dates, obligations, red flags, and renewal clauses in plain English.";

export const SITE_KEYWORDS = [
    "contract analysis",
    "ai contract review",
    "legal document summary",
    "contract red flags",
    "document brief",
    "docunova ai",
];

export const DEFAULT_OG_IMAGE: {
    url: PublicPath;
    width: number;
    height: number;
    alt: string;
} = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: `${SITE_NAME} contract brief preview`,
};

export const DEFAULT_TWITTER_IMAGE = "/twitter-image";

export const INDEXABLE_ROUTES = [
    {
        path: "/",
        title: DEFAULT_TITLE,
        description: SITE_DESCRIPTION,
        changeFrequency: "weekly",
        priority: 1,
    },
    {
        path: "/pricing",
        title: "Pricing",
        description:
            "Compare DocuNova AI plans for AI contract summaries, red flag detection, document history, and team document workflows.",
        changeFrequency: "monthly",
        priority: 0.8,
    },
] as const;

type PublicPath = (typeof INDEXABLE_ROUTES)[number]["path"] | `/${string}`;

interface PageMetadataOptions {
    title: string;
    description: string;
    path: PublicPath;
    absoluteTitle?: boolean;
    index?: boolean;
    follow?: boolean;
}

export function absoluteUrl(path: PublicPath = "/") {
    if (/^https?:\/\//.test(path)) return path;
    return `${SITE_URL}${path === "/" ? "" : path}`;
}

export function withSiteName(title: string) {
    return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

export function createPageMetadata({
    title,
    description,
    path,
    absoluteTitle = false,
    index = true,
    follow = true,
}: PageMetadataOptions): Metadata {
    const socialTitle = withSiteName(title);

    return {
        title: absoluteTitle ? { absolute: socialTitle } : title,
        description,
        alternates: {
            canonical: path,
        },
        openGraph: {
            type: "website",
            locale: "en_US",
            url: path,
            siteName: SITE_NAME,
            title: socialTitle,
            description,
            images: [DEFAULT_OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title: socialTitle,
            description,
            images: [DEFAULT_TWITTER_IMAGE],
        },
        robots: {
            index,
            follow,
            googleBot: {
                index,
                follow,
                "max-image-preview": "large",
                "max-video-preview": -1,
                "max-snippet": -1,
            },
        },
    };
}

export function createNoIndexMetadata(
    options: Omit<PageMetadataOptions, "index" | "follow">,
): Metadata {
    return createPageMetadata({
        ...options,
        index: false,
        follow: false,
    });
}

export function createOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/logo.png"),
    };
}

export function createWebsiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "en-US",
    };
}

export function createSoftwareApplicationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        image: absoluteUrl(DEFAULT_OG_IMAGE.url),
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
        },
    };
}

export function createPricingSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${SITE_NAME} subscription plans`,
        description:
            "AI contract brief plans for individuals, teams, and document-heavy workflows.",
        brand: {
            "@type": "Brand",
            name: SITE_NAME,
        },
        url: absoluteUrl("/pricing"),
        image: absoluteUrl(DEFAULT_OG_IMAGE.url),
        offers: {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: "0",
            offerCount: "3",
            availability: "https://schema.org/InStock",
        },
    };
}
