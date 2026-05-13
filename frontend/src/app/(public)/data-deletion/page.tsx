import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
    title: "Data Deletion Request",
    description:
        "Learn how to request permanent deletion of your DocuNova account, uploaded documents, AI chats, processed data, and associated account information.",
    path: "/data-deletion",
});

const deletionItems = [
    "Your account will be permanently removed.",
    "All uploaded documents and files will be deleted.",
    "AI chat history and document conversations will be deleted.",
    "OCR-processed content, vector embeddings, indexes, and associated metadata will be removed.",
    "Profile information and account-related records will be deleted from active systems.",
] as const;

export default function DataDeletionPage() {
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
                            Data Deletion Request
                        </h1>
                        <p className="mt-4 text-sm font-medium text-ink">
                            Effective Date: May 13, 2026
                        </p>
                        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted">
                            <p>
                                At DocuNova, users have full control over their
                                account and uploaded data.
                            </p>
                            <p>
                                The platform supports permanent account
                                deletion, including removal of uploaded
                                documents, AI chats, processed data, and
                                associated account information.
                            </p>
                        </div>
                    </header>

                    <div className="divide-y divide-border">
                        <section className="py-8">
                            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                                Permanent Account Deletion
                            </h2>
                            <p className="mt-4 text-[15px] leading-relaxed text-muted">
                                Users can permanently delete their DocuNova
                                account directly from the platform settings, if
                                enabled, or by submitting a deletion request
                                through email.
                            </p>
                            <p className="mt-4 text-[15px] leading-relaxed text-muted">
                                Once the deletion process is completed:
                            </p>
                            <ul className="mt-4 grid gap-2 text-[15px] leading-relaxed text-muted sm:grid-cols-2">
                                {deletionItems.map((item) => (
                                    <li key={item} className="flex gap-2">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="py-8">
                            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                                Important Warning
                            </h2>
                            <div className="mt-4 rounded-xl border border-[#ead8d3] bg-[#fff8f6] p-4">
                                <p className="text-[15px] leading-relaxed text-[#9f3f3f]">
                                    Account deletion is permanent and
                                    irreversible. After deletion, your account,
                                    uploaded documents, AI conversations, and
                                    stored processing data cannot be restored.
                                    No rollback, restore, or revert-back option
                                    will be available.
                                </p>
                            </div>
                            <p className="mt-4 text-[15px] leading-relaxed text-muted">
                                Please ensure you download or back up any
                                important documents before proceeding with
                                permanent deletion.
                            </p>
                        </section>

                        <section className="py-8">
                            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                                How to Request Deletion
                            </h2>
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-border bg-parchment p-4">
                                    <h3 className="text-base font-semibold text-ink">
                                        Option 1: Delete from Platform Settings
                                    </h3>
                                    <p className="mt-2 text-[14px] leading-relaxed text-muted">
                                        If available, you may permanently delete
                                        your account from your account settings
                                        or dashboard.
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border bg-parchment p-4">
                                    <h3 className="text-base font-semibold text-ink">
                                        Option 2: Email Request
                                    </h3>
                                    <p className="mt-2 text-[14px] leading-relaxed text-muted">
                                        Send your deletion request to{" "}
                                        <a
                                            href="mailto:support@docunova.app"
                                            className="text-amber-dark hover:text-amber"
                                        >
                                            support@docunova.app
                                        </a>
                                        .
                                    </p>
                                    <p className="mt-3 text-[14px] leading-relaxed text-muted">
                                        Use the subject line:
                                    </p>
                                    <p className="mt-2 rounded-lg border border-border bg-cream px-3 py-2 text-[14px] font-medium text-ink">
                                        Permanent Account Deletion Request
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 rounded-xl border border-border bg-parchment p-4">
                                <h3 className="text-base font-semibold text-ink">
                                    Please include:
                                </h3>
                                <ul className="mt-3 grid gap-2 text-[14px] leading-relaxed text-muted sm:grid-cols-2">
                                    <li className="flex gap-2">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                                        <span>Your registered email address.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                                        <span>
                                            Relevant account details, if
                                            applicable.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <section className="py-8">
                            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                                Verification Process
                            </h2>
                            <p className="mt-4 text-[15px] leading-relaxed text-muted">
                                For security reasons, we may verify account
                                ownership before processing deletion requests to
                                prevent unauthorized deletion attempts.
                            </p>
                        </section>

                        <section className="py-8">
                            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                                Processing Time
                            </h2>
                            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
                                <p>
                                    Verified deletion requests are generally
                                    processed within 7 business days.
                                </p>
                                <p>
                                    Some limited system backup data may
                                    temporarily persist for security, fraud
                                    prevention, or legal compliance purposes
                                    before automatic removal through scheduled
                                    cleanup cycles.
                                </p>
                            </div>
                        </section>

                        <section className="py-8">
                            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                                Third-Party Services
                            </h2>
                            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
                                <p>
                                    DocuNova may use third-party providers for
                                    cloud infrastructure, AI processing,
                                    analytics, authentication, and payment
                                    processing.
                                </p>
                                <p>
                                    While deletion requests are processed across
                                    our systems, certain temporary backup or
                                    infrastructure-level records maintained by
                                    third-party providers may require additional
                                    time for automatic removal.
                                </p>
                            </div>
                        </section>

                        <section className="py-8">
                            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                                Contact Us
                            </h2>
                            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
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
                                    This page is intended to explain how users
                                    can request permanent deletion of their
                                    DocuNova account and associated data.
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
