"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cloud, Download, FilePlus2, FileText, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
    deleteDocument,
    listDocuments,
    searchDocuments,
    type DocumentItem,
} from "@/lib/api/documents";
import { formatApiError } from "@/lib/api/errors";
import {
    handleDownload as handleDownloadDocument,
    handleDownloadSummaryPdf as handleDownloadSummaryDocumentPdf,
} from "@/lib/utils/documentActions";
import { DOCUMENT_STATUS_OPTIONS } from "@/components/authenticated/documentFilters";
import ConfirmActionDialog from "@/components/authenticated/ConfirmActionDialog";

const PAGE_SIZE = 10;
const DEFAULT_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024;
const STORAGE_LIMIT_BYTES = (() => {
    const raw =
        process.env.NEXT_PUBLIC_DOCUMENT_STORAGE_LIMIT ||
        process.env.DOCUMENT_STORAGE_LIMIT;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_STORAGE_LIMIT_BYTES;
})();

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

function bytesToNumber(value: string | null) {
    if (!value) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatSizeFromBytes(bytes: number) {
    if (bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const power = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );
    const size = bytes / 1024 ** power;
    return `${size.toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
}

function statusClass(status: string) {
    switch (status) {
        case "READY":
            return "bg-[#d7eedf] text-[#147a49]";
        case "PROCESSING":
            return "bg-[#efe8ff] text-[#6a45b8]";
        case "UPLOADED":
            return "bg-[#ece7df] text-[#6a6259]";
        case "ARCHIVED":
            return "bg-[#e6ebdf] text-[#4f6653]";
        case "FAILED":
            return "bg-[#fde9e9] text-[#b03a2e]";
        default:
            return "bg-[#f5e1bf] text-[#a66b10]";
    }
}

export default function DocumentsPageClient() {
    const searchParams = useSearchParams();
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [total, setTotal] = useState(0);
    const [totalUploaded, setTotalUploaded] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState("");
    const [totalUploadedLoading, setTotalUploadedLoading] = useState(true);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
    const searchQuery = (searchParams.get("q") || "").trim();
    const statusFilterFromUrl = searchParams.get("status") || "";
    const statusFilter = DOCUMENT_STATUS_OPTIONS.some(
        (option) => option.value === statusFilterFromUrl,
    )
        ? statusFilterFromUrl
        : "";

    const fetchTotalUploaded = useCallback(async () => {
        setTotalUploadedLoading(true);
        try {
            const result = await listDocuments({
                page: 1,
                limit: 1,
                sortBy: "uploadedAt",
                sortOrder: "desc",
            });
            setTotalUploaded(result.total);
        } catch {
            // Keep existing count on background refresh failures.
        } finally {
            setTotalUploadedLoading(false);
        }
    }, []);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setListError("");
        try {
            const hasSearchQuery = Boolean(searchQuery.trim());
            const result = hasSearchQuery
                ? await searchDocuments({
                      query: searchQuery.trim(),
                      queryType: "full_text",
                      filters: statusFilter
                          ? { status: statusFilter }
                          : undefined,
                      page,
                      limit: PAGE_SIZE,
                  })
                : await listDocuments({
                      page,
                      limit: PAGE_SIZE,
                      status: statusFilter || undefined,
                      sortBy: "uploadedAt",
                      sortOrder: "desc",
                  });
            setDocuments(result.data);
            setTotal(result.total);
            setTotalPages(Math.max(1, result.totalPages));
        } catch (error) {
            const message = formatApiError(error);
            setListError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, statusFilter]);

    useEffect(() => {
        void fetchDocuments();
    }, [fetchDocuments]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        void fetchTotalUploaded();
    }, [fetchTotalUploaded]);

    const summaryText = useMemo(() => {
        if (total === 0) return "Showing 0 records";
        const start = (page - 1) * PAGE_SIZE + 1;
        const end = Math.min(page * PAGE_SIZE, total);
        return `Showing ${start}-${end} of ${total} records`;
    }, [page, total]);

    const pageBytes = useMemo(
        () =>
            documents.reduce(
                (sum, item) => sum + bytesToNumber(item.fileSizeBytes),
                0,
            ),
        [documents],
    );

    const usagePercent = Math.min(
        100,
        Math.round((pageBytes / STORAGE_LIMIT_BYTES) * 100),
    );

    async function handleDeleteConfirm() {
        if (!deleteTargetId) return;
        setDeleteLoading(true);
        setDeleteError("");
        setBusyDocumentId(deleteTargetId);
        try {
            await deleteDocument(deleteTargetId);
            toast.success("Document deleted");
            setDeleteTargetId(null);
            await Promise.all([fetchDocuments(), fetchTotalUploaded()]);
        } catch (error) {
            setDeleteError(formatApiError(error));
            toast.error(formatApiError(error));
        } finally {
            setDeleteLoading(false);
            setBusyDocumentId(null);
        }
    }

    async function handleDownload(documentId: string, filename: string) {
        await handleDownloadDocument({
            documentId,
            filename,
            setBusyDocumentId,
        });
    }

    function handleDownloadSummaryPdf(document: DocumentItem) {
        handleDownloadSummaryDocumentPdf({ document });
    }
    return (
        <>
            {deleteTargetId && (
                <ConfirmActionDialog
                    title="Delete this document?"
                    message="This will move the document to Trash. You can restore it later."
                    confirmLabel="Yes, delete"
                    loading={deleteLoading}
                    error={deleteError}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => {
                        if (deleteLoading) return;
                        setDeleteTargetId(null);
                        setDeleteError("");
                    }}
                />
            )}
            <section className="max-w-[1180px]">
                <header className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="font-serif text-[32px] font-semibold leading-[0.95] tracking-tight text-[#2f2a25]">
                            Documents
                        </h1>
                        <p className="mt-3 text-sm text-[#4f463e] md:text-base">
                            Manage uploaded files, metadata, downloads, and
                            previews.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 lg:pt-2">
                        <Link
                            href="/documents/new"
                            className="flex h-12 items-center gap-2.5 rounded-md border border-[#d4b37a] bg-[#e5c186] px-5 text-[14px] font-medium text-[#3d3327]"
                        >
                            <FilePlus2
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                                className="text-[#3d3327]"
                            />
                            Upload Document
                        </Link>
                    </div>
                </header>

                <section className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <article className="min-h-[160px] rounded-[24px] border border-[#e1dbd1] bg-[#f8f5ef] p-5">
                        {loading ? (
                            <div className="animate-pulse">
                                <div className="h-8 w-44 rounded bg-[#e8e2d8]" />
                                <div className="h-5 w-full rounded-full bg-[#ece8e2]" />
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="h-4 w-24 rounded bg-[#eee8de]" />
                                    <div className="h-4 w-20 rounded bg-[#eee8de]" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="flex items-center gap-3 text-2xl leading-tight font-serif text-[#37322d]">
                                    <Cloud
                                        size={32}
                                        strokeWidth={1.8}
                                        className="text-[#bb7721]"
                                        aria-hidden="true"
                                    />
                                    <span>Storage Usage</span>
                                </h3>
                                <div className="mt-8 h-5 w-full overflow-hidden rounded-full bg-[#ece8e2]">
                                    <div
                                        className="h-full rounded-full bg-[#b87013]"
                                        style={{ width: `${usagePercent}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm leading-none text-[#8f867c]">
                                    <span>
                                        {formatSizeFromBytes(pageBytes)} Used
                                    </span>
                                    <span>
                                        {formatSizeFromBytes(
                                            STORAGE_LIMIT_BYTES,
                                        )}{" "}
                                        Total
                                    </span>
                                </div>
                            </>
                        )}
                    </article>

                    <article className="min-h-[160px] rounded-[24px] border border-[#e1dbd1] bg-[#f8f5ef] p-5">
                        {totalUploadedLoading ? (
                            <div className="animate-pulse">
                                <div className="h-8 w-48 rounded bg-[#e8e2d8]" />
                                <div className="h-12 w-20 rounded bg-[#ece4d8]" />
                            </div>
                        ) : (
                            <>
                                <h3 className="flex items-center gap-4 text-2xl leading-tight font-serif text-[#37322d]">
                                    <FileText
                                        size={32}
                                        strokeWidth={1.8}
                                        aria-hidden="true"
                                    />
                                    <span>Documents Uploaded</span>
                                </h3>
                                <p className="mt-9 pl-12 text-[40px] font-bold leading-none tracking-tight text-[#b36d13]">
                                    {totalUploaded}
                                </p>
                            </>
                        )}
                    </article>

                    <article className="min-h-[160px] rounded-[24px] border border-[#e1dbd1] p-5"></article>
                </section>

                <div className="overflow-hidden rounded-2xl border border-[#e4ddd3] bg-[#f9f7f3]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] table-fixed">
                            <colgroup>
                                <col className="w-[52%]" />
                                <col className="w-[12%]" />
                                <col className="w-[12%]" />
                                <col className="w-[12%]" />
                                <col className="w-[12%]" />
                            </colgroup>
                            <thead>
                                <tr className="bg-[#f1eee8] text-[11px] uppercase tracking-[0.24em] text-[#b0a79c]">
                                    <th className="px-8 py-4 text-left font-medium">
                                        File Name
                                    </th>
                                    <th className="px-8 py-4 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-8 py-4 text-left font-medium">
                                        Date
                                    </th>
                                    <th className="px-8 py-4 text-left font-medium">
                                        Size
                                    </th>
                                    <th className="px-8 py-4 text-left font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 6 }).map(
                                        (_, index) => (
                                            <tr
                                                key={`doc-skeleton-${index}`}
                                                className="animate-pulse border-t border-[#ebe5db]"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-[68%] rounded bg-[#eae3d8]" />
                                                        <div className="h-3 w-[52%] rounded bg-[#eee8de]" />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="h-6 w-20 rounded-full bg-[#ece4d8]" />
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="h-4 w-20 rounded bg-[#eee7dc]" />
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="h-4 w-14 rounded bg-[#eee7dc]" />
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-4 w-4 rounded bg-[#e7dfd3]" />
                                                        <div className="h-4 w-4 rounded bg-[#e7dfd3]" />
                                                        <div className="h-4 w-4 rounded bg-[#e7dfd3]" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )}

                                {!loading && listError && (
                                    <tr className="border-t border-[#ebe5db]">
                                        <td
                                            className="px-8 py-10 text-sm text-[#b03a2e]"
                                            colSpan={5}
                                        >
                                            {listError}
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    !listError &&
                                    documents.length === 0 && (
                                        <tr className="border-t border-[#ebe5db]">
                                            <td
                                                className="px-8 py-10 text-sm text-[#7b7269]"
                                                colSpan={5}
                                            >
                                                No documents found for this
                                                filter.
                                            </td>
                                        </tr>
                                    )}

                                {!loading &&
                                    !listError &&
                                    documents.map((document) => (
                                        <tr
                                            key={document.id}
                                            className="border-t border-[#ebe5db]"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="min-w-0">
                                                    <p className="truncate text-base leading-none text-[#27231f]">
                                                        {document.title}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-[#8d847a]">
                                                        {
                                                            document.originalFilename
                                                        }
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusClass(
                                                        document.status,
                                                    )}`}
                                                >
                                                    {document.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-8 py-5 text-sm leading-none text-[#6a6259]">
                                                {formatDate(document.updatedAt)}
                                            </td>
                                            <td className="whitespace-nowrap px-8 py-5 text-sm leading-none text-[#6a6259]">
                                                {formatSizeFromBytes(
                                                    bytesToNumber(
                                                        document.fileSizeBytes,
                                                    ),
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="flex items-center gap-3 whitespace-nowrap text-[#b2a89c]">
                                                    <button
                                                        type="button"
                                                        title="Download"
                                                        disabled={
                                                            busyDocumentId ===
                                                            document.id
                                                        }
                                                        onClick={() =>
                                                            handleDownload(
                                                                document.id,
                                                                document.originalFilename,
                                                            )
                                                        }
                                                        className="hover:text-[#6a6259] disabled:opacity-50"
                                                    >
                                                        <Download
                                                            size={16}
                                                            strokeWidth={2}
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Download Summary PDF"
                                                        disabled={
                                                            busyDocumentId ===
                                                            document.id
                                                        }
                                                        onClick={() =>
                                                            handleDownloadSummaryPdf(
                                                                document,
                                                            )
                                                        }
                                                        className="hover:text-[#6a6259] disabled:opacity-50"
                                                    >
                                                        <FileText
                                                            size={16}
                                                            strokeWidth={2}
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        disabled={
                                                            busyDocumentId ===
                                                            document.id
                                                        }
                                                        onClick={() =>
                                                            setDeleteTargetId(
                                                                document.id,
                                                            )
                                                        }
                                                        className="hover:text-[#cf2525] disabled:opacity-50"
                                                    >
                                                        <Trash2
                                                            size={16}
                                                            strokeWidth={2}
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-between border-t border-[#ebe5db] bg-[#f3f0ea] px-8 py-4 text-sm text-[#b0a69b]">
                            <p>{summaryText}</p>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="disabled:opacity-50 hover:text-[#5f564d]"
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.max(1, current - 1),
                                        )
                                    }
                                    disabled={page <= 1 || loading}
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    className="h-9 min-w-9 rounded bg-[#9f6207] px-3 text-sm font-semibold text-white"
                                >
                                    {page}
                                </button>
                                <button
                                    type="button"
                                    className="disabled:opacity-50 hover:text-[#5f564d]"
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.min(totalPages, current + 1),
                                        )
                                    }
                                    disabled={page >= totalPages || loading}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
