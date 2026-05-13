/**
 * FAQ
 *
 * Controlled accordion where one answer is open at a time. The first item is
 * open by default so users immediately understand the interaction.
 *
 * Content note: the "Is this a replacement for a lawyer?" answer is
 * deliberately prominent — it manages legal liability for the product.
 * Don't remove or soften it.
 */

"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";

const FAQS = [
  {
    question: "What can I upload to DocuNova?",
    answer:
      "You can upload PDF, DOCX, JPG, JPEG, and PNG files. Text-based documents are processed directly, while scanned PDFs and images use OCR when your plan includes OCR. Legacy .doc files are not supported; save them as DOCX or PDF before uploading.",
  },
  {
    question: "What does the AI brief include?",
    answer:
      "Each ready document gets a plain-English brief with the key parties, effective dates, obligations, payment terms, indemnity, IP, confidentiality, red flags, recommended actions, and an overall summary where available.",
  },
  {
    question: "Can I ask questions about a document?",
    answer:
      "Yes. Once a document is processed, you can open document chat from the Documents page and ask follow-up questions in plain English. Answers are based on the extracted document text and recent chat context.",
  },
  {
    question: "Can I download or share summaries?",
    answer:
      "You can download the original file and export the AI summary as a PDF. Professional and Team plans can also create shareable summary links, with options to copy the link or share it by email or WhatsApp.",
  },
  {
    question: "How do document search, history, and trash work?",
    answer:
      "Your Documents page keeps uploaded files, statuses, metadata, downloads, summary PDFs, and chat access in one place. You can search documents, filter by status, move items to Trash, and restore deleted documents later.",
  },
  {
    question: "What does the dashboard show?",
    answer:
      "The dashboard summarizes page and OCR usage, team member count, uploaded documents, riskiest contracts, upcoming renewals, spend pulled from contract metadata, recent documents, activity, and upload trends.",
  },
  {
    question: "How do Team features work?",
    answer:
      "The Team plan unlocks a shared workspace with member invitations, admin/member roles, seat limits, a shared document vault, and recent activity tracking for uploads, searches, and deletions across the workspace.",
  },
  {
    question: "How are plans, usage, and payments managed?",
    answer:
      "The Subscription page shows your current plan, billing cycle, region, renewal period, limits, and available upgrades. Paid plans use Razorpay checkout, and Payment History lets you filter transactions by method and date.",
  },
  {
    question: "What account and security controls are available?",
    answer:
      "Your profile lets you update personal details, upload a profile photo, change your password, manage email digest and security alert preferences, enable two-factor authentication, review active sessions and access logs, revoke sessions, or delete your account.",
  },
  {
    question: "How long can my contract be?",
    answer:
      "The current upload limit is 50 pages. Plan limits can be lower or higher in the billing UI, but the portal enforces the active account and server limits before processing a file.",
  },
  {
    question: "Is my document stored after processing?",
    answer:
      "Your document, extracted text, summary metadata, chat history, and usage records are stored with your account and organization so the portal can provide history, downloads, search, chat, trash restore, and dashboard insights. You can delete documents from the dashboard.",
  },
  {
    question: "Is this a replacement for a lawyer?",
    answer:
      "No — and we say so clearly. DocuNova is the first read: it helps you understand what you're looking at and spot things worth asking a lawyer about. For high-stakes contracts, always get legal counsel to review before signing.",
    last: true,
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <ScrollReveal className="py-20 px-6 max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-light tracking-tight">Common questions</h2>
      </div>

      {/* Single rounded container with internal dividers. */}
      <div className="space-y-0 border border-border rounded-2xl overflow-hidden">
        {FAQS.map(({ question, answer }, index) => {
          const isOpen = openIndex === index;
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;

          return (
            <div
              key={question}
              className={`${index < FAQS.length - 1 ? "border-b border-border" : ""} ${
                isOpen ? "bg-parchment/70" : "bg-cream"
              }`}
            >
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-[14px] font-medium text-ink transition-colors hover:bg-parchment"
              >
                <span>{question}</span>
                <svg
                  className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-4 text-[13px] leading-relaxed text-muted">
                    {answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollReveal>
  );
}
