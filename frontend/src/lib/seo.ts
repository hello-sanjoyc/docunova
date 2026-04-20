export const SITE_NAME = "DocuNova AI";
export const SITE_URL =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://docunova.app";
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
