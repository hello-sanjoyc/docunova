"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Send, X, Loader2, Clock } from "lucide-react";
import type { DocumentItem } from "@/lib/api/documents";
import { API_BASE_URL } from "@/lib/api/client";
import { getAccessToken } from "@/lib/api/session";
import { queryKeys } from "@/lib/query/queryKeys";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "chat" | "history";

type ChatMessage = {
    id: string;
    role: "assistant" | "user";
    text: string;
    timestamp: Date;
    streaming?: boolean;
};

type HistoryMessage = {
    uuid: string;
    role: string;
    content: string;
    createdAt: string;
};

type DocumentChatWindowProps = {
    document: DocumentItem;
    onClose: () => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (msgDay.getTime() === today.getTime()) return "Today";
    if (msgDay.getTime() === yesterday.getTime()) return "Yesterday";
    return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function groupByDate<T extends { createdAt?: string; timestamp?: Date }>(
    items: T[],
    getDate: (item: T) => Date,
): Array<{ label: string; items: T[] }> {
    const groups: Map<string, T[]> = new Map();
    for (const item of items) {
        const label = formatDateLabel(getDate(item));
        const existing = groups.get(label);
        if (existing) {
            existing.push(item);
        } else {
            groups.set(label, [item]);
        }
    }
    return Array.from(groups.entries()).map(([label, grpItems]) => ({ label, items: grpItems }));
}

// ── Inline markdown renderer ──────────────────────────────────────────────────

const HEADING_TAGS = ["h3", "h4", "h5"] as const;

function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split("\n");
    const nodes: React.ReactNode[] = [];
    let listBuffer: React.ReactNode[] = [];
    let listType: "ul" | "ol" | null = null;

    function flushList() {
        if (listBuffer.length === 0) return;
        const key = `list-${nodes.length}`;
        if (listType === "ul") {
            nodes.push(
                <ul key={key} className="my-1 list-disc pl-5 space-y-0.5">{listBuffer}</ul>,
            );
        } else {
            nodes.push(
                <ol key={key} className="my-1 list-decimal pl-5 space-y-0.5">{listBuffer}</ol>,
            );
        }
        listBuffer = [];
        listType = null;
    }

    function inlineFormat(raw: string, keyPrefix: string): React.ReactNode {
        const parts: React.ReactNode[] = [];
        const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
        let last = 0;
        let match: RegExpExecArray | null;
        let idx = 0;
        while ((match = regex.exec(raw)) !== null) {
            if (match.index > last) parts.push(raw.slice(last, match.index));
            if (match[2] !== undefined)
                parts.push(<strong key={`${keyPrefix}-b-${idx}`}>{match[2]}</strong>);
            else if (match[3] !== undefined)
                parts.push(<em key={`${keyPrefix}-i-${idx}`}>{match[3]}</em>);
            else if (match[4] !== undefined)
                parts.push(
                    <code key={`${keyPrefix}-c-${idx}`}
                        className="rounded bg-[#f0ebe2] px-1 py-0.5 font-mono text-xs text-[#7a4f1e]">
                        {match[4]}
                    </code>,
                );
            last = match.index + match[0].length;
            idx++;
        }
        if (last < raw.length) parts.push(raw.slice(last));
        return parts.length === 1 ? parts[0] : parts;
    }

    lines.forEach((line, lineIdx) => {
        const key = `line-${lineIdx}`;
        const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headingMatch) {
            flushList();
            const HeadingTag = HEADING_TAGS[headingMatch[1].length - 1];
            nodes.push(
                <HeadingTag key={key} className="mt-2 font-semibold text-[#2f2a25]">
                    {inlineFormat(headingMatch[2], key)}
                </HeadingTag>,
            );
            return;
        }
        const ulMatch = line.match(/^[-*]\s+(.+)/);
        if (ulMatch) {
            if (listType !== "ul") { flushList(); listType = "ul"; }
            listBuffer.push(<li key={key} className="text-sm leading-6">{inlineFormat(ulMatch[1], key)}</li>);
            return;
        }
        const olMatch = line.match(/^\d+\.\s+(.+)/);
        if (olMatch) {
            if (listType !== "ol") { flushList(); listType = "ol"; }
            listBuffer.push(<li key={key} className="text-sm leading-6">{inlineFormat(olMatch[1], key)}</li>);
            return;
        }
        flushList();
        if (line.trim() === "") {
            nodes.push(<div key={key} className="h-2" />);
            return;
        }
        nodes.push(<p key={key} className="text-sm leading-6">{inlineFormat(line, key)}</p>);
    });

    flushList();
    return nodes;
}

// ── Date separator ────────────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 py-2">
            <div className="flex-1 border-t border-[#e4ddd3]" />
            <span className="rounded-full bg-[#ece7df] px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#a99f94]">
                {label}
            </span>
            <div className="flex-1 border-t border-[#e4ddd3]" />
        </div>
    );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
    role,
    text,
    time,
    streaming,
}: {
    role: "assistant" | "user";
    text: string;
    time: string;
    streaming?: boolean;
}) {
    const isAssistant = role === "assistant";
    return (
        <div className={`flex flex-col gap-0.5 ${isAssistant ? "items-start" : "items-end"}`}>
            <div
                className={
                    isAssistant
                        ? "max-w-[88%] rounded-lg border border-[#e3dbcf] bg-white px-4 py-3 text-sm text-[#3f3831]"
                        : "max-w-[82%] rounded-lg bg-[#9f6207] px-4 py-3 text-sm text-white"
                }
            >
                {isAssistant ? (
                    <div className="prose-sm">
                        {text
                            ? renderMarkdown(text)
                            : streaming && (
                                <span className="inline-block h-4 w-1 animate-pulse rounded bg-[#b8a48e]" />
                            )}
                    </div>
                ) : (
                    <span className="whitespace-pre-wrap leading-6">{text}</span>
                )}
            </div>
            <span className={`text-[10px] text-[#b0a79c] ${isAssistant ? "pl-1" : "pr-1"}`}>
                {time}
            </span>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

const WELCOME_MESSAGE = "Hi, I'm **Nova AI**.\n\nI can help you search, summarize, and extract insights from this document.\n\nWhat would you like to know?";

export default function DocumentChatWindow({ document, onClose }: DocumentChatWindowProps) {
    const queryClient = useQueryClient();
    const historyKey = queryKeys.documentChat.history(document.id);

    const [activeTab, setActiveTab] = useState<Tab>("chat");
    const [chatDraft, setChatDraft] = useState("");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: "welcome", role: "assistant", text: WELCOME_MESSAGE, timestamp: new Date() },
    ]);
    const [busy, setBusy] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const historyBottomRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Fetch history with React Query — cached for 5 min, only runs when History tab is active.
    const { data: historyData, isFetching: historyLoading } = useQuery<HistoryMessage[]>({
        queryKey: historyKey,
        queryFn: async () => {
            const token = getAccessToken();
            const res = await fetch(`${API_BASE_URL}/ai/chat/${document.id}/history`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error("Failed to load history");
            const json = await res.json();
            return json.data ?? [];
        },
        staleTime: 5 * 60 * 1000,   // cached for 5 minutes — tab clicks won't re-fetch
        gcTime: 10 * 60 * 1000,      // keep in memory for 10 minutes after unmount
        enabled: activeTab === "history",
        retry: false,
    });
    const history = historyData ?? [];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    useEffect(() => {
        historyBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    function handleTabChange(tab: Tab) {
        setActiveTab(tab);
    }

    async function sendMessage(query: string) {
        if (!query.trim() || busy) return;

        const userMsgId = `${Date.now()}-u`;
        const assistantMsgId = `${Date.now()}-a`;
        const now = new Date();

        setChatMessages((prev) => [
            ...prev,
            { id: userMsgId, role: "user", text: query, timestamp: now },
            { id: assistantMsgId, role: "assistant", text: "", timestamp: new Date(), streaming: true },
        ]);
        setBusy(true);
        setChatDraft("");
        abortRef.current = new AbortController();

        try {
            const token = getAccessToken();
            const response = await fetch(`${API_BASE_URL}/ai/chat/${document.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ query }),
                signal: abortRef.current.signal,
            });

            if (!response.ok || !response.body) throw new Error(`Request failed: ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const raw = line.slice(6).trim();
                    if (!raw) continue;
                    let payload: { token?: string; done?: boolean; error?: string };
                    try { payload = JSON.parse(raw); } catch { continue; }

                    if (payload.error) {
                        accumulated = `Sorry, something went wrong: ${payload.error}`;
                        setChatMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantMsgId ? { ...m, text: accumulated, streaming: false } : m,
                            ),
                        );
                        break;
                    }
                    if (payload.token) {
                        accumulated += payload.token;
                        setChatMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantMsgId ? { ...m, text: accumulated } : m,
                            ),
                        );
                    }
                    if (payload.done) {
                        setChatMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantMsgId ? { ...m, streaming: false } : m,
                            ),
                        );
                        // Append the new exchange to the cached history so the
                        // History tab is always up to date without a network call.
                        const assistantText = accumulated;
                        queryClient.setQueryData<HistoryMessage[]>(historyKey, (prev) => [
                            ...(prev ?? []),
                            {
                                uuid: userMsgId,
                                role: "user",
                                content: query,
                                createdAt: now.toISOString(),
                            },
                            {
                                uuid: assistantMsgId,
                                role: "assistant",
                                content: assistantText,
                                createdAt: new Date().toISOString(),
                            },
                        ]);
                    }
                }
            }
        } catch (err) {
            if ((err as Error).name === "AbortError") return;
            setChatMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMsgId
                        ? { ...m, text: "Sorry, I couldn't process that request. Please try again.", streaming: false }
                        : m,
                ),
            );
        } finally {
            setBusy(false);
            abortRef.current = null;
            setChatMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m)),
            );
        }
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        sendMessage(chatDraft.trim());
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(chatDraft.trim());
        }
    }

    // Group current chat messages by date
    const chatGroups = groupByDate(chatMessages, (m) => m.timestamp);

    // Group history messages by date
    const historyGroups = groupByDate(
        history,
        (m) => new Date(m.createdAt),
    );

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-[#1f1a14]/30"
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-chat-title"
        >
            <div className="flex h-full w-full max-w-[440px] flex-col border-l border-[#ded6ca] bg-[#fbf8f2] shadow-2xl">

                {/* Header */}
                <header className="flex min-h-16 items-center justify-between gap-4 border-b border-[#e4ddd3] bg-[#f3f0ea] px-5">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a99f94]">
                            Chat with document
                        </p>
                        <h2
                            id="document-chat-title"
                            className="mt-1 truncate text-base font-semibold text-[#2f2a25]"
                            title={document.title}
                        >
                            {document.title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        title="Close chat"
                        aria-label="Close chat"
                        onClick={() => { abortRef.current?.abort(); onClose(); }}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#7a7066] hover:bg-[#e9e1d6] hover:text-[#3f3831]"
                    >
                        <X size={18} strokeWidth={2} aria-hidden="true" />
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex border-b border-[#e4ddd3] bg-[#f3f0ea]">
                    {(["chat", "history"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => handleTabChange(tab)}
                            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                                activeTab === tab
                                    ? "border-b-2 border-[#9f6207] text-[#9f6207]"
                                    : "text-[#a99f94] hover:text-[#6a6259]"
                            }`}
                        >
                            {tab === "history" ? (
                                <span className="flex items-center justify-center gap-1.5">
                                    <Clock size={12} aria-hidden="true" />
                                    History
                                </span>
                            ) : "Chat"}
                        </button>
                    ))}
                </div>

                {/* Chat Tab */}
                {activeTab === "chat" && (
                    <>
                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            <div className="space-y-1">
                                {chatGroups.map(({ label, items }) => (
                                    <div key={label}>
                                        <DateSeparator label={label} />
                                        <div className="space-y-3">
                                            {items.map((msg) => (
                                                <MessageBubble
                                                    key={msg.id}
                                                    role={msg.role}
                                                    text={msg.text}
                                                    time={formatTime(msg.timestamp)}
                                                    streaming={msg.streaming}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div ref={bottomRef} />
                        </div>

                        <form onSubmit={handleSubmit} className="border-t border-[#e4ddd3] bg-[#f3f0ea] p-4">
                            <div className="flex items-end gap-3 rounded-lg border border-[#d9d0c3] bg-white p-2">
                                <textarea
                                    value={chatDraft}
                                    onChange={(e) => setChatDraft(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask a question… (Enter to send)"
                                    rows={2}
                                    disabled={busy}
                                    className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#2f2a25] outline-none placeholder:text-[#aa9f94] disabled:opacity-60"
                                />
                                <button
                                    type="submit"
                                    title="Send message"
                                    disabled={!chatDraft.trim() || busy}
                                    className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#9f6207] text-white disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    {busy
                                        ? <Loader2 size={17} strokeWidth={2} className="animate-spin" aria-hidden="true" />
                                        : <Send size={17} strokeWidth={2} aria-hidden="true" />
                                    }
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* History Tab */}
                {activeTab === "history" && (
                    <div className="flex-1 overflow-y-auto px-5 py-5">
                        {historyLoading && (
                            <div className="space-y-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                                        <div className="h-12 w-48 animate-pulse rounded-lg bg-[#ece7df]" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!historyLoading && history.length === 0 && (
                            <div className="flex flex-col items-center justify-center gap-2 pt-16 text-center">
                                <Clock size={32} strokeWidth={1.5} className="text-[#c9bfb4]" />
                                <p className="text-sm text-[#a99f94]">No chat history yet.</p>
                                <p className="text-xs text-[#c2b8ae]">Your conversations will appear here.</p>
                            </div>
                        )}

                        {!historyLoading && historyGroups.length > 0 && (
                            <div className="space-y-1">
                                {historyGroups.map(({ label, items }) => (
                                    <div key={label}>
                                        <DateSeparator label={label} />
                                        <div className="space-y-3">
                                            {items.map((msg) => (
                                                <MessageBubble
                                                    key={msg.uuid}
                                                    role={msg.role as "assistant" | "user"}
                                                    text={msg.content}
                                                    time={formatTime(new Date(msg.createdAt))}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div ref={historyBottomRef} />
                    </div>
                )}
            </div>
        </div>
    );
}
