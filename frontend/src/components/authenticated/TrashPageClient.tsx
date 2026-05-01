"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FileText, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
    listTrashDocuments,
    restoreDocument,
} from "@/lib/api/documents";
import { formatApiError } from "@/lib/api/errors";
import { handleDownload as handleDownloadDocument } from "@/lib/utils/documentActions";
import { useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";

const PAGE_SIZE = 10;

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

export default function TrashPageClient() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
    const trashDocumentsQuery = useApiQuery({
        queryKey: queryKeys.documents.trashListing({
            page,
            pageSize: PAGE_SIZE,
        }),
        queryFn: () =>
            listTrashDocuments({
                page,
                limit: PAGE_SIZE,
                sortBy: "updatedAt",
                sortOrder: "desc",
            }),
    });

    useEffect(() => {
        if (!trashDocumentsQuery.isError) return;
        toast.error(formatApiError(trashDocumentsQuery.error));
    }, [trashDocumentsQuery.error, trashDocumentsQuery.isError]);

    const documents = trashDocumentsQuery.data?.data ?? [];
    const total = trashDocumentsQuery.data?.total ?? 0;
    const totalPages = Math.max(1, trashDocumentsQuery.data?.totalPages ?? 1);
    const loading = trashDocumentsQuery.isPending || trashDocumentsQuery.isFetching;
    const listError = trashDocumentsQuery.isError
        ? formatApiError(trashDocumentsQuery.error)
        : "";

    const summaryText = useMemo(() => {
        if (total === 0) return "Showing 0 records";
        const start = (page - 1) * PAGE_SIZE + 1;
        const end = Math.min(page * PAGE_SIZE, total);
        return `Showing ${start}-${end} of ${total} records`;
    }, [page, total]);

    async function handleDownload(documentId: string, filename: string) {
        await handleDownloadDocument({
            documentId,
            filename,
            setBusyDocumentId,
        });
    }

    async function handleRestore(documentId: string) {
        setBusyDocumentId(documentId);
        try {
            await restoreDocument(documentId);
            toast.success("Document restored");
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ["documents", "trashListing"],
                }),
                queryClient.invalidateQueries({
                    queryKey: ["documents", "listing"],
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.documents.totalUploaded(),
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.user.dashboardOverview(),
                }),
            ]);
        } catch (error) {
            toast.error(formatApiError(error));
        } finally {
            setBusyDocumentId(null);
        }
    }

    return (
        <section className="max-w-[1180px]">
            <header className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="font-serif text-[32px] font-semibold leading-[0.95] tracking-tight text-[#2f2a25]">
                        Trash
                    </h1>
                    <p className="mt-3 text-sm text-[#4f463e] md:text-base">
                        Deleted documents can be restored back to your
                        documents.
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

            <section className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
                <article className="min-h-[140px] rounded-[24px] border border-[#e1dbd1] bg-[#985404] text-[#fff5e7] p-5">
                    {loading ? (
                        <div className="animate-pulse">
                            <div className="h-8 w-32 rounded bg-[#e8e2d8]" />
                            <div className="mt-8 h-12 w-24 rounded bg-[#ece4d8]" />
                        </div>
                    ) : (
                        <>
                            <h3 className="flex items-center gap-3 text-2xl leading-tight font-serif text-white">
                                <Trash2
                                    size={30}
                                    strokeWidth={1.8}
                                    className="text-white"
                                    aria-hidden="true"
                                />
                                <span>In Trash</span>
                            </h3>
                            <p className="mt-8 pl-12 text-[40px] font-bold leading-none tracking-tight text-white">
                                {total}
                            </p>
                        </>
                    )}
                </article>
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
                                Array.from({ length: 6 }).map((_, index) => (
                                    <tr
                                        key={`trash-skeleton-${index}`}
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
                                            <div className="h-4 w-20 rounded bg-[#e7dfd3]" />
                                        </td>
                                    </tr>
                                ))}

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
                                            Trash is empty.
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
                                                    {document.originalFilename}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex rounded-full bg-[#ece7df] px-3 py-1 text-[11px] font-semibold text-[#6a6259]">
                                                TRASHED
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
                                                    title="Restore"
                                                    disabled={
                                                        busyDocumentId ===
                                                        document.id
                                                    }
                                                    onClick={() =>
                                                        handleRestore(
                                                            document.id,
                                                        )
                                                    }
                                                    className="hover:text-[#147a49] disabled:opacity-50"
                                                >
                                                    <RotateCcw
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
    );
}
