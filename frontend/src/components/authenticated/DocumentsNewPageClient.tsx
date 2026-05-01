"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
} from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
    AlertTriangle,
    Check,
    Copy,
    Download,
    File,
    FileText,
    Mail,
    Share2,
    X,
    Upload,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/client";
import {
    listDocuments,
    triggerDocumentSummary,
    uploadDocument,
    type DocumentItem,
} from "@/lib/api/documents";
import { formatApiError } from "@/lib/api/errors";
import {
    handleDownload as handleDownloadDocument,
    handleDownloadSummaryPdf as handleDownloadSummaryDocumentPdf,
    metadataText,
    toMetadataRecord,
} from "@/lib/utils/documentActions";

const DOC_TYPES = [
    "NDA",
    "Lease",
    "Vendor contract",
    "Employment",
    "SaaS terms",
];

type SummaryRow = {
    label: string;
    value: string;
    tone?: "red" | "green";
};

function summaryCardStatus(
    status: string | null | undefined,
): "PROCESSING" | "READY" | "FAILED" {
    if (status === "READY") return "READY";
    if (status === "FAILED") return "FAILED";
    return "PROCESSING";
}

export default function DocumentsNewPageClient() {
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const [latestDocument, setLatestDocument] = useState<DocumentItem | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
    const [dropActive, setDropActive] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [uploadState, setUploadState] = useState<
        "idle" | "uploading" | "uploadFailed"
    >("idle");
    const [retryingSummary, setRetryingSummary] = useState(false);

    const fetchLatestDocument = useCallback(async () => {
        setLoading(true);
        setListError("");
        try {
            const result = await listDocuments({
                page: 1,
                limit: 1,
                sortBy: "uploadedAt",
                sortOrder: "desc",
            });
            setLatestDocument(result.data[0] ?? null);
        } catch (error) {
            const message = formatApiError(error);
            setListError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchLatestDocument();
    }, [fetchLatestDocument]);

    const latestMetadata = useMemo(
        () => toMetadataRecord(latestDocument?.metadataJson ?? null),
        [latestDocument],
    );
    const latestStatus = summaryCardStatus(latestDocument?.status);

    useEffect(() => {
        const isProcessing =
            Boolean(latestDocument) && latestStatus === "PROCESSING";
        if (!isProcessing) return;

        const interval = setInterval(() => void fetchLatestDocument(), 6_000);
        return () => clearInterval(interval);
    }, [latestDocument, latestStatus, fetchLatestDocument]);

    const latestParties = metadataText(
        latestMetadata,
        ["parties", "partyNames"],
        "",
    );
    const latestEffectiveDate = metadataText(
        latestMetadata,
        ["effectiveDate", "dateRange", "term"],
        "",
    );
    const latestObligations = metadataText(
        latestMetadata,
        ["obligations", "keyObligations"],
        "",
    );
    const latestIndemnity = metadataText(
        latestMetadata,
        ["indemnity"],
        "",
    );
    const latestIP = metadataText(
        latestMetadata,
        ["IP", "ip"],
        "",
    );
    const latestConfidentiality = metadataText(
        latestMetadata,
        ["confidentiality"],
        "",
    );
    const latestPayment = metadataText(
        latestMetadata,
        ["payment", "paymentTerms"],
        "",
    );
    const latestRedFlags = metadataText(
        latestMetadata,
        ["redFlags", "riskFlags", "risks"],
        "",
    );
    const latestActions = metadataText(
        latestMetadata,
        ["actions", "recommendedActions", "nextActions"],
        "",
    );
    const latestAiSummary = metadataText(
        latestMetadata,
        ["summary", "aiSummary"],
        "",
    );
    const latestTextSnippet = metadataText(
        latestMetadata,
        ["textSnippet", "textPreview", "extractedText"],
        "",
    );
    const latestSnippet = latestAiSummary || latestTextSnippet;
    const latestSummaryRows = useMemo(
        () =>
            [
                { label: "PARTIES", value: latestParties },
                {
                    label: "EFFECTIVE DATE",
                    value: latestEffectiveDate,
                },
                {
                    label: "OBLIGATIONS",
                    value: latestObligations,
                },
                { label: "INDEMNITY", value: latestIndemnity },
                { label: "IP", value: latestIP },
                {
                    label: "CONFIDENTIALITY",
                    value: latestConfidentiality,
                },
                { label: "PAYMENT", value: latestPayment },
                { label: "RED FLAGS", value: latestRedFlags, tone: "red" },
                { label: "ACTIONS", value: latestActions, tone: "green" },
            ].filter((row): row is SummaryRow => Boolean(row.value.trim())),
        [
            latestParties,
            latestEffectiveDate,
            latestObligations,
            latestIndemnity,
            latestIP,
            latestConfidentiality,
            latestPayment,
            latestRedFlags,
            latestActions,
        ],
    );
    const latestPageCount = useMemo(() => {
        const raw = latestMetadata.pageCount;
        if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
            return Math.round(raw);
        }
        if (typeof raw === "string") {
            const parsed = Number(raw);
            if (Number.isFinite(parsed) && parsed > 0)
                return Math.round(parsed);
        }
        return null;
    }, [latestMetadata]);
    const latestProcessedText = useMemo(() => {
        if (!latestDocument) return "";
        if (latestStatus === "PROCESSING") return "Processing...";
        if (latestStatus === "READY") {
            // Prefer the authoritative value stored by the AI worker (covers full pipeline: upload + OCR + AI)
            const stored = latestMetadata.processingTime;
            if (typeof stored === "string" && stored) return `Processed in ${stored}`;

            const storedSeconds = latestMetadata.processingTimeSeconds;
            if (typeof storedSeconds === "number" && storedSeconds > 0)
                return `Processed in ${storedSeconds}s`;

            // Fallback: derive from document timestamps
            const uploadedAt = new Date(latestDocument.uploadedAt).getTime();
            const updatedAt = new Date(latestDocument.updatedAt).getTime();
            if (
                Number.isFinite(uploadedAt) &&
                Number.isFinite(updatedAt) &&
                updatedAt >= uploadedAt
            ) {
                const seconds = Math.max(
                    1,
                    Math.round((updatedAt - uploadedAt) / 1000),
                );
                return `Processed in ${seconds}s`;
            }
            return "Processed";
        }
        return latestStatus;
    }, [latestDocument, latestStatus, latestMetadata]);
    const latestMetaLine = [
        latestPageCount
            ? `${latestPageCount} page${latestPageCount === 1 ? "" : "s"}`
            : null,
        latestProcessedText || null,
    ]
        .filter(Boolean)
        .join(" · ");
    const canUploadAnother =
        !latestDocument ||
        latestDocument.status === "READY" ||
        latestDocument.status === "FAILED";

    async function uploadFromFile(file: File) {
        setUploadState("uploading");
        setUploading(true);
        try {
            const document = await uploadDocument({ file });
            setLatestDocument({
                ...document,
                status: summaryCardStatus(document.status),
            });
            setUploadState("idle");
            toast.success("Document uploaded");
            await fetchLatestDocument();
        } catch (error) {
            setUploadState("uploadFailed");
            toast.error(formatApiError(error));
        } finally {
            setUploading(false);
            setDropActive(false);
        }
    }

    async function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
        if (!canUploadAnother) {
            toast.info(
                "Please wait until the current document is Ready before uploading another.",
            );
            event.target.value = "";
            return;
        }
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        await uploadFromFile(file);
    }

    async function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        if (!canUploadAnother) {
            toast.info(
                "Please wait until the current document is Ready before uploading another.",
            );
            return;
        }
        const file = event.dataTransfer.files?.[0];
        if (!file) return;
        await uploadFromFile(file);
    }

    async function handleDownload(documentId: string, filename: string) {
        await handleDownloadDocument({
            documentId,
            filename,
            setBusyDocumentId,
        });
    }

    function handleDownloadSummaryPdf() {
        if (!latestDocument) return;

        handleDownloadSummaryDocumentPdf({
            document: latestDocument,
            content: {
                parties: latestParties,
                effectiveDate: latestEffectiveDate,
                obligations: latestObligations,
                indemnity: latestIndemnity,
                IP: latestIP,
                confidentiality: latestConfidentiality,
                payment: latestPayment,
                redFlags: latestRedFlags,
                actions: latestActions,
                summary: latestSnippet || undefined,
                summaryLabel: latestAiSummary ? "Summary" : "Content Preview",
            },
        });
    }

    async function ensureShareUrl() {
        if (!latestDocument) return "";
        const url = `${API_BASE_URL}/documents/summary/${latestDocument.id}`;
        setShareUrl(url);
        return url;
    }

    async function handleOpenShareModal() {
        setShowShareModal(true);
        await ensureShareUrl();
    }

    async function handleGenerateSummaryAgain() {
        if (!latestDocument) return;
        setRetryingSummary(true);
        try {
            await triggerDocumentSummary(latestDocument.id);
            setLatestDocument((current) =>
                current
                    ? {
                          ...current,
                          status: "PROCESSING",
                      }
                    : current,
            );
            await fetchLatestDocument();
            toast.success("Summary generation started");
        } catch (error) {
            toast.error(formatApiError(error));
        } finally {
            setRetryingSummary(false);
        }
    }

    async function handleCopyShareLink() {
        const url = await ensureShareUrl();
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied");
        } catch {
            toast.error("Unable to copy link");
        }
    }

    async function handleShareWhatsApp() {
        const url = await ensureShareUrl();
        if (!url) return;
        const text = encodeURIComponent(`Here is the summary PDF link: ${url}`);
        window.open(
            `https://wa.me/?text=${text}`,
            "_blank",
            "noopener,noreferrer",
        );
    }

    async function handleShareEmail() {
        const url = await ensureShareUrl();
        if (!url) return;
        const subject = encodeURIComponent("Shared summary PDF");
        const body = encodeURIComponent(
            `Here is the summary PDF link:\n\n${url}`,
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    return (
        <section className="max-w-[1180px]">
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-[#ddd5cb] bg-[#f7f3ed] p-5 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-[#2f2a25]">
                                Share Summary
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowShareModal(false)}
                                className="text-[#8f857a] hover:text-[#2f2a25]"
                                aria-label="Close share dialog"
                            >
                                <X size={18} strokeWidth={2} />
                            </button>
                        </div>

                        <p className="mb-4 text-sm text-[#5d554c]">
                            Share via WhatsApp, Email, or copy the link.
                        </p>

                        <div className="mb-4 rounded-lg border border-[#ddd5cb] bg-white px-3 py-2 text-xs text-[#6a6259] break-all">
                            {shareUrl || "No share link available yet."}
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <button
                                type="button"
                                onClick={handleShareWhatsApp}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8cfc4] bg-white px-3 py-2 text-sm font-medium text-[#2f2a25]"
                            >
                                <Share2 size={15} strokeWidth={2} />
                                WhatsApp
                            </button>
                            <button
                                type="button"
                                onClick={handleShareEmail}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8cfc4] bg-white px-3 py-2 text-sm font-medium text-[#2f2a25]"
                            >
                                <Mail size={15} strokeWidth={2} />
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={handleCopyShareLink}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8cfc4] bg-white px-3 py-2 text-sm font-medium text-[#2f2a25]"
                            >
                                <Copy size={15} strokeWidth={2} />
                                Copy link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="font-serif text-[32px] font-semibold leading-[0.95] tracking-tight text-[#2f2a25]">
                        Documents
                    </h1>
                    <p className="mt-3 text-sm text-[#4f463e] md:text-base">
                        Upload a new file and review the most recent summary.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:pt-2">
                    <Link
                        href="/documents"
                        className="flex h-12 items-center gap-2.5 rounded-md border border-[#d4b37a] bg-[#e5c186] px-5 text-[14px] font-medium text-[#3d3327]"
                    >
                        <FileText
                            size={16}
                            strokeWidth={2}
                            className="text-[#3d3327]"
                        />
                        My Documents
                    </Link>
                </div>
            </header>

            {listError && (
                <div className="mb-4 rounded-xl border border-[#f1d4cd] bg-[#fff3f0] px-4 py-3 text-sm text-[#b03a2e]">
                    {listError}
                </div>
            )}

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]">
                <div>
                    <input
                        ref={uploadInputRef}
                        type="file"
                        accept=".pdf,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleUploadChange}
                    />

                    <div
                        onDrop={handleDrop}
                        onDragOver={(event) => {
                            event.preventDefault();
                            if (!canUploadAnother) return;
                            setDropActive(true);
                        }}
                        onDragLeave={() => {
                            if (!canUploadAnother) return;
                            setDropActive(false);
                        }}
                        className={`min-h-[360px] rounded-3xl border border-dashed p-10 text-center transition-colors ${
                            dropActive
                                ? "border-[#c8852a] bg-[#f8f3ea]"
                                : "border-[#dad2c7] bg-[#f7f4ef]"
                        } flex flex-col items-center justify-center ${
                            !canUploadAnother ? "opacity-75" : ""
                        }`}
                    >
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#efe4d2] text-[#c8852a]">
                            <Upload
                                size={22}
                                strokeWidth={2}
                                aria-hidden="true"
                            />
                        </div>
                        <p className="text-2xl font-semibold leading-tight text-[#3d3732]">
                            Drop your contract here
                        </p>
                        <p className="mb-6 mt-2 text-sm text-[#958b80]">
                            Supports PDF / DOCX / JPG / JPEG / PNG - up to 50
                            pages
                        </p>
                        <button
                            type="button"
                            disabled={uploading || !canUploadAnother}
                            onClick={() => {
                                if (!canUploadAnother) {
                                    toast.info(
                                        "Please wait until the current document is Ready before uploading another.",
                                    );
                                    return;
                                }
                                uploadInputRef.current?.click();
                            }}
                            className="h-11 rounded-full bg-[#141210] px-8 text-sm font-medium text-[#fff8ef] disabled:opacity-70"
                        >
                            {uploading ? "Uploading..." : "Choose file"}
                        </button>
                        {!canUploadAnother && (
                            <p className="mt-4 text-xs text-[#9f3f3f]">
                                Upload is disabled until the latest summary is
                                Ready.
                            </p>
                        )}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        <span className="mr-1 text-sm text-[#9f9489]">
                            Works with:
                        </span>
                        {DOC_TYPES.map((type) => (
                            <span
                                key={type}
                                className="rounded-full border border-[#ddd5ca] bg-[#f7f4ef] px-4 py-1.5 text-xs text-[#9f9489]"
                            >
                                {type}
                            </span>
                        ))}
                    </div>

                    <div className="mt-5 flex justify-center text-sm text-[#9f3f3f]">
                        AI-generated summary is provided 'as is' and may contain
                        errors or omissions. We do not guarantee its accuracy.
                        Users should independently verify all information.
                    </div>
                </div>

                <article className="min-h-[360px] overflow-hidden rounded-[28px] border border-[#ddd5cb] bg-[#f8f6f2]">
                    {loading ? (
                        <div className="animate-pulse">
                            <div className="flex items-center justify-between gap-4 border-b border-[#ddd5cb] p-4">
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-[#e9e2d7]" />
                                    <div className="min-w-0">
                                        <div className="h-4 w-56 rounded bg-[#e3dccf]" />
                                        <div className="mt-3 h-3 w-36 rounded bg-[#ece5da]" />
                                    </div>
                                </div>
                                <div className="h-9 w-24 rounded-full bg-[#ebe5da]" />
                            </div>

                            <div className="divide-y divide-[#ddd5cb] px-4">
                                {Array.from({ length: 7 }).map((_, index) => (
                                    <div
                                        key={`summary-skeleton-${index}`}
                                        className={`grid grid-cols-1 gap-4 py-3 md:grid-cols-[33%_67%] ${index === 4 ? "border-l-4 border-[#ecd7d2] bg-[#f7efed] px-2" : ""} ${index === 5 ? "border-l-4 border-[#d8e8df] bg-[#eff6f2] px-2" : ""}`}
                                    >
                                        <div className="h-3 w-20 rounded bg-[#e1dacd]" />
                                        <div className="h-3 w-full rounded bg-[#e9e2d7]" />
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-[#ddd5cb] p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-11 w-28 rounded-xl bg-[#ebe4d9]" />
                                    <div className="h-11 w-24 rounded-xl bg-[#efe8dd]" />
                                </div>
                            </div>
                        </div>
                    ) : !latestDocument ? (
                        <div className="flex h-full items-center justify-center p-8 text-center text-[#7c7369]">
                            {uploadState === "uploading" ? (
                                <div className="space-y-3">
                                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#d7c6ad] border-t-[#c8852a]" />
                                    <p className="text-sm font-medium tracking-[0.14em] text-[#7c7369]">
                                        UPLOADING
                                    </p>
                                </div>
                            ) : uploadState === "uploadFailed" ? (
                                <p className="text-sm font-medium tracking-[0.08em] text-[#b03a2e]">
                                    Unable to upload
                                </p>
                            ) : (
                                <p className="text-sm font-medium tracking-[0.04em] text-[#7c7369]">
                                    No document uploaded yet. Upload a file to
                                    generate your summary.
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-4 border-b border-[#ddd5cb] p-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-4">
                                        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#efe4d2] text-[#c8852a]">
                                            <File
                                                size={26}
                                                strokeWidth={1.8}
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-[16px] leading-none font-semibold tracking-tight text-[#1f1b17]">
                                                {latestDocument.originalFilename ||
                                                    latestDocument.title}
                                            </p>
                                            <p className="mt-2 text-sm text-[#8f857a]">
                                                {latestMetaLine || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <span
                                    className={`shrink-0 rounded-full px-5 py-2 text-sm leading-none font-medium ${
                                        latestStatus === "READY"
                                            ? "bg-[#dce9e2] text-[#2b5c49]"
                                            : latestStatus === "PROCESSING"
                                              ? "bg-[#efe8ff] text-[#6a45b8]"
                                              : "bg-[#ece7df] text-[#6a6259]"
                                    }`}
                                >
                                    {latestStatus}
                                </span>
                            </div>

                            <div className="divide-y divide-[#ddd5cb] text-[#2a2520]">
                                {latestSummaryRows.length === 0 &&
                                    !latestSnippet && (
                                        <div className="px-4 py-8 text-center text-sm font-medium tracking-[0.04em] text-[#7c7369]">
                                            Summary will be available once
                                            parsing completes.
                                        </div>
                                    )}

                                {latestSummaryRows.map((row) => (
                                    <div
                                        key={row.label}
                                        className={`grid grid-cols-1 gap-4 px-4 py-3 md:grid-cols-[33%_67%] ${
                                            row.tone === "red"
                                                ? "border-l-4 border-[#ce5c45] bg-[#fdf5f3]"
                                                : row.tone === "green"
                                                  ? "border-l-4 border-[#4d9a74] bg-[#f2f8f5]"
                                                  : ""
                                        }`}
                                    >
                                        <p
                                            className={`text-[14px] font-medium tracking-[0.08em] ${
                                                row.tone === "red"
                                                    ? "inline-flex items-center gap-2 text-[#c74a35]"
                                                    : row.tone === "green"
                                                      ? "inline-flex items-center gap-2 text-[#3f7f61]"
                                                      : "text-[#8c847a]"
                                            }`}
                                        >
                                            {row.tone === "red" && (
                                                <AlertTriangle
                                                    size={18}
                                                    strokeWidth={1.8}
                                                    aria-hidden="true"
                                                />
                                            )}
                                            {row.tone === "green" && (
                                                <Check
                                                    size={18}
                                                    strokeWidth={2}
                                                    aria-hidden="true"
                                                />
                                            )}
                                            {row.label}
                                        </p>
                                        <p className="text-[14px] leading-[1.28] text-[#1f1b17]">
                                            {row.value}
                                        </p>
                                    </div>
                                ))}

                                {latestSnippet && (
                                    <div className="grid grid-cols-1 gap-4 px-4 py-3 md:grid-cols-[33%_67%]">
                                        <p className="text-[14px] font-medium tracking-[0.08em] text-[#8c847a]">
                                            {latestAiSummary
                                                ? "SUMMARY"
                                                : "CONTENT PREVIEW"}
                                        </p>
                                        <p className="text-[14px] leading-[1.45] text-[#1f1b17]">
                                            {latestSnippet}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {latestStatus === "READY" && (
                                <div className="flex items-center gap-4 border-t border-[#ddd5cb] p-6">
                                    <button
                                        type="button"
                                        onClick={handleDownloadSummaryPdf}
                                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#dfd8ce] bg-white px-4 text-sm font-medium text-[#27231f] disabled:opacity-50"
                                    >
                                        <Download size={20} strokeWidth={2} />
                                        Summary
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleOpenShareModal}
                                        className="inline-flex h-14 items-center gap-2 rounded-2xl px-2 text-[14px] leading-none text-[#8f857a] disabled:opacity-100"
                                    >
                                        <Share2 size={20} strokeWidth={2} />
                                        Share link
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            busyDocumentId === latestDocument.id
                                        }
                                        onClick={() =>
                                            handleDownload(
                                                latestDocument.id,
                                                latestDocument.originalFilename,
                                            )
                                        }
                                        className="ml-auto inline-flex h-11 items-center gap-2 rounded-xl border border-[#dfd8ce] bg-white px-4 text-sm font-medium text-[#27231f] disabled:opacity-50"
                                    >
                                        <FileText size={15} strokeWidth={2} />
                                        Download Original
                                    </button>
                                </div>
                            )}

                            {latestStatus === "FAILED" && (
                                <div className="border-t border-[#ddd5cb] p-6">
                                    <button
                                        type="button"
                                        disabled={retryingSummary}
                                        onClick={handleGenerateSummaryAgain}
                                        className="inline-flex h-11 items-center rounded-xl border border-[#dfd8ce] bg-white px-4 text-sm font-medium text-[#27231f] disabled:opacity-60"
                                    >
                                        {retryingSummary
                                            ? "Generating..."
                                            : "Generate Summary Again"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </article>
            </section>
        </section>
    );
}
