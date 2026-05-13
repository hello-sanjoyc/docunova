import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
    title: "Terms of Service",
    description:
        "Read the DocuNova AI Terms of Service governing access to and use of our website, applications, APIs, AI-powered document tools, and related services.",
    path: "/terms-of-service",
});

const sections = [
    {
        title: "1. Eligibility",
        paragraphs: ["You must be at least 13 years old to use DocuNova."],
        intro: "By using the Services, you represent and warrant that:",
        items: [
            "You have the legal capacity to enter into these Terms",
            "You will comply with all applicable laws and regulations",
            "You will not use the Services for illegal or unauthorized purposes",
        ],
    },
    {
        title: "2. Description of Services",
        paragraphs: [
            "DocuNova provides AI-powered document processing and interaction tools, including but not limited to:",
        ],
        items: [
            "AI document chat",
            "PDF analysis",
            "OCR for scanned documents",
            "Summarization",
            "Search and semantic retrieval",
            "AI-generated responses",
            "File organization and document insights",
        ],
        closing:
            "Features may change, evolve, or be discontinued without prior notice.",
    },
    {
        title: "3. User Accounts",
        paragraphs: [
            "To access certain features, you may be required to create an account.",
        ],
        intro: "You are responsible for:",
        items: [
            "Maintaining account confidentiality",
            "Protecting login credentials",
            "All activities under your account",
            "Providing accurate information",
        ],
        closing:
            "You must immediately notify us of unauthorized account access. We reserve the right to suspend or terminate accounts suspected of abuse, fraud, or security violations.",
    },
    {
        title: "4. User Content & Uploaded Files",
        paragraphs: [
            "You retain ownership of documents and content you upload (\"User Content\").",
        ],
        groups: [
            {
                title: "Limited License",
                body: "By uploading content, you grant DocuNova a limited, non-exclusive license to store, process, analyze, transmit, and generate AI outputs from your content solely for providing and improving the Services.",
            },
            {
                title: "Your Representations",
                body: "You represent and warrant that you own or have rights to upload the content, the content does not violate laws or third-party rights, and the content does not contain malicious software.",
            },
        ],
    },
    {
        title: "5. AI-Generated Content Disclaimer",
        paragraphs: [
            "DocuNova uses artificial intelligence and machine learning systems to generate responses and analyze documents.",
        ],
        intro: "AI-generated outputs:",
        items: [
            "May contain inaccuracies",
            "May be incomplete",
            "May produce misleading or incorrect information",
            "Should not be considered professional advice",
        ],
        closing:
            "You are solely responsible for verifying AI-generated outputs before relying on them. DocuNova does not guarantee the accuracy, reliability, legality, or suitability of AI-generated content.",
    },
    {
        title: "6. Prohibited Uses",
        intro: "You agree not to:",
        items: [
            "Upload unlawful or harmful content",
            "Upload malware, viruses, or malicious code",
            "Reverse engineer the platform",
            "Attempt unauthorized access",
            "Abuse APIs or infrastructure",
            "Use automated scraping tools without permission",
            "Use the platform for spam or phishing",
            "Upload copyrighted material without authorization",
            "Use the Services to generate illegal, abusive, or harmful content",
        ],
        closing:
            "Violation of these rules may result in suspension, termination, and possible legal action.",
    },
    {
        title: "7. Intellectual Property",
        paragraphs: [
            "All platform-related intellectual property is owned by DocuNova or its licensors and protected by applicable intellectual property laws.",
        ],
        intro: "This includes:",
        items: [
            "Software",
            "Branding",
            "Logos",
            "UI/UX",
            "Code",
            "AI workflows",
            "Documentation",
        ],
        closing:
            "You may not reproduce, copy, distribute, or commercially exploit any part of the Services without written permission.",
    },
    {
        title: "8. Subscription & Payments",
        paragraphs: ["Certain features may require paid subscriptions."],
        intro: "By purchasing a subscription, you agree that:",
        items: [
            "Fees may be charged in advance",
            "Pricing may change in the future",
            "Failure to pay may result in service suspension",
            "Taxes may apply depending on jurisdiction",
        ],
        closing:
            "Unless otherwise stated, payments are non-refundable. Third-party payment processors may handle transactions securely.",
    },
    {
        title: "9. Service Availability",
        paragraphs: ["We do not guarantee uninterrupted or error-free operation."],
        intro: "The Services may experience:",
        items: [
            "Downtime",
            "Maintenance interruptions",
            "AI processing delays",
            "Data loss risks",
            "Third-party service failures",
        ],
        closing:
            "We may modify, suspend, or discontinue features at any time without liability.",
    },
    {
        title: "10. Data & Security",
        paragraphs: [
            "We implement reasonable security measures but cannot guarantee absolute security.",
        ],
        intro: "You acknowledge that:",
        items: [
            "Internet transmissions are never fully secure",
            "AI/cloud systems carry operational risks",
            "Unauthorized access may occur despite safeguards",
        ],
        closing:
            "You are responsible for avoiding uploads of highly sensitive information unless necessary.",
    },
    {
        title: "11. Third-Party Services",
        paragraphs: [
            "DocuNova may integrate with third-party providers including:",
        ],
        items: [
            "AI model providers",
            "Cloud hosting providers",
            "Authentication systems",
            "Payment gateways",
            "Analytics services",
        ],
        closing:
            "We are not responsible for third-party services, content, availability, or policies.",
    },
    {
        title: "12. Termination",
        intro: "We may suspend or terminate access immediately if:",
        items: [
            "These Terms are violated",
            "Fraudulent or abusive activity is detected",
            "Required by law",
            "Security threats arise",
        ],
        closing:
            "You may stop using the Services at any time. Termination does not eliminate obligations incurred before termination.",
    },
    {
        title: "13. Limitation of Liability",
        paragraphs: [
            "To the maximum extent permitted by law, DocuNova and its affiliates shall not be liable for:",
        ],
        items: [
            "Indirect damages",
            "Loss of profits",
            "Data loss",
            "Business interruption",
            "AI inaccuracies",
            "Reliance on generated outputs",
            "Unauthorized access",
            "Security incidents",
            "Third-party failures",
        ],
        closing:
            "Your use of the Services is entirely at your own risk. If liability cannot legally be excluded, our total liability shall not exceed the amount paid by you to DocuNova during the previous 3 months.",
    },
    {
        title: "14. Indemnification",
        paragraphs: [
            "You agree to indemnify and hold harmless DocuNova, its owners, employees, affiliates, and partners from claims, liabilities, damages, losses, or expenses arising from:",
        ],
        items: [
            "Your use of the Services",
            "Uploaded content",
            "Violation of these Terms",
            "Violation of laws or third-party rights",
        ],
    },
    {
        title: "15. Privacy",
        paragraphs: [
            "Your use of the Services is also governed by our Privacy Policy.",
            "Please review the Privacy Policy carefully before using the platform.",
        ],
        link: {
            href: "/privacy-policy",
            label: "Read the Privacy Policy",
        },
    },
    {
        title: "16. Governing Law",
        paragraphs: [
            "These Terms shall be governed by and interpreted under the laws of India, without regard to conflict-of-law principles.",
            "Any disputes shall be subject to the exclusive jurisdiction of the courts located in Kolkata, West Bengal, India.",
        ],
    },
    {
        title: "17. Changes to Terms",
        paragraphs: [
            "We may modify these Terms at any time.",
            "Updated Terms will be posted on this page with a revised effective date.",
            "Continued use of the Services after updates constitutes acceptance of the revised Terms.",
        ],
    },
] as const;

export default function TermsOfServicePage() {
    return (
        <>
            <Navbar />
            <main className="bg-parchment px-6 pb-20 pt-32">
                <article className="mx-auto max-w-4xl rounded-2xl border border-border bg-cream p-6 shadow-sm md:p-10">
                    <header className="border-b border-border pb-8">
                        <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">
                            Legal
                        </p>
                        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink md:text-5xl">
                            Terms of Service for DocuNova
                        </h1>
                        <p className="mt-4 text-sm font-medium text-ink">
                            Effective Date: May 13, 2026
                        </p>
                        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted">
                            <p>
                                Welcome to DocuNova (&quot;DocuNova&quot;,
                                &quot;we&quot;, &quot;our&quot;, or
                                &quot;us&quot;).
                            </p>
                            <p>
                                These Terms of Service (&quot;Terms&quot;)
                                govern your access to and use of the DocuNova
                                website, applications, APIs, AI-powered document
                                tools, and related services (collectively, the
                                &quot;Services&quot;).
                            </p>
                            <p>
                                By accessing or using DocuNova, you agree to be
                                legally bound by these Terms. If you do not
                                agree, do not use the Services.
                            </p>
                        </div>
                    </header>

                    <div className="divide-y divide-border">
                        {sections.map((section) => (
                            <TermsSection key={section.title} section={section} />
                        ))}

                        <section className="py-8">
                            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                                18. Contact Information
                            </h2>
                            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
                                <p>
                                    For questions regarding these Terms,
                                    contact:
                                </p>
                                <div className="rounded-xl border border-border bg-parchment p-4">
                                    <p className="font-medium text-ink">
                                        DocuNova
                                    </p>
                                    <p>
                                        Website:{" "}
                                        <a
                                            href="https://docunova.app"
                                            className="text-amber-dark hover:text-amber"
                                        >
                                            https://docunova.app
                                        </a>
                                    </p>
                                    <p>
                                        Email:{" "}
                                        <a
                                            href="mailto:support@docunova.app"
                                            className="text-amber-dark hover:text-amber"
                                        >
                                            support@docunova.app
                                        </a>
                                    </p>
                                </div>
                                <p>
                                    These Terms constitute the complete
                                    agreement between you and DocuNova regarding
                                    the Services and supersede prior agreements
                                    or understandings related to the platform.
                                </p>
                            </div>
                        </section>
                    </div>
                </article>
            </main>
            <Footer />
        </>
    );
}

function TermsSection({
    section,
}: {
    section: (typeof sections)[number];
}) {
    return (
        <section className="py-8">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                {section.title}
            </h2>

            {"paragraphs" in section && section.paragraphs && (
                <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
                    {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>
            )}

            {"intro" in section && section.intro && (
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                    {section.intro}
                </p>
            )}

            {"items" in section && section.items && (
                <ul className="mt-4 grid gap-2 text-[15px] leading-relaxed text-muted sm:grid-cols-2">
                    {section.items.map((item) => (
                        <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            )}

            {"groups" in section && section.groups && (
                <div className="mt-6 space-y-4">
                    {section.groups.map((group) => (
                        <div
                            key={group.title}
                            className="rounded-xl border border-border bg-parchment p-4"
                        >
                            <h3 className="text-base font-semibold text-ink">
                                {group.title}
                            </h3>
                            <p className="mt-2 text-[14px] leading-relaxed text-muted">
                                {group.body}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {"link" in section && section.link && (
                <a
                    href={section.link.href}
                    className="mt-4 inline-flex text-sm font-medium text-amber-dark hover:text-amber"
                >
                    {section.link.label}
                </a>
            )}

            {"closing" in section && section.closing && (
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                    {section.closing}
                </p>
            )}
        </section>
    );
}
