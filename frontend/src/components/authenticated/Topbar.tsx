"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    Filter,
    Menu,
    RefreshCcw,
    Search,
    UserRound,
} from "lucide-react";
import { DOCUMENT_STATUS_OPTIONS } from "@/components/authenticated/documentFilters";
import { getProfile, type UserProfile } from "@/lib/api/user";
import { queryKeys } from "@/lib/query/queryKeys";
import { useApiQuery } from "@/lib/query/apiQuery";

interface TopbarProps {
    onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [searchDraft, setSearchDraft] = useState(
        () => searchParams?.get("q") || "",
    );
    const [statusDraft, setStatusDraft] = useState(
        () => searchParams?.get("status") || "",
    );
    const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
    const profileQuery = useApiQuery({
        queryKey: queryKeys.user.profile(),
        queryFn: getProfile,
    });
    const avatarUrl = profileQuery.data?.avatarUrl?.trim() || "";

    useEffect(() => {
        setSearchDraft(searchParams?.get("q") || "");
        setStatusDraft(searchParams?.get("status") || "");
    }, [searchParams]);

    useEffect(() => {
        function handleAvatarUpdated(event: Event) {
            const detail = (event as CustomEvent<{ avatarUrl?: string }>).detail;
            const nextAvatarUrl = detail?.avatarUrl?.trim() || "";
            setFailedAvatarUrl("");
            queryClient.setQueryData<UserProfile | undefined>(
                queryKeys.user.profile(),
                (current) =>
                    current
                        ? { ...current, avatarUrl: nextAvatarUrl || null }
                        : current,
            );
        }

        window.addEventListener("profile-avatar-updated", handleAvatarUpdated);
        return () => {
            window.removeEventListener(
                "profile-avatar-updated",
                handleAvatarUpdated,
            );
        };
    }, [queryClient]);

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
                <Image
                    src="/logo.png"
                    alt="DocuNova AI logo"
                    width={48}
                    height={48}
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
                    className="w-8 h-8 rounded-full bg-sage-dark text-sage-light flex items-center justify-center overflow-hidden"
                    aria-label="Profile"
                    onClick={() => router.push("/myprofile")}
                >
                    {avatarUrl && failedAvatarUrl !== avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt="Profile avatar"
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                            unoptimized
                            referrerPolicy="no-referrer"
                            onError={() => setFailedAvatarUrl(avatarUrl)}
                        />
                    ) : (
                        <UserRound size={15} strokeWidth={2} aria-hidden="true" />
                    )}
                </button>
            </div>
        </header>
    );
}
