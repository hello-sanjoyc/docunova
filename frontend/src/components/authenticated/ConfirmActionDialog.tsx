"use client";

interface ConfirmActionDialogProps {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    confirmClassName?: string;
    loading?: boolean;
    error?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmActionDialog({
    title,
    message,
    confirmLabel,
    cancelLabel = "Cancel",
    confirmClassName = "bg-[#c61b1b] text-white",
    loading = false,
    error = "",
    onConfirm,
    onCancel,
}: ConfirmActionDialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm space-y-4 rounded-2xl border border-[#ddd5cb] bg-[#f7f3ed] p-6 shadow-xl">
                <h3 className="text-base font-semibold text-[#c61b1b]">
                    {title}
                </h3>
                <p className="text-sm leading-relaxed text-[#5d554c]">
                    {message}
                </p>
                {error && <p className="text-xs text-[#c61b1b]">{error}</p>}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 ${confirmClassName}`}
                    >
                        {loading ? "Please wait..." : confirmLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 rounded-lg border border-[#d8cfc4] py-2 text-sm text-[#6a6259] hover:text-[#2f2b27]"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
