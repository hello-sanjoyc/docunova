import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
    title: "Privacy Policy",
    description:
        "Read the DocuNova AI Privacy Policy, including how we collect, process, store, and protect information across our document and AI services.",
    path: "/privacy-policy",
});

const sections = [
    {
        title: "1. Information We Collect",
        intro: "We may collect the following categories of information:",
        groups: [
            {
                title: "A. Account Information",
                body: "When you create an account, we may collect:",
                items: [
                    "Full name",
                    "Email address",
                    "Password, encrypted or hashed",
                    "Profile information",
                    "Authentication provider details, such as Google Login",
                ],
            },
            {
                title: "B. Uploaded Documents & Content",
                body: "When you use DocuNova, you may upload PDF files, Word documents, images, scanned documents, text files, and other supported document formats. We may process these files to provide AI-powered features such as:",
                items: [
                    "Document chat",
                    "Summarization",
                    "OCR (Optical Character Recognition)",
                    "Search",
                    "Information extraction",
                    "AI-generated responses",
                    "Contextual question answering",
                ],
            },
            {
                title: "C. AI Interaction Data",
                body: "We may collect AI interaction data to support service quality, debugging, performance, and user experience. AI systems commonly retain conversational context temporarily for response generation and system improvement. This data may include:",
                items: [
                    "Questions asked to the AI",
                    "Chat history",
                    "Prompt inputs",
                    "AI-generated outputs",
                    "Usage analytics related to AI features",
                ],
            },
            {
                title: "D. Technical & Device Information",
                body: "We may automatically collect:",
                items: [
                    "IP address",
                    "Browser type",
                    "Device type",
                    "Operating system",
                    "Referring URLs",
                    "Session data",
                    "Cookies and analytics identifiers",
                    "Error logs and crash reports",
                ],
            },
            {
                title: "E. Payment & Billing Information",
                body: "If paid plans are offered, payment processing may be handled by third-party providers. We do not store complete card details on our servers. Third-party payment processors may collect:",
                items: [
                    "Billing address",
                    "Payment method",
                    "Transaction metadata",
                ],
            },
        ],
    },
    {
        title: "2. How We Use Your Information",
        intro: "We use collected information to:",
        items: [
            "Provide document processing services",
            "Enable AI-powered document chat",
            "Generate summaries and insights",
            "Improve AI response quality",
            "Authenticate users",
            "Manage subscriptions and billing",
            "Provide customer support",
            "Prevent fraud, abuse, or unauthorized access",
            "Monitor system performance and security",
            "Comply with legal obligations",
        ],
    },
    {
        title: "3. AI Processing & Document Analysis",
        paragraphs: [
            "DocuNova uses artificial intelligence technologies to analyze uploaded content and generate responses.",
            "AI-generated responses may occasionally contain inaccuracies, incomplete information, or misleading outputs. Users should independently verify important information before relying on it.",
            "DocuNova is not responsible for decisions made solely based on AI-generated responses.",
        ],
        intro: "This may include:",
        items: [
            "Text extraction",
            "OCR from scanned documents",
            "Semantic indexing",
            "Vector embeddings",
            "Retrieval-Augmented Generation (RAG)",
            "Large Language Model (LLM) processing",
        ],
    },
    {
        title: "4. Data Storage & Security",
        paragraphs: [
            "We implement commercially reasonable security measures including HTTPS encryption, access controls, authentication protections, database security, secure cloud infrastructure, and encrypted data transmission.",
            "However, no internet-based system is 100% secure. You use the platform at your own risk.",
        ],
    },
    {
        title: "5. Data Sharing & Third Parties",
        paragraphs: [
            "We do not sell your personal data.",
            "Third-party AI providers may temporarily process uploaded content to generate responses depending on system architecture and selected AI models.",
        ],
        intro: "We may share information with:",
        items: [
            "Cloud hosting providers",
            "AI model providers",
            "Authentication providers",
            "Payment processors",
            "Analytics providers",
            "Legal authorities when required by law",
        ],
    },
    {
        title: "6. Cookies & Analytics",
        paragraphs: [
            "We may use cookies and similar technologies for authentication, session management, analytics, security, and performance optimization.",
            "You can disable cookies in your browser settings, though some features may not function properly.",
        ],
    },
    {
        title: "7. Data Retention",
        paragraphs: [
            "We retain information only as long as necessary for providing services, legal compliance, security and fraud prevention, and business operations.",
            "You may request deletion of your account and associated data, subject to legal or operational retention requirements.",
        ],
    },
    {
        title: "8. User Rights",
        intro:
            "Depending on your jurisdiction, you may have rights to the following. To exercise these rights, contact us using the details below.",
        items: [
            "Access your data",
            "Correct inaccurate information",
            "Request deletion",
            "Request export of your data",
            "Object to certain processing activities",
            "Withdraw consent",
        ],
    },
    {
        title: "9. Children's Privacy",
        paragraphs: [
            "DocuNova is not intended for children under 13 years of age. We do not knowingly collect personal information from children.",
            "If we become aware that a child has provided personal data, we will delete it promptly.",
        ],
    },
    {
        title: "10. International Data Transfers",
        paragraphs: [
            "Your information may be processed and stored in countries outside your own jurisdiction where privacy laws may differ.",
            "By using the service, you consent to such transfers.",
        ],
    },
    {
        title: "11. Third-Party Services",
        paragraphs: [
            "DocuNova may contain links or integrations with third-party services. We are not responsible for the privacy practices of external websites or platforms.",
            "Users should review their respective privacy policies separately.",
        ],
    },
    {
        title: "12. Limitation Regarding Sensitive Data",
        intro:
            "Users should avoid uploading highly sensitive information unless absolutely necessary, including:",
        items: [
            "Government-issued IDs",
            "Financial credentials",
            "Medical records",
            "Confidential legal materials",
            "Trade secrets",
            "Passwords or authentication credentials",
        ],
        paragraphs: [
            "If such information is uploaded, users do so at their own risk.",
        ],
    },
    {
        title: "13. Changes to This Privacy Policy",
        paragraphs: [
            "We may update this Privacy Policy periodically.",
            "Updated versions will be posted on this page with a revised Effective Date.",
            "Continued use of the platform after updates constitutes acceptance of the revised policy.",
        ],
    },
    {
        title: "15. GDPR / Data Protection Notice (If Applicable)",
        intro:
            "If you are located in the European Economic Area (EEA), United Kingdom, or similar jurisdictions, we process personal data under lawful bases such as:",
        items: [
            "Consent",
            "Contractual necessity",
            "Legitimate interests",
            "Legal obligations",
        ],
        paragraphs: [
            "You may contact your local data protection authority if you believe your rights have been violated.",
        ],
    },
    {
        title: "16. AI & Automated Decision Disclaimer",
        paragraphs: [
            "DocuNova uses automated AI systems to generate outputs and responses. These systems do not constitute legal, financial, medical, or professional advice.",
            "Users remain fully responsible for verifying outputs before relying on them.",
            "AI-based document analysis systems can produce hallucinations, incomplete summaries, or incorrect interpretations.",
        ],
    },
] as const;

export default function PrivacyPolicyPage() {
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
                            Privacy Policy for DocuNova
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
                                This Privacy Policy explains how we collect,
                                use, store, process, and protect your
                                information when you use our website,
                                applications, APIs, AI-powered document tools,
                                and related services.
                            </p>
                            <p>
                                By using DocuNova, you agree to the practices
                                described in this Privacy Policy.
                            </p>
                        </div>
                    </header>

                    <div className="divide-y divide-border">
                        {sections.slice(0, 13).map((section) => (
                            <PolicySection
                                key={section.title}
                                section={section}
                            />
                        ))}

                        <section className="py-8">
                            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                                14. Contact Information
                            </h2>
                            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
                                <p>
                                    If you have questions regarding this Privacy
                                    Policy, contact:
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
                            </div>
                        </section>

                        {sections.slice(13).map((section) => (
                            <PolicySection
                                key={section.title}
                                section={section}
                            />
                        ))}
                    </div>
                </article>
            </main>
            <Footer />
        </>
    );
}

function PolicySection({
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
                <div className="mt-6 space-y-6">
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
                            <ul className="mt-3 grid gap-2 text-[14px] leading-relaxed text-muted sm:grid-cols-2">
                                {group.items.map((item) => (
                                    <li key={item} className="flex gap-2">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
