"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
    Clock3,
    Download,
    FilePlus2,
    FileText,
    Search,
    Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatApiError } from "@/lib/api/errors";
import { deleteDocument, type DocumentItem } from "@/lib/api/documents";
import {
    getRecentActivities,
    getRecentActivityStats,
} from "@/lib/api/search";
import {
    handleDownload as handleDownloadDocument,
    handleDownloadSummaryPdf as handleDownloadSummaryDocumentPdf,
} from "@/lib/utils/documentActions";
import ConfirmActionDialog from "@/components/authenticated/ConfirmActionDialog";
import { useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
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

export default function RecentActivitiesPageClient() {
    const queryClient = useQueryClient();
    const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const recentActivitiesQuery = useApiQuery({
        queryKey: queryKeys.activities.recent(20),
        queryFn: () => getRecentActivities(20),
    });
    const recentStatsQuery = useApiQuery({
        queryKey: queryKeys.activities.stats(),
        queryFn: getRecentActivityStats,
    });

    useEffect(() => {
        if (!recentActivitiesQuery.isError) return;
        toast.error(formatApiError(recentActivitiesQuery.error));
    }, [recentActivitiesQuery.error, recentActivitiesQuery.isError]);

    useEffect(() => {
        if (!recentStatsQuery.isError) return;
        toast.error(formatApiError(recentStatsQuery.error));
    }, [recentStatsQuery.error, recentStatsQuery.isError]);

    const items = recentActivitiesQuery.data?.items ?? [];
    const stats = recentStatsQuery.data ?? null;
    const statsLoading = recentStatsQuery.isPending || recentStatsQuery.isFetching;
    const loading = recentActivitiesQuery.isPending || recentActivitiesQuery.isFetching;
    const listError = recentActivitiesQuery.isError
        ? formatApiError(recentActivitiesQuery.error)
        : "";

    const createdCount = stats?.createdCount ?? 0;
    const searchedCount = stats?.searchedCount ?? 0;
    const trashedCount = stats?.trashedCount ?? 0;
    const recentDays = stats?.recentDays ?? null;

    const windowLabel = recentDays
        ? `in the last ${recentDays} day${recentDays === 1 ? "" : "s"}`
        : "";

    async function handleDownload(documentId: string, filename: string) {
        await handleDownloadDocument({
            documentId,
            filename,
            setBusyDocumentId,
        });
    }

    async function handleDeleteConfirm() {
        if (!deleteTargetId) return;
        setDeleteLoading(true);
        setDeleteError("");
        setBusyDocumentId(deleteTargetId);
        try {
            await deleteDocument(deleteTargetId);
            toast.success("Document deleted");
            setDeleteTargetId(null);
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: queryKeys.activities.recent(20),
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.activities.stats(),
                }),
            ]);
        } catch (error) {
            setDeleteError(formatApiError(error));
            toast.error(formatApiError(error));
        } finally {
            setDeleteLoading(false);
            setBusyDocumentId(null);
        }
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
                            Recent Activities
                        </h1>
                        <p className="mt-3 text-sm text-[#4f463e] md:text-base">
                            Latest document creations and searches {windowLabel}
                            .
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
                    <article className="min-h-[140px] rounded-[24px] border border-[#e1dbd1] bg-[#f8f5ef] p-5">
                        {statsLoading ? (
                            <div className="animate-pulse">
                                <div className="h-8 w-36 rounded bg-[#e8e2d8]" />
                                <div className="h-12 w-20 rounded bg-[#ece4d8]" />
                                <div className="mt-4 h-3 w-40 rounded bg-[#eee8de]" />
                            </div>
                        ) : (
                            <>
                                <h3 className="flex items-center gap-3 text-2xl leading-tight font-serif text-[#37322d]">
                                    <FilePlus2
                                        size={30}
                                        strokeWidth={1.8}
                                        className="text-[#6a6259]"
                                    />
                                    <span>Created</span>
                                </h3>
                                <p className="mt-8 pl-12 text-[40px] font-bold leading-none tracking-tight text-[#6a6259]">
                                    {createdCount}
                                </p>
                                {recentDays !== null && (
                                    <p className="mt-2 pl-12 text-xs text-[#8d847a]">
                                        Documents created {windowLabel}
                                    </p>
                                )}
                            </>
                        )}
                    </article>

                    <article className="min-h-[140px] rounded-[24px] border border-[#e1dbd1] bg-[#f8f5ef] p-5">
                        {statsLoading ? (
                            <div className="animate-pulse">
                                <div className="h-8 w-40 rounded bg-[#e8e2d8]" />
                                <div className="h-12 w-20 rounded bg-[#ece4d8]" />
                                <div className="mt-4 h-3 w-40 rounded bg-[#eee8de]" />
                            </div>
                        ) : (
                            <>
                                <h3 className="flex items-center gap-3 text-2xl leading-tight font-serif text-[#37322d]">
                                    <Search
                                        size={30}
                                        strokeWidth={1.8}
                                        className="text-[#6a6259]"
                                    />
                                    <span>Searched</span>
                                </h3>
                                <p className="mt-8 pl-12 text-[40px] font-bold leading-none tracking-tight text-[#6a6259]">
                                    {searchedCount}
                                </p>
                                {recentDays !== null && (
                                    <p className="mt-2 pl-12 text-xs text-[#8d847a]">
                                        Searches performed {windowLabel}
                                    </p>
                                )}
                            </>
                        )}
                    </article>

                    <article className="min-h-[140px] rounded-[24px] border border-[#e1dbd1] bg-[#f8f5ef] p-5">
                        {statsLoading ? (
                            <div className="animate-pulse">
                                <div className="h-8 w-32 rounded bg-[#e8e2d8]" />
                                <div className="h-12 w-20 rounded bg-[#ece4d8]" />
                                <div className="mt-4 h-3 w-40 rounded bg-[#eee8de]" />
                            </div>
                        ) : (
                            <>
                                <h3 className="flex items-center gap-3 text-2xl leading-tight font-serif text-[#37322d]">
                                    <Trash2
                                        size={30}
                                        strokeWidth={1.8}
                                        className="text-[#9f3f3f]"
                                    />
                                    <span>Trashed</span>
                                </h3>
                                <p className="mt-8 pl-12 text-[40px] font-bold leading-none tracking-tight text-[#9f3f3f]">
                                    {trashedCount}
                                </p>
                                {recentDays !== null && (
                                    <p className="mt-2 pl-12 text-xs text-[#8d847a]">
                                        Documents trashed {windowLabel}
                                    </p>
                                )}
                            </>
                        )}
                    </article>
                </section>

                <div className="overflow-hidden rounded-2xl border border-[#e4ddd3] bg-[#f9f7f3]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] table-fixed">
                            <colgroup>
                                <col className="w-[16%]" />
                                <col className="w-[36%]" />
                                <col className="w-[16%]" />
                                <col className="w-[18%]" />
                                <col className="w-[14%]" />
                            </colgroup>
                            <thead>
                                <tr className="bg-[#f1eee8] text-[11px] uppercase tracking-[0.24em] text-[#b0a79c]">
                                    <th className="px-8 py-4 text-left font-medium">
                                        Type
                                    </th>
                                    <th className="px-8 py-4 text-left font-medium">
                                        Details
                                    </th>
                                    <th className="px-8 py-4 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-8 py-4 text-left font-medium">
                                        Time
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
                                                key={`activity-skeleton-${index}`}
                                                className="animate-pulse border-t border-[#ebe5db]"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="h-4 w-20 rounded bg-[#e7dfd3]" />
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-[68%] rounded bg-[#eae3d8]" />
                                                        <div className="h-3 w-[52%] rounded bg-[#eee8de]" />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="h-6 w-24 rounded-full bg-[#ece4d8]" />
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="h-4 w-28 rounded bg-[#eee7dc]" />
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="h-4 w-16 rounded bg-[#e7dfd3]" />
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
                                    items.length === 0 && (
                                        <tr className="border-t border-[#ebe5db]">
                                            <td
                                                className="px-8 py-10 text-sm text-[#7b7269]"
                                                colSpan={5}
                                            >
                                                No recent activities found.
                                            </td>
                                        </tr>
                                    )}

                                {!loading &&
                                    !listError &&
                                    items.map((item) => {
                                        const isCreated =
                                            item.latestSource === "created";
                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-t border-[#ebe5db]"
                                            >
                                                <td className="px-8 py-5 text-sm text-[#5f564d]">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        {isCreated ? (
                                                            <>
                                                                <FilePlus2
                                                                    size={14}
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    className="text-[#b87013]"
                                                                />
                                                                Created
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Search
                                                                    size={14}
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    className="text-[#6a6259]"
                                                                />
                                                                Searched
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="truncate text-base leading-none text-[#27231f]">
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-[#8d847a]">
                                                        {item.originalFilename ||
                                                            "Document"}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    {item.status ? (
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusClass(item.status)}`}
                                                        >
                                                            {item.status}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-[#ece7df] px-3 py-1 text-[11px] font-semibold text-[#6a6259]">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-8 py-5 text-sm leading-none text-[#6a6259]">
                                                    <span className="inline-flex items-center gap-2">
                                                        <Clock3
                                                            size={14}
                                                            strokeWidth={2}
                                                            className="text-[#8e8479]"
                                                        />
                                                        {formatDateTime(
                                                            item.recentAt,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="flex items-center gap-3 whitespace-nowrap text-[#b2a89c]">
                                                        <button
                                                            type="button"
                                                            title="Download"
                                                            disabled={
                                                                busyDocumentId ===
                                                                item.id
                                                            }
                                                            onClick={() =>
                                                                handleDownload(
                                                                    item.id,
                                                                    item.originalFilename,
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
                                                                item.id
                                                            }
                                                            onClick={() =>
                                                                handleDownloadSummaryPdf(
                                                                    item,
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
                                                                item.id
                                                            }
                                                            onClick={() =>
                                                                setDeleteTargetId(
                                                                    item.id,
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
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </>
    );
}
