"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Send, X, Loader2 } from "lucide-react";
import type { DocumentItem } from "@/lib/api/documents";
import { API_BASE_URL } from "@/lib/api/client";
import { getAccessToken } from "@/lib/api/session";

const WELCOME_MESSAGE =
    "Hi, I'm **Nova AI**.\n\nI can help you search, summarize, and extract insights from this document.\n\nWhat would you like to know?";
const HEADING_TAGS = ["h3", "h4", "h5"] as const;

type ChatMessage = {
    id: string;
    role: "assistant" | "user";
    text: string;
    streaming?: boolean;
};

type DocumentChatWindowProps = {
    document: DocumentItem;
    onClose: () => void;
};

// ── Inline markdown renderer ──────────────────────────────────────────────────
// Handles: **bold**, *italic*, `code`, headings (#), bullet lists (- / *), numbered lists, line breaks.

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
                <ul key={key} className="my-1 list-disc pl-5 space-y-0.5">
                    {listBuffer}
                </ul>,
            );
        } else {
            nodes.push(
                <ol key={key} className="my-1 list-decimal pl-5 space-y-0.5">
                    {listBuffer}
                </ol>,
            );
        }
        listBuffer = [];
        listType = null;
    }

    function inlineFormat(raw: string, keyPrefix: string): React.ReactNode {
        // Process **bold**, *italic*, `code` inline
        const parts: React.ReactNode[] = [];
        const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
        let last = 0;
        let match: RegExpExecArray | null;
        let idx = 0;

        while ((match = regex.exec(raw)) !== null) {
            if (match.index > last) {
                parts.push(raw.slice(last, match.index));
            }
            if (match[2] !== undefined) {
                parts.push(<strong key={`${keyPrefix}-b-${idx}`}>{match[2]}</strong>);
            } else if (match[3] !== undefined) {
                parts.push(<em key={`${keyPrefix}-i-${idx}`}>{match[3]}</em>);
            } else if (match[4] !== undefined) {
                parts.push(
                    <code
                        key={`${keyPrefix}-c-${idx}`}
                        className="rounded bg-[#f0ebe2] px-1 py-0.5 font-mono text-xs text-[#7a4f1e]"
                    >
                        {match[4]}
                    </code>,
                );
            }
            last = match.index + match[0].length;
            idx++;
        }
        if (last < raw.length) parts.push(raw.slice(last));
        return parts.length === 1 ? parts[0] : parts;
    }

    lines.forEach((line, lineIdx) => {
        const key = `line-${lineIdx}`;

        // Heading
        const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            const HeadingTag = HEADING_TAGS[level - 1];
            nodes.push(
                <HeadingTag key={key} className="mt-2 font-semibold text-[#2f2a25]">
                    {inlineFormat(headingMatch[2], key)}
                </HeadingTag>,
            );
            return;
        }

        // Unordered list item
        const ulMatch = line.match(/^[\-\*]\s+(.+)/);
        if (ulMatch) {
            if (listType !== "ul") { flushList(); listType = "ul"; }
            listBuffer.push(
                <li key={key} className="text-sm leading-6">
                    {inlineFormat(ulMatch[1], key)}
                </li>,
            );
            return;
        }

        // Ordered list item
        const olMatch = line.match(/^\d+\.\s+(.+)/);
        if (olMatch) {
            if (listType !== "ol") { flushList(); listType = "ol"; }
            listBuffer.push(
                <li key={key} className="text-sm leading-6">
                    {inlineFormat(olMatch[1], key)}
                </li>,
            );
            return;
        }

        flushList();

        // Empty line → spacer
        if (line.trim() === "") {
            nodes.push(<div key={key} className="h-2" />);
            return;
        }

        // Regular paragraph
        nodes.push(
            <p key={key} className="text-sm leading-6">
                {inlineFormat(line, key)}
            </p>,
        );
    });

    flushList();
    return nodes;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocumentChatWindow({
    document,
    onClose,
}: DocumentChatWindowProps) {
    const [chatDraft, setChatDraft] = useState("");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: "welcome", role: "assistant", text: WELCOME_MESSAGE },
    ]);
    const [busy, setBusy] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    async function sendMessage(query: string) {
        if (!query.trim() || busy) return;

        const userMsgId = `${Date.now()}-u`;
        const assistantMsgId = `${Date.now()}-a`;

        setChatMessages((prev) => [
            ...prev,
            { id: userMsgId, role: "user", text: query },
            { id: assistantMsgId, role: "assistant", text: "", streaming: true },
        ]);
        setBusy(true);
        setChatDraft("");

        abortRef.current = new AbortController();

        try {
            const token = getAccessToken();
            const response = await fetch(
                `${API_BASE_URL}/ai/chat/${document.id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ query }),
                    signal: abortRef.current.signal,
                },
            );

            if (!response.ok || !response.body) {
                throw new Error(`Request failed: ${response.status}`);
            }

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
                    try {
                        payload = JSON.parse(raw);
                    } catch {
                        continue;
                    }

                    if (payload.error) {
                        accumulated = `Sorry, something went wrong: ${payload.error}`;
                        setChatMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantMsgId
                                    ? { ...m, text: accumulated, streaming: false }
                                    : m,
                            ),
                        );
                        break;
                    }

                    if (payload.token) {
                        accumulated += payload.token;
                        setChatMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantMsgId
                                    ? { ...m, text: accumulated }
                                    : m,
                            ),
                        );
                    }

                    if (payload.done) {
                        setChatMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantMsgId
                                    ? { ...m, streaming: false }
                                    : m,
                            ),
                        );
                    }
                }
            }
        } catch (err) {
            if ((err as Error).name === "AbortError") return;
            const errorText = `Sorry, I couldn't process that request. Please try again.`;
            setChatMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMsgId
                        ? { ...m, text: errorText, streaming: false }
                        : m,
                ),
            );
        } finally {
            setBusy(false);
            abortRef.current = null;
            // Ensure streaming flag cleared
            setChatMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, streaming: false } : m,
                ),
            );
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        sendMessage(chatDraft.trim());
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage(chatDraft.trim());
        }
    }

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
                        onClick={() => {
                            abortRef.current?.abort();
                            onClose();
                        }}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#7a7066] hover:bg-[#e9e1d6] hover:text-[#3f3831]"
                    >
                        <X size={18} strokeWidth={2} aria-hidden="true" />
                    </button>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                    <div className="space-y-4">
                        {chatMessages.map((message) => (
                            <div
                                key={message.id}
                                className={
                                    message.role === "assistant"
                                        ? "mr-auto max-w-[88%] rounded-lg border border-[#e3dbcf] bg-white px-4 py-3 text-sm text-[#3f3831]"
                                        : "ml-auto max-w-[82%] whitespace-pre-wrap rounded-lg bg-[#9f6207] px-4 py-3 text-sm leading-6 text-white"
                                }
                            >
                                {message.role === "assistant" ? (
                                    <div className="prose-sm">
                                        {message.text
                                            ? renderMarkdown(message.text)
                                            : message.streaming && (
                                                  <span className="inline-block h-4 w-1 animate-pulse rounded bg-[#b8a48e]" />
                                              )}
                                    </div>
                                ) : (
                                    message.text
                                )}
                            </div>
                        ))}
                    </div>
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    className="border-t border-[#e4ddd3] bg-[#f3f0ea] p-4"
                >
                    <div className="flex items-end gap-3 rounded-lg border border-[#d9d0c3] bg-white p-2">
                        <textarea
                            value={chatDraft}
                            onChange={(e) => setChatDraft(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
                            rows={2}
                            disabled={busy}
                            className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#2f2a25] outline-none placeholder:text-[#aa9f94] disabled:opacity-60"
                        />
                        <button
                            type="submit"
                            title="Send message"
                            aria-label="Send message"
                            disabled={!chatDraft.trim() || busy}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#9f6207] text-white disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            {busy ? (
                                <Loader2
                                    size={17}
                                    strokeWidth={2}
                                    className="animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Send size={17} strokeWidth={2} aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
