"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    CalendarClock,
    FileImage,
    FilePlus2,
    FileText,
    Users,
    Wallet,
} from "lucide-react";
import { getDashboardOverview } from "@/lib/api/user";
import { formatApiError } from "@/lib/api/errors";
import { useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";
import UsageCard from "./UsageCard";

function DashboardSkeleton() {
    return (
        <section className="max-w-[1180px] animate-pulse">
            <header className="mb-7 space-y-3">
                <div className="h-14 w-[520px] max-w-full rounded bg-[#e9e3d9]" />
                <div className="h-5 w-[280px] max-w-full rounded bg-[#eee8de]" />
            </header>

            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={`dashboard-top-card-${index}`}
                        className="min-h-[160px] rounded-xl  border border-[#e1dbd1] bg-[#f8f5ef] p-5"
                    />
                ))}
            </div>

            <div className="mb-4 grid grid-cols-12 gap-4">
                <div className="col-span-12 xl:col-span-8 rounded-xl border border-[#ece8e2] bg-[#f6f4f0] p-5 h-[220px]" />
                <div className="col-span-12 xl:col-span-4 rounded-xl border border-[#ece8e2] bg-[#f6f4f0] p-5 h-[220px]" />
            </div>

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 xl:col-span-8 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-5 h-[300px]" />
                <div className="col-span-12 xl:col-span-4 rounded-xl border border-[#ece8e2] bg-[#f6f4f0] p-5 h-[300px]" />
            </div>
        </section>
    );
}

function FileIcon({ mimeType }: { mimeType: string }) {
    const isImage = mimeType.startsWith("image/");
    return (
        <span className="w-8 h-8 rounded-md bg-[#f2efea] border border-[#ece7df] text-[#5e5045] flex items-center justify-center">
            {isImage ? (
                <FileImage size={15} strokeWidth={2} aria-hidden="true" />
            ) : (
                <FileText size={15} strokeWidth={2} aria-hidden="true" />
            )}
        </span>
    );
}

function formatBytes(value: string | null) {
    const n = value ? Number(value) : 0;
    if (!Number.isFinite(n) || n <= 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = n;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    const precision = size >= 10 ? 1 : 2;
    return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function formatRelativeTime(value: string) {
    const ts = new Date(value).getTime();
    if (Number.isNaN(ts)) return "Recently";

    const diffMs = Date.now() - ts;
    const mins = Math.round(diffMs / 60000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;

    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;

    return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
    });
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

function formatMoney(amount: number, currency: string | null) {
    if (!Number.isFinite(amount) || amount <= 0) return "No spend found";

    if (currency) {
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency,
                maximumFractionDigits: amount >= 1000 ? 0 : 2,
            }).format(amount);
        } catch {
            return `${currency} ${amount.toLocaleString()}`;
        }
    }

    return amount.toLocaleString(undefined, {
        maximumFractionDigits: amount >= 1000 ? 0 : 2,
    });
}

function severityClass(severity: "high" | "medium" | "low" | null) {
    if (severity === "high") return "bg-[#f4d6d0] text-[#9b2f2f]";
    if (severity === "medium") return "bg-[#f4e2bf] text-[#80520f]";
    return "bg-[#dce9e2] text-[#2b5c49]";
}

type TrendMode = "last7Days" | "last30Days" | "last12Months";

const MONTH_SHORT_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

function formatTrendAxisLabel(startDate: string, trendMode: TrendMode) {
    const date = new Date(startDate);
    if (Number.isNaN(date.getTime())) return "";

    if (trendMode === "last12Months") {
        const month = MONTH_SHORT_NAMES[date.getUTCMonth()];
        const year = String(date.getUTCFullYear()).slice(-2);
        return `${month}'${year}`;
    }

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = MONTH_SHORT_NAMES[date.getUTCMonth()];
    return `${day}-${month}`;
}

export default function DashboardPageClient() {
    const [trendMode, setTrendMode] = useState<TrendMode>("last30Days");
    const dashboardOverviewQuery = useApiQuery({
        queryKey: queryKeys.user.dashboardOverview(),
        queryFn: getDashboardOverview,
    });
    const data = dashboardOverviewQuery.data;

    const trendData = useMemo(() => {
        if (!data) return [];
        if (trendMode === "last7Days") return data.uploadTrend.last7Days;
        if (trendMode === "last30Days") return data.uploadTrend.last30Days;
        return data.uploadTrend.last12Months;
    }, [data, trendMode]);

    const maxTrendCount = Math.max(1, ...trendData.map((b) => b.count));
    const trendBarWidthClass =
        trendMode === "last7Days"
            ? "w-[88%]"
            : trendMode === "last12Months"
              ? "w-[64%]"
              : "w-[40%]";
    const isVerticalTrendLabels = trendMode === "last30Days";

    if (dashboardOverviewQuery.isPending) return <DashboardSkeleton />;

    if (dashboardOverviewQuery.isError || !data) {
        return (
            <section className="max-w-[1180px]">
                <p className="text-sm text-[#c61b1b]">
                    {formatApiError(dashboardOverviewQuery.error) ||
                        "Unable to load dashboard."}
                </p>
            </section>
        );
    }

    const greetingName = data.user.name || data.user.roleName || "Archivist";
    const headerDate = new Date(data.generatedAt).toLocaleDateString(
        undefined,
        {
            weekday: "long",
            day: "numeric",
            month: "long",
        },
    );
    const classificationPalette = [
        "#2DD4BF",
        "#60A5FA",
        "#A78BFA",
        "#F472B6",
        "#FB7185",
        "#F59E0B",
        "#A3E635",
        "#22C55E",
    ];
    const classificationData = data.documentClassificationCounts
        .filter((item) => item.count > 0)
        .map((item, index) => ({
            label: item.label,
            value: item.count,
            color: classificationPalette[index % classificationPalette.length],
        }));
    const classifiedTotal = classificationData.reduce(
        (sum, item) => sum + item.value,
        0,
    );
    const classificationGradient =
        classifiedTotal === 0
            ? "#e5dfd5"
            : `conic-gradient(${classificationData
                  .map((item, index) => {
                      const start =
                          classificationData
                              .slice(0, index)
                              .reduce((s, x) => s + x.value, 0) /
                          classifiedTotal;
                      const end =
                          (start * classifiedTotal + item.value) /
                          classifiedTotal;
                      return `${item.color} ${(start * 100).toFixed(2)}% ${(end * 100).toFixed(2)}%`;
                  })
                  .join(", ")})`;
    const insights = data.contractInsights;
    const topRisks = insights.riskiestContracts.slice(0, 3);
    const nextRenewal = insights.upcomingRenewals[0] ?? null;
    const spendLabel = formatMoney(
        insights.totalSpend.amount,
        insights.totalSpend.currency,
    );

    return (
        <section className="max-w-[1180px]">
            <header className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="font-serif text-[32px] font-semibold leading-[0.95] tracking-tight text-[#2f2a25]">
                        Welcome back, {greetingName}
                    </h1>
                    <p className="mt-3 text-sm text-[#4f463e] md:text-base">
                        {headerDate}
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

            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <UsageCard />

                <article className="min-h-[160px] rounded-xl  border border-[#e1dbd1] bg-[#f8f5ef] p-5">
                    <div className="flex items-center gap-4">
                        <span className="text-[#37322d]">
                            <FileText
                                size={24}
                                strokeWidth={1.8}
                                aria-hidden="true"
                            />
                        </span>
                        <h2 className="text-xl leading-tight font-serif text-[#37322d]">
                            Documents Uploaded
                        </h2>
                    </div>

                    <p className="mt-9 pl-[38px] text-[40px] font-bold leading-none tracking-tight text-[#b36d13]">
                        {data.documentCounts.total}
                    </p>
                </article>

                <article className="min-h-[160px] rounded-xl  border border-[#e1dbd1] bg-[#f8f5ef] p-5">
                    <div className="flex items-center gap-4">
                        <span className="text-[#37322d]">
                            <Users
                                size={24}
                                strokeWidth={1.8}
                                aria-hidden="true"
                            />
                        </span>
                        <h2 className="text-xl leading-tight font-serif text-[#37322d]">
                            Team Member
                        </h2>
                    </div>

                    <p className="mt-9 pl-[38px] text-[40px] font-bold leading-none tracking-tight text-[#b36d13]">
                        {data.teamMemberCount}
                    </p>
                </article>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <article className="min-h-[160px] rounded-xl border border-[#ead8d3] bg-[#fff8f6] p-5">
                    <div className="flex items-center gap-3">
                        <span className="text-[#c74a35]">
                            <AlertTriangle
                                size={24}
                                strokeWidth={1.8}
                                aria-hidden="true"
                            />
                        </span>
                        <h2 className="text-xl leading-tight font-serif text-[#2f2b27]">
                            Riskiest Contracts
                        </h2>
                    </div>

                    {topRisks.length > 0 ? (
                        <ol className="mt-4 space-y-1">
                            {topRisks.map((risk, index) => (
                                <li key={risk.id} className="pl-[38px]">
                                    <div className="flex items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={`/documents?q=${encodeURIComponent(risk.title)}`}
                                                className="block truncate text-sm font-semibold text-[#2f2b27] hover:underline"
                                            >
                                                {risk.title}
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="mt-5 text-sm text-[#6f675e]">
                            No risk signals found in ready summaries yet.
                        </p>
                    )}
                </article>

                <article className="min-h-[160px] rounded-xl border border-[#e3dbcf] bg-[#f6f4f0] p-5">
                    <div className="flex items-center gap-3">
                        <span className="text-[#875f22]">
                            <CalendarClock
                                size={24}
                                strokeWidth={1.8}
                                aria-hidden="true"
                            />
                        </span>
                        <h2 className="text-xl leading-tight font-serif text-[#2f2b27]">
                            Upcoming Renewals
                        </h2>
                    </div>

                    {nextRenewal ? (
                        <div className="mt-5">
                            <p className="text-lg font-semibold text-[#2f2b27]">
                                {formatDate(nextRenewal.renewalDate)}
                            </p>
                            <p className="mt-1 text-sm text-[#7d756d]">
                                {nextRenewal.daysUntil === 0
                                    ? "Due today"
                                    : `${nextRenewal.daysUntil} day${nextRenewal.daysUntil === 1 ? "" : "s"} away`}
                            </p>
                            <Link
                                href={`/documents?q=${encodeURIComponent(nextRenewal.title)}`}
                                className="mt-3 block line-clamp-1 text-sm font-semibold text-[#2f2b27] hover:underline"
                            >
                                {nextRenewal.title}
                            </Link>
                            {nextRenewal.renewalTerms && (
                                <p className="mt-2 line-clamp-2 text-sm leading-snug text-[#6f675e]">
                                    {nextRenewal.renewalTerms}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="mt-5 pl-[38px] text-sm text-[#6f675e]">
                            No future renewal dates found.
                        </p>
                    )}
                </article>

                <article className="min-h-[160px] rounded-xl border border-[#d9e4dd] bg-[#f3f8f5] p-5">
                    <div className="flex items-center gap-3">
                        <span className="text-[#3f7f61]">
                            <Wallet
                                size={24}
                                strokeWidth={1.8}
                                aria-hidden="true"
                            />
                        </span>
                        <h2 className="text-xl leading-tight font-serif text-[#2f2b27]">
                            Total Spend
                        </h2>
                    </div>

                    <p className="mt-9 pl-[38px] text-[40px] font-bold leading-none tracking-tight text-[#2f6f50]">
                        {spendLabel}
                    </p>
                </article>
            </div>

            <div className="grid grid-cols-12 gap-4 mb-4">
                <article className="col-span-12 xl:col-span-8 rounded-xl bg-[#f6f4f0] border border-[#ece8e2] p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl leading-tight font-serif text-[#2f2b27]">
                            Upload Trends
                        </h2>
                        <div className="rounded-md border border-[#e3dbcf] bg-[#f3efe8] p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setTrendMode("last7Days")}
                                className={`px-2 py-1 rounded ${trendMode === "last7Days" ? "bg-[#ddd5c8] text-[#2f2b27]" : "text-[#6f675e]"}`}
                            >
                                Last 7 days
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrendMode("last30Days")}
                                className={`px-2 py-1 rounded ${trendMode === "last30Days" ? "bg-[#ddd5c8] text-[#2f2b27]" : "text-[#6f675e]"}`}
                            >
                                Last 30 days
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrendMode("last12Months")}
                                className={`px-2 py-1 rounded ${trendMode === "last12Months" ? "bg-[#ddd5c8] text-[#2f2b27]" : "text-[#6f675e]"}`}
                            >
                                Last 12 months
                            </button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex h-[90px] w-full items-end gap-1">
                            {trendData.map((bucket) => (
                                <div
                                    key={`${bucket.label}-${bucket.startDate}`}
                                    className="flex h-full min-w-0 flex-1 items-end justify-center"
                                >
                                    <div
                                        className={`${trendBarWidthClass} rounded-t bg-[#a85f00]`}
                                        style={{
                                            height: `${Math.max(6, Math.round((bucket.count / maxTrendCount) * 72))}px`,
                                            opacity:
                                                bucket.count > 0 ? 1 : 0.35,
                                        }}
                                        title={`${bucket.label}: ${bucket.count}`}
                                    />
                                </div>
                            ))}
                        </div>
                        <div
                            className={`mt-4 flex w-full items-start gap-1 ${isVerticalTrendLabels ? "h-10" : "h-4"}`}
                        >
                            {trendData.map((bucket) => (
                                <div
                                    key={`label-${bucket.label}-${bucket.startDate}`}
                                    className="flex min-w-0 flex-1 justify-center"
                                >
                                    <span
                                        className={
                                            isVerticalTrendLabels
                                                ? "block origin-center -rotate-90 whitespace-nowrap text-[10px] text-[#7d756d]"
                                                : "block w-full truncate text-center text-[10px] text-[#7d756d]"
                                        }
                                    >
                                        {formatTrendAxisLabel(
                                            bucket.startDate,
                                            trendMode,
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </article>

                <article className="col-span-12 xl:col-span-4 rounded-xl bg-[#f6f4f0] border border-[#ece8e2] p-5">
                    <h2 className="text-xl leading-tight font-serif text-[#2f2b27]">
                        Document Classification
                    </h2>

                    <div className="mt-5 flex items-center gap-4">
                        <div className="relative w-[130px] h-[130px] shrink-0">
                            <div
                                className="w-full h-full rounded-full"
                                style={{ background: classificationGradient }}
                            />
                            <div className="absolute inset-[22px] rounded-full bg-[#f6f4f0] border border-[#e7e1d8]" />
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#6f675e]">
                                {classifiedTotal}
                            </div>
                        </div>
                        <ul className="space-y-1.5">
                            {classificationData.length === 0 ? (
                                <li className="text-sm text-[#6f675e]">
                                    No classified documents yet.
                                </li>
                            ) : (
                                classificationData.map((item) => (
                                    <li
                                        key={item.label}
                                        className="flex items-center gap-2 text-sm text-[#5f564d]"
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{
                                                backgroundColor: item.color,
                                            }}
                                        />
                                        <span>
                                            {item.label} ({item.value})
                                        </span>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </article>
            </div>

            <div className="grid grid-cols-12 gap-4">
                <article className="col-span-12 xl:col-span-8 rounded-xl bg-[#faf9f7] border border-[#ece8e2] p-5">
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <h2 className="text-xl leading-tight font-serif text-[#2f2b27]">
                                Recent Documents
                            </h2>
                            <p className="text-sm text-[#70685f] mt-1">
                                Live feed • {data.recentDocuments.length} items
                            </p>
                        </div>
                        <Link
                            href="/documents"
                            className="text-sm font-semibold text-[#ab5d23] hover:underline"
                        >
                            View All
                        </Link>
                    </div>

                    {data.recentDocuments.length === 0 ? (
                        <p className="text-sm text-[#6f675e]">
                            No documents found yet.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {data.recentDocuments.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[#f3f0ea] transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <FileIcon mimeType={item.mimeType} />
                                        <div className="min-w-0">
                                            <p className="text-md leading-tight font-semibold text-[#2f2b27] truncate">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-[#6f675e] truncate">
                                                {item.ownerName} •{" "}
                                                {formatBytes(
                                                    item.fileSizeBytes,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-[#7a7268] pl-4 whitespace-nowrap">
                                        {formatRelativeTime(item.updatedAt)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>

                <article className="col-span-12 xl:col-span-4 rounded-xl bg-[#f6f4f0] border border-[#ece8e2] p-5">
                    <h2 className="text-xl leading-tight font-serif text-[#2f2b27]">
                        Team Activity
                    </h2>

                    {data.teamActivity.length === 0 ? (
                        <p className="mt-4 text-sm text-[#6f675e]">
                            No recent team activity.
                        </p>
                    ) : (
                        <ul className="mt-5 space-y-4">
                            {data.teamActivity.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-start gap-2.5"
                                >
                                    <span className="mt-1 w-5 h-5 rounded-full border-2 border-[#d1c8bc] flex items-center justify-center">
                                        <span className="w-2 h-2 rounded-full bg-transparent border border-[#d9cfc3]" />
                                    </span>
                                    <div>
                                        <p className="text-sm leading-snug text-[#4f463f]">
                                            {item.message}
                                        </p>
                                        <p className="text-xs text-[#7d756d] mt-0.5">
                                            {formatRelativeTime(item.eventAt)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>
            </div>
        </section>
    );
}
