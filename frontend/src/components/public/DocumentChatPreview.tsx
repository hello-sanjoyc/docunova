import { ArrowRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

const PROMPTS = ["Payment terms?", "Data ownership?", "Liability cap?"];

export default function DocumentChatPreview() {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-amber-light bg-cream p-5 shadow-[0_8px_40px_rgba(15,14,12,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,133,42,0.14),transparent_34%),linear-gradient(180deg,rgba(247,244,238,0.64),rgba(255,253,248,0))]" />

            <div className="relative">
                <div className="mb-7 flex items-center gap-3">
                    <span className="rounded-full bg-amber px-3 py-1 text-[11px] font-semibold uppercase text-cream">
                        New
                    </span>
                    <div>
                        <div className="flex items-center gap-2 text-lg font-semibold text-ink">
                            AI-powered document chat
                            <Sparkles size={17} className="text-amber" />
                        </div>
                        <p className="mt-1 text-sm text-muted">
                            Ask anything. Get answers with citations.
                        </p>
                    </div>
                </div>

                <div className="space-y-5">
                    <QuestionBubble>
                        What happens if we terminate early?
                    </QuestionBubble>
                    <AnswerBubble citation="§ 9.2 Termination, p. 7">
                        Early termination is allowed for material breach with 30
                        days written notice.
                    </AnswerBubble>
                    <QuestionBubble>
                        Are there any automatic renewals?
                    </QuestionBubble>
                    <AnswerBubble citation="§ 11.1 Term & Renewal, p. 9">
                        Yes. The agreement auto-renews for 12-month terms unless
                        either party gives 60 days&apos; notice before the end date.
                    </AnswerBubble>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                    {PROMPTS.map((prompt) => (
                        <span
                            key={prompt}
                            className="rounded-full border border-border bg-cream px-3 py-2 text-xs font-medium text-muted shadow-sm"
                        >
                            {prompt}
                        </span>
                    ))}
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
                    <span className="min-w-0 flex-1 truncate text-sm text-muted">
                        Ask a question about this document...
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber text-cream">
                        <ArrowRight size={18} />
                    </span>
                </div>
            </div>
        </div>
    );
}

function QuestionBubble({ children }: { children: ReactNode }) {
    return (
        <div className="ml-auto w-fit max-w-[78%] rounded-2xl bg-amber-light px-5 py-3 text-sm font-medium text-ink">
            {children}
        </div>
    );
}

function AnswerBubble({
    children,
    citation,
}: {
    children: ReactNode;
    citation: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-white">
                <span className="h-3 w-3 rounded-full border-2 border-amber border-t-sage" />
            </div>
            <div className="rounded-xl border border-border bg-white px-5 py-4 shadow-sm">
                <p className="text-sm leading-relaxed text-ink">{children}</p>
                <p className="mt-3 text-xs font-medium text-muted">
                    {citation}
                </p>
            </div>
        </div>
    );
}
