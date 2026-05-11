"use client";

import { useMemo, useState } from "react";
import {
    getPaymentHistory,
    getPaymentMethods,
    type PaymentHistoryParams,
    type PaymentRecord,
} from "@/lib/api/pricing";
import { formatApiError } from "@/lib/api/errors";
import { useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";

const METHOD_LABELS: Record<string, string> = {
    card: "Card",
    netbanking: "Net Banking",
    upi: "UPI",
    wallet: "Wallet",
    emi: "EMI",
    paylater: "Pay Later",
};

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
    captured: {
        label: "Success",
        classes: "bg-green-50 text-green-700 border border-green-200",
    },
    authorized: {
        label: "Authorized",
        classes: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    failed: {
        label: "Failed",
        classes: "bg-red-50 text-red-700 border border-red-200",
    },
    refunded: {
        label: "Refunded",
        classes: "bg-amber-50 text-amber-700 border border-amber-200",
    },
};

const PAGE_SIZE = 10;

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d
        .toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
        .replace(",", "")
        .replace(" am", " am")
        .replace(" pm", " pm");
}

function formatAmount(amount: number, currencyCode: string): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
    }).format(amount);
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }}
            className="ml-1.5 text-[#8f867c] hover:text-[#3b5bdb] transition-colors"
            title="Copy"
        >
            {copied ? (
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path
                        d="M3 8l4 4 6-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ) : (
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <rect
                        x="5"
                        y="1"
                        width="10"
                        height="12"
                        rx="1.5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                    />
                    <path
                        d="M3 3.5H2a1 1 0 00-1 1V14a1 1 0 001 1h9a1 1 0 001-1v-1"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                    />
                </svg>
            )}
        </button>
    );
}

function IdCell({ value }: { value: string }) {
    const short = value.slice(-10);
    return (
        <span className="flex items-center font-mono text-xs text-[#4a4540]">
            <span title={value}>…{short}</span>
            <CopyButton text={value} />
        </span>
    );
}

function PaymentHistoryTableSkeleton() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
                <thead>
                    <tr className="border-b border-[#e1dbd1] bg-[#f8f5ef]">
                        {Array.from({ length: 7 }).map((_, index) => (
                            <th
                                key={`payment-history-heading-skeleton-${index}`}
                                className="px-8 py-4 text-left"
                            >
                                <div className="h-3 w-20 rounded bg-[#ddd6cb]" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ece6]">
                    {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                        <tr
                            key={`payment-history-row-skeleton-${index}`}
                            className="animate-pulse"
                        >
                            <td className="px-5 py-4">
                                <div className="h-4 w-32 rounded bg-[#eae3d8]" />
                            </td>
                            <td className="px-5 py-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-28 rounded bg-[#e9e2d7]" />
                                    <div className="h-3 w-16 rounded bg-[#efe8de]" />
                                </div>
                            </td>
                            <td className="px-5 py-4">
                                <div className="h-4 w-20 rounded bg-[#eee7dc]" />
                            </td>
                            <td className="px-5 py-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-16 rounded bg-[#eae3d8]" />
                                    <div className="h-3 w-20 rounded bg-[#efe8de]" />
                                </div>
                            </td>
                            <td className="px-5 py-4">
                                <div className="h-4 w-28 rounded bg-[#eee7dc]" />
                            </td>
                            <td className="px-5 py-4">
                                <div className="h-4 w-28 rounded bg-[#eee7dc]" />
                            </td>
                            <td className="px-5 py-4">
                                <div className="h-6 w-20 rounded-full bg-[#e8e2d7]" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-[#ebe5db] bg-[#f3f0ea] px-8 py-4">
                <div className="h-4 w-40 rounded bg-[#e1d9cd]" />
                <div className="flex items-center gap-3">
                    <div className="h-4 w-16 rounded bg-[#e1d9cd]" />
                    <div className="h-9 w-9 rounded bg-[#d0a260]" />
                    <div className="h-4 w-10 rounded bg-[#e1d9cd]" />
                </div>
            </div>
        </div>
    );
}

export default function PaymentHistoryPageClient() {
    const [page, setPage] = useState(1);
    const [method, setMethod] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const params: PaymentHistoryParams = {
        page,
        limit: PAGE_SIZE,
        ...(method ? { method } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
    };

    const historyQuery = useApiQuery({
        queryKey: queryKeys.payments.history(params as Record<string, unknown>),
        queryFn: () => getPaymentHistory(params),
    });

    const methodsQuery = useApiQuery({
        queryKey: queryKeys.payments.methods(),
        queryFn: getPaymentMethods,
    });

    const applyFilters = () => setPage(1);

    const clearFilters = () => {
        setMethod("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const hasActiveFilters = method || dateFrom || dateTo;

    const { data, pagination } = historyQuery.data ?? {};
    const payments = data ?? [];
    const total = pagination?.total ?? 0;
    const totalPages = Math.max(1, pagination?.totalPages ?? 1);
    const loading = historyQuery.isPending || historyQuery.isFetching;

    const summaryText = useMemo(() => {
        if (total === 0) return "Showing 0 records";
        const start = (page - 1) * PAGE_SIZE + 1;
        const end = Math.min(page * PAGE_SIZE, total);
        return `Showing ${start}-${end} of ${total} records`;
    }, [page, total]);

    return (
        <section className="max-w-[1180px]">
            <header className="mb-8">
                <h1 className="font-serif text-[32px] font-semibold leading-[0.95] tracking-tight text-[#2f2a25]">
                    Payment History
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-[#6f675e]">
                    All transactions for your account.
                </p>
            </header>

            {/* Filters */}
            <div className="mb-6 rounded-xl border border-[#e1dbd1] bg-[#f8f5ef] p-4">
                <div className="flex flex-wrap items-end gap-4">
                    {/* Method filter */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium uppercase tracking-wide text-[#8f867c]">
                            Payment Mode
                        </label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="h-9 rounded-md border border-[#d8d1c7] bg-white px-3 text-sm text-[#2f2a25] focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30"
                        >
                            <option value="">All</option>
                            {(methodsQuery.data ?? []).map((m) => (
                                <option key={m} value={m}>
                                    {METHOD_LABELS[m] ?? m}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date from */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium uppercase tracking-wide text-[#8f867c]">
                            From
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="h-9 rounded-md border border-[#d8d1c7] bg-white px-3 text-sm text-[#2f2a25] focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30"
                        />
                    </div>

                    {/* Date to */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium uppercase tracking-wide text-[#8f867c]">
                            To
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="h-9 rounded-md border border-[#d8d1c7] bg-white px-3 text-sm text-[#2f2a25] focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={applyFilters}
                        className="h-9 rounded-md bg-[#2f2a25] px-4 text-sm font-medium text-white hover:bg-[#1e1b17] transition-colors"
                    >
                        Apply
                    </button>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="h-9 rounded-md border border-[#d8d1c7] px-4 text-sm font-medium text-[#6f675e] hover:bg-white transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-[#e1dbd1] bg-white overflow-hidden">
                {historyQuery.isPending && <PaymentHistoryTableSkeleton />}

                {historyQuery.isError && (
                    <p className="px-5 py-8 text-sm text-[#c61b1b]">
                        {formatApiError(historyQuery.error) ||
                            "Failed to load payment history."}
                    </p>
                )}

                {data && payments.length === 0 && (
                    <div className="px-5 py-16 text-center">
                        <p className="text-sm text-[#8f867c]">
                            No payments found.
                        </p>
                    </div>
                )}

                {data && payments.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#e1dbd1] bg-[#f8f5ef]">
                                    <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8f867c]">
                                        Date & Time
                                    </th>
                                    <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8f867c]">
                                        Plan
                                    </th>
                                    <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8f867c]">
                                        Amount
                                    </th>
                                    <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8f867c]">
                                        Mode
                                    </th>
                                    <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8f867c]">
                                        Transaction ID
                                    </th>
                                    <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8f867c]">
                                        Order ID
                                    </th>
                                    <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8f867c]">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0ece6]">
                                {payments.map((row: PaymentRecord) => {
                                    const statusInfo = STATUS_STYLES[
                                        row.status
                                    ] ?? {
                                        label: row.status,
                                        classes:
                                            "bg-[#f0ece6] text-[#6f675e] border border-[#d8d1c7]",
                                    };
                                    return (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-[#faf8f5] transition-colors"
                                        >
                                            <td className="px-5 py-3.5 text-[#4a4540] whitespace-nowrap">
                                                {formatDateTime(row.createdAt)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="font-medium text-[#2f2a25]">
                                                    {row.planName}
                                                </span>
                                                <span className="ml-1.5 text-xs text-[#8f867c] capitalize">
                                                    {row.billingCycle}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-medium text-[#2f2a25] whitespace-nowrap">
                                                {formatAmount(
                                                    row.amount,
                                                    row.currencyCode,
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-[#4a4540]">
                                                <div>
                                                    {METHOD_LABELS[
                                                        row.method ?? ""
                                                    ] ??
                                                        row.method ??
                                                        "—"}
                                                </div>
                                                {row.methodDetail && (
                                                    <div className="text-xs text-[#8f867c]">
                                                        {row.methodDetail}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {row.transactionId ? (
                                                    <IdCell
                                                        value={
                                                            row.transactionId
                                                        }
                                                    />
                                                ) : (
                                                    <span className="text-[#8f867c]">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {row.orderId ? (
                                                    <IdCell
                                                        value={row.orderId}
                                                    />
                                                ) : (
                                                    <span className="text-[#8f867c]">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.classes}`}
                                                >
                                                    {statusInfo.label}
                                                </span>
                                                {row.status === "failed" &&
                                                    row.errorDescription && (
                                                        <p className="mt-0.5 text-xs text-[#c61b1b]">
                                                            {
                                                                row.errorDescription
                                                            }
                                                        </p>
                                                    )}
                                            </td>
                                        </tr>
                                    );
                                })}
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
                )}
            </div>
        </section>
    );
}
