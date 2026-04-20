"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Bell,
    Filter,
    Menu,
    RefreshCcw,
    Search,
    Settings,
    UserRound,
} from "lucide-react";
import { DOCUMENT_STATUS_OPTIONS } from "@/components/authenticated/documentFilters";

interface TopbarProps {
    onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchDraft, setSearchDraft] = useState(
        () => searchParams.get("q") || "",
    );
    const [statusDraft, setStatusDraft] = useState(
        () => searchParams.get("status") || "",
    );

    function applyFilters() {
        const params = new URLSearchParams();
        const query = searchDraft.trim();
        if (query) params.set("q", query);
        if (statusDraft) params.set("status", statusDraft);
        const queryString = params.toString();
        router.push(queryString ? `/documents?${queryString}` : "/documents");
    }

    return (
        <header className="h-20 lg:h-16 border-b border-border bg-cream/90 backdrop-blur px-3 sm:px-4 lg:px-6 flex items-center">
            <div className="flex lg:hidden items-center gap-2">
                <img
                    src="/logo.png"
                    alt="DocuNova AI logo"
                    className="h-12 w-auto"
                />
                <span className="font-medium text-ink text-[24px] tracking-tight">
                    DocuNova{" "}
                    <span className="text-amber font-semibold">AI</span>
                </span>
            </div>

            <div className="lg:hidden ml-auto">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="text-muted hover:text-ink"
                    aria-label="Open menu"
                >
                    <Menu size={34} strokeWidth={1.8} aria-hidden="true" />
                </button>
            </div>

            <div className="hidden lg:flex items-center gap-3">
                <div className="flex h-12 items-center gap-2 rounded-md border border-[#e3ddd3] bg-[#f3efe8] px-4 text-sm text-[#35302b]">
                    <Search
                        size={15}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="text-[#8e8479]"
                    />
                    <input
                        value={searchDraft}
                        onChange={(event) => setSearchDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                applyFilters();
                            }
                        }}
                        placeholder="Search"
                        className="w-52 bg-transparent text-[#4f463e] outline-none placeholder:text-[#9a8f83]"
                    />
                </div>

                <div className="flex h-12 items-center gap-2 rounded-md border border-[#e3ddd3] bg-[#f3efe8] px-4 text-sm text-[#35302b]">
                    <Filter
                        size={15}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="text-[#8e8479]"
                    />
                    <select
                        value={statusDraft}
                        onChange={(event) => setStatusDraft(event.target.value)}
                        className="bg-transparent text-[#4f463e] outline-none"
                    >
                        {DOCUMENT_STATUS_OPTIONS.map((option) => (
                            <option key={option.label} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={applyFilters}
                    className="flex h-12 items-center gap-2.5 rounded-md border border-[#e3ddd3] bg-[#f3efe8] px-5 text-base font-medium text-[#4f463e]"
                >
                    <RefreshCcw
                        size={15}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="text-[#8e8479]"
                    />
                    Apply
                </button>
            </div>

            <div className="hidden lg:flex items-center gap-4 ml-auto">
                <button
                    type="button"
                    className="text-muted hover:text-ink"
                    aria-label="Notifications"
                >
                    <Bell size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="text-muted hover:text-ink"
                    aria-label="Settings"
                >
                    <Settings size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-sage-dark text-sage-light flex items-center justify-center"
                    aria-label="Profile"
                >
                    <UserRound size={15} strokeWidth={2} aria-hidden="true" />
                </button>
            </div>

        </header>
    );
}
