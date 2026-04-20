"use client";

import { useEffect, useState } from "react";
import {
    Cloud,
    FileImage,
    FilePenLine,
    FileText,
    FileUp,
    Search,
    Share2,
} from "lucide-react";

const recentDocuments = [
    {
        name: "Manuscript_Final_V4.pdf",
        meta: "Modified by Julia Chen • 2MB",
        time: "2h ago",
        icon: "doc",
    },
    {
        name: "Archive_Plate_012.jpg",
        meta: "Uploaded by Marcus Wright • 15MB",
        time: "5h ago",
        icon: "img",
    },
    {
        name: "Editorial_Guidelines_2024.docx",
        meta: "Modified by System • 450KB",
        time: "Yesterday",
        icon: "doc",
    },
] as const;

const teamActivity = [
    {
        user: "Julia Chen",
        action: "commented on",
        target: '"Winter Issue Prep"',
        time: "12:45 PM",
        highlight: true,
    },
    {
        user: "Marcus Wright",
        action: "moved 12 files to",
        target: '"Completed"',
        time: "10:20 AM",
        highlight: false,
    },
    {
        user: "Sarah Jenkins",
        action: "joined the",
        target: '"Design Archive" team',
        time: "Yesterday",
        highlight: false,
    },
] as const;

function DashboardSkeleton() {
    return (
        <section className="max-w-[1180px] animate-pulse">
            <header className="mb-7 space-y-3">
                <div className="h-14 w-[520px] max-w-full rounded bg-[#e9e3d9]" />
                <div className="h-5 w-[280px] max-w-full rounded bg-[#eee8de]" />
            </header>

            <div className="grid grid-cols-12 gap-4 mb-5">
                <div className="col-span-12 xl:col-span-4 rounded-xl border border-[#ece8e2] bg-[#f4f1eb] p-5 min-h-[250px]">
                    <div className="h-5 w-20 rounded bg-[#e4ddd2]" />
                    <div className="h-10 w-40 rounded bg-[#e8e1d7] mt-8" />
                    <div className="h-4 w-52 rounded bg-[#ece5da] mt-4" />
                    <div className="h-2 w-full rounded bg-[#e7e1d6] mt-14" />
                </div>

                <div className="col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={`quick-card-${index}`}
                            className="rounded-xl border border-[#ece8e2] bg-[#f4f1eb] p-5 min-h-[120px]"
                        >
                            <div className="h-5 w-5 rounded bg-[#e3dbcf]" />
                            <div className="h-9 w-40 rounded bg-[#e8e2d8] mt-5" />
                            <div className="h-4 w-32 rounded bg-[#ece5da] mt-3" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 xl:col-span-8 rounded-xl border border-[#ece8e2] bg-[#f9f7f3] p-5">
                    <div className="flex items-end justify-between mb-5">
                        <div className="space-y-2">
                            <div className="h-10 w-64 rounded bg-[#e8e2d7]" />
                            <div className="h-4 w-44 rounded bg-[#ece5da]" />
                        </div>
                        <div className="h-4 w-16 rounded bg-[#e8e1d6]" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={`recent-doc-${index}`}
                                className="h-14 rounded-lg bg-[#f1ece4]"
                            />
                        ))}
                    </div>
                </div>

                <div className="col-span-12 xl:col-span-4 rounded-xl border border-[#ece8e2] bg-[#f6f4f0] p-5">
                    <div className="h-10 w-52 rounded bg-[#e8e2d7]" />
                    <div className="space-y-4 mt-6">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={`activity-${index}`}
                                className="h-10 rounded bg-[#eee8df]"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function FileIcon({ type }: { type: "doc" | "img" }) {
    return (
        <span className="w-8 h-8 rounded-md bg-[#f2efea] border border-[#ece7df] text-[#5e5045] flex items-center justify-center">
            {type === "doc" ? (
                <FileText size={15} strokeWidth={2} aria-hidden="true" />
            ) : (
                <FileImage size={15} strokeWidth={2} aria-hidden="true" />
            )}
        </span>
    );
}

export default function DashboardPageClient() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => setLoading(false), 300);
        return () => window.clearTimeout(timer);
    }, []);

    if (loading) return <DashboardSkeleton />;

    return (
        <section className="max-w-[1180px]">
            <header className="mb-7">
                <h1 className="font-serif text-[32px] font-semibold leading-[0.95] tracking-tight text-[#2f2a25]">
                    Welcome back, Archivist
                </h1>
                <p className="mt-3 text-sm text-[#4f463e] md:text-base">
                    Monday, 24th October • All systems operational
                </p>
            </header>

            <div className="grid grid-cols-12 gap-4 mb-5">
                <article className="col-span-12 xl:col-span-4 rounded-xl bg-[#f2f0eb] border border-[#ece8e2] p-5 min-h-[250px]">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[#9f5a16]">
                            <Cloud
                                size={20}
                                strokeWidth={2}
                                aria-hidden="true"
                            />
                        </span>
                        <span className="text-[11px] px-2.5 py-1 rounded bg-[#e8e4de] text-[#6d655e] font-semibold tracking-wide">
                            84% FULL
                        </span>
                    </div>

                    <h2 className="text-2xl leading-tight font-serif text-[#37322d]">
                        Storage Usage
                    </h2>
                    <p className="text-sm leading-relaxed text-[#70685f] mt-2 max-w-[90%]">
                        Detailed analysis of your archival capacity.
                    </p>

                    <div className="mt-10">
                        <div className="w-full h-2 rounded-full bg-[#e7e2dc] overflow-hidden">
                            <div className="h-full w-[84%] bg-[#9a550f] rounded-full" />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-[#696158]">
                            <span>16.8 GB Used</span>
                            <span>20 GB Total</span>
                        </div>
                    </div>
                </article>

                <div className="col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <article className="rounded-xl bg-[#985404] text-[#fff5e7] p-5 min-h-[120px] flex flex-col justify-center">
                        <div className="mb-3">
                            <FileUp
                                size={22}
                                strokeWidth={2.2}
                                aria-hidden="true"
                            />
                        </div>
                        <h3 className="text-2xl leading-tight font-serif">
                            Upload Dossier
                        </h3>
                        <p className="text-sm text-[#f2cfa1] mt-1">
                            Batch import physical scans
                        </p>
                    </article>

                    <article className="rounded-xl bg-[#dedad4] p-5 min-h-[120px] flex flex-col justify-center text-[#3f3730]">
                        <div className="mb-3">
                            <FilePenLine
                                size={22}
                                strokeWidth={2.2}
                                aria-hidden="true"
                            />
                        </div>
                        <h3 className="text-2xl leading-tight font-serif">
                            New Entry
                        </h3>
                        <p className="text-sm text-[#69625b] mt-1">
                            Create a fresh document
                        </p>
                    </article>

                    <article className="rounded-xl bg-[#f2f0eb] border border-[#ece8e2] p-5 min-h-[120px] flex flex-col justify-center text-[#3f3730]">
                        <div className="mb-3">
                            <Share2
                                size={22}
                                strokeWidth={2.2}
                                aria-hidden="true"
                            />
                        </div>
                        <h3 className="text-2xl leading-tight font-serif">
                            Manage Access
                        </h3>
                        <p className="text-sm text-[#69625b] mt-1">
                            Update team permissions
                        </p>
                    </article>

                    <article className="rounded-xl bg-[#f6f4f0] border border-[#ece8e2] p-5 min-h-[120px] flex flex-col justify-center text-[#3f3730]">
                        <div className="mb-3">
                            <Search
                                size={22}
                                strokeWidth={2.2}
                                aria-hidden="true"
                            />
                        </div>
                        <h3 className="text-2xl leading-tight font-serif">
                            Deep Search
                        </h3>
                        <p className="text-sm text-[#69625b] mt-1">
                            Query all meta-tags
                        </p>
                    </article>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                <article className="col-span-12 xl:col-span-8 rounded-xl bg-[#faf9f7] border border-[#ece8e2] p-5">
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <h2 className="text-2xl leading-tight font-serif text-[#2f2b27]">
                                Recent Documents
                            </h2>
                            <p className="text-sm text-[#70685f] mt-1">
                                Last updated 14 minutes ago
                            </p>
                        </div>
                        <button
                            type="button"
                            className="text-sm font-semibold text-[#ab5d23] hover:underline"
                        >
                            View All
                        </button>
                    </div>

                    <ul className="space-y-2">
                        {recentDocuments.map((item) => (
                            <li
                                key={item.name}
                                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[#f3f0ea] transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileIcon type={item.icon} />
                                    <div className="min-w-0">
                                        <p className="text-lg leading-tight font-semibold text-[#2f2b27] truncate">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-[#6f675e] truncate">
                                            {item.meta}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-[#7a7268] pl-4 whitespace-nowrap">
                                    {item.time}
                                </span>
                            </li>
                        ))}
                    </ul>
                </article>

                <article className="col-span-12 xl:col-span-4 rounded-xl bg-[#f6f4f0] border border-[#ece8e2] p-5">
                    <h2 className="text-2xl leading-tight font-serif text-[#2f2b27]">
                        Team Activity
                    </h2>

                    <ul className="mt-5 space-y-4">
                        {teamActivity.map((item) => (
                            <li
                                key={`${item.user}-${item.time}`}
                                className="flex items-start gap-2.5"
                            >
                                <span className="mt-1 w-5 h-5 rounded-full border-2 border-[#d1c8bc] flex items-center justify-center">
                                    <span
                                        className={`w-2 h-2 rounded-full ${item.highlight ? "bg-[#a75816]" : "bg-transparent border border-[#d9cfc3]"}`}
                                    />
                                </span>
                                <div>
                                    <p className="text-sm leading-snug text-[#4f463f]">
                                        <span className="font-semibold text-[#2f2b27]">
                                            {item.user}
                                        </span>{" "}
                                        {item.action}{" "}
                                        <span className="text-[#b16631] italic">
                                            {item.target}
                                        </span>
                                    </p>
                                    <p className="text-xs text-[#7d756d] mt-0.5">
                                        {item.time}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </article>
            </div>
        </section>
    );
}
