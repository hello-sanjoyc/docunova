"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    ChevronRight,
    KeyRound,
    Laptop,
    Monitor,
    ScrollText,
    ShieldCheck,
    Smartphone,
} from "lucide-react";
import {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getSessions,
    getAccessLogs,
    revokeSession,
    uploadAvatar,
    updateNotificationPreferences,
    type AccessLog,
    type UserProfile,
    type UserSession,
    type UpdateProfileRequest,
} from "@/lib/api/user";
import { clearAuthSession } from "@/lib/api/session";
import { formatApiError } from "@/lib/api/errors";
import { useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";
import {
    enable2FA,
    verify2FA,
    disable2FA,
    type TwoFactorSetupResult,
} from "@/lib/api/twoFactor";

function formatDate(iso: string | null | undefined) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatRelative(iso: string | null | undefined) {
    if (!iso) return "Recently";
    const value = new Date(iso).getTime();
    if (Number.isNaN(value)) return "Recently";

    const diff = Date.now() - value;
    const mins = Math.round(diff / 60000);
    if (mins < 2) return "Active now";
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.round(hours / 24);
    return `${days} days ago`;
}

function sessionTitle(session: UserSession) {
    return (
        session.deviceName ||
        session.deviceType ||
        session.userAgent ||
        "Unknown device"
    );
}

function sessionSubTitle(session: UserSession) {
    const client =
        [session.browser, session.os].filter(Boolean).join(" ") ||
        "Unknown client";
    return `${client} • ${formatRelative(session.lastSeenAt)}`;
}

function accessLogTitle(log: AccessLog) {
    return (
        log.deviceName || log.deviceType || log.userAgent || "Unknown device"
    );
}

function accessLogSubTitle(log: AccessLog) {
    const client =
        [log.browser, log.os].filter(Boolean).join(" ") || "Unknown client";
    return `${client} • ${formatDate(log.createdAt)}`;
}

function SessionIcon({ session }: { session: UserSession }) {
    const hay =
        `${session.deviceType || ""} ${session.userAgent || ""}`.toLowerCase();

    if (
        hay.includes("iphone") ||
        hay.includes("android") ||
        hay.includes("mobile")
    ) {
        return <Smartphone size={20} strokeWidth={2} aria-hidden="true" />;
    }

    if (hay.includes("mac") || hay.includes("laptop")) {
        return <Laptop size={20} strokeWidth={2} aria-hidden="true" />;
    }

    return <Monitor size={20} strokeWidth={2} aria-hidden="true" />;
}

function ToggleRow({
    title,
    subtitle,
    enabled,
    onToggle,
    disabled = false,
}: {
    title: string;
    subtitle: string;
    enabled: boolean;
    onToggle: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 pr-2">
                <p className="text-[18px] leading-none font-medium text-[#2f2a25]">
                    {title}
                </p>
                <p className="text-sm text-[#61584f] leading-tight mt-1">
                    {subtitle}
                </p>
            </div>
            <button
                type="button"
                onClick={onToggle}
                disabled={disabled}
                className={`shrink-0 h-[24px] w-[46px] rounded-full border p-[2px] transition-colors ${
                    enabled
                        ? "bg-[#a85f00] border-[#a85f00]"
                        : "bg-[#d7d2cb] border-[#cfc8bf]"
                } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                aria-pressed={enabled}
                aria-label={title}
            >
                <span
                    className={`block h-[16px] w-[16px] rounded-full bg-white border border-[#e7e2da] transition-transform ${
                        enabled ? "translate-x-[22px]" : "translate-x-0"
                    }`}
                />
            </button>
        </div>
    );
}

interface EditFormProps {
    profile: UserProfile;
    canManageRoleAndOrganization: boolean;
    onSave: (updated: UserProfile) => void;
    onCancel: () => void;
}

function EditProfileForm({
    profile,
    canManageRoleAndOrganization,
    onSave,
    onCancel,
}: EditFormProps) {
    const [form, setForm] = useState<UpdateProfileRequest>({
        name:
            profile.name ||
            `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
        phone: profile.phone ?? "",
        roleCode: profile.roleCode ?? "",
        organizationName: profile.organizationName ?? "",
    });
    const [error, setError] = useState("");
    const [pending, startTransition] = useTransition();

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        startTransition(async () => {
            try {
                const updated = await updateProfile({
                    name: form.name || undefined,
                    phone: form.phone || undefined,
                    ...(canManageRoleAndOrganization
                        ? {
                              roleCode: form.roleCode || undefined,
                              organizationName:
                                  form.organizationName || undefined,
                          }
                        : {}),
                });
                onSave(updated);
            } catch (err) {
                setError(formatApiError(err));
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
                <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.22em]">
                    Email address
                </span>
                <input
                    value={profile.email}
                    disabled
                    className="w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-sm bg-[#efebe4] text-[#6c645c] cursor-not-allowed"
                />
            </label>
            <label className="block">
                <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.22em]">
                    Full name
                </span>
                <input
                    name="name"
                    value={form.name ?? ""}
                    onChange={handleChange}
                    className="w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-sm bg-[#f9f7f3] focus:outline-none focus:ring-1 focus:ring-[#352f2a]"
                />
            </label>
            <label className="block">
                <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.22em]">
                    Role
                </span>
                <select
                    name="roleCode"
                    value={form.roleCode ?? ""}
                    onChange={(e) =>
                        setForm((prev) => ({
                            ...prev,
                            roleCode: e.target.value,
                        }))
                    }
                    disabled={!canManageRoleAndOrganization}
                    className={`w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-sm ${
                        canManageRoleAndOrganization
                            ? "bg-[#f9f7f3] focus:outline-none focus:ring-1 focus:ring-[#352f2a]"
                            : "bg-[#efebe4] text-[#6c645c] cursor-not-allowed"
                    }`}
                >
                    {profile.roleCode?.toLowerCase() === "superadmin" && (
                        <option value="superadmin">Super Admin</option>
                    )}
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                </select>
            </label>
            <label className="block">
                <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.22em]">
                    Organization
                </span>
                <input
                    name="organizationName"
                    value={form.organizationName ?? ""}
                    onChange={handleChange}
                    disabled={!canManageRoleAndOrganization}
                    className={`w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-sm ${
                        canManageRoleAndOrganization
                            ? "bg-[#f9f7f3] focus:outline-none focus:ring-1 focus:ring-[#352f2a]"
                            : "bg-[#efebe4] text-[#6c645c] cursor-not-allowed"
                    }`}
                />
            </label>
            <label className="block">
                <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.22em]">
                    Phone
                </span>
                <input
                    name="phone"
                    value={form.phone ?? ""}
                    onChange={handleChange}
                    placeholder="+1 555 000 0000"
                    className="w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-sm bg-[#f9f7f3] focus:outline-none focus:ring-1 focus:ring-[#352f2a]"
                />
            </label>

            {error && <p className="text-xs text-[#c61b1b]">{error}</p>}

            <div className="flex gap-3 pt-1">
                <button
                    type="submit"
                    disabled={pending}
                    className="px-4 py-2 rounded-xl bg-[#2f2b27] text-[#f8f5ef] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    {pending ? "Saving..." : "Save changes"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded-xl border border-[#ddd6ce] text-sm text-[#6c645c] hover:text-[#2f2b27] transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

interface DeleteModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
    error: string;
}

function DeleteAccountModal({
    onConfirm,
    onCancel,
    loading,
    error,
}: DeleteModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#f7f3ed] rounded-2xl border border-[#ddd5cb] max-w-sm w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-semibold text-[#c61b1b]">
                    Delete account
                </h3>
                <p className="text-sm text-[#5d554c] leading-relaxed">
                    This will permanently delete your account and all associated
                    data. This action cannot be undone.
                </p>
                {error && <p className="text-xs text-[#c61b1b]">{error}</p>}
                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg bg-[#c61b1b] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? "Deleting..." : "Yes, delete"}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg border border-[#d8cfc4] text-sm text-[#6a6259] hover:text-[#2f2b27]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ChangePasswordModalProps {
    onSubmit: (payload: {
        currentPassword: string;
        newPassword: string;
    }) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    error: string;
}

function ChangePasswordModal({
    onSubmit,
    onCancel,
    loading,
    error,
}: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validationError, setValidationError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setValidationError("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setValidationError("All password fields are required.");
            return;
        }
        if (newPassword.length < 8) {
            setValidationError("New password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setValidationError(
                "New password and confirm password do not match.",
            );
            return;
        }
        if (currentPassword === newPassword) {
            setValidationError(
                "New password must be different from current password.",
            );
            return;
        }

        await onSubmit({ currentPassword, newPassword });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#f7f3ed] rounded-2xl border border-[#ddd5cb] max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-semibold text-[#2f2b27]">
                    Change password
                </h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.18em]">
                            Current password
                        </span>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                            className="w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-sm bg-[#f9f7f3] focus:outline-none focus:ring-1 focus:ring-[#352f2a]"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.18em]">
                            New password
                        </span>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                            className="w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-sm bg-[#f9f7f3] focus:outline-none focus:ring-1 focus:ring-[#352f2a]"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.18em]">
                            Confirm new password
                        </span>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            className="w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-sm bg-[#f9f7f3] focus:outline-none focus:ring-1 focus:ring-[#352f2a]"
                        />
                    </label>

                    {(validationError || error) && (
                        <p className="text-xs text-[#c61b1b]">
                            {validationError || error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 rounded-lg bg-[#2f2b27] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? "Updating..." : "Update password"}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 py-2 rounded-lg border border-[#d8cfc4] text-sm text-[#6a6259] hover:text-[#2f2b27] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface AccessLogsModalProps {
    logs: AccessLog[];
    loading: boolean;
    error: string;
    page: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onClose: () => void;
}

function AccessLogsModal({
    logs,
    loading,
    error,
    page,
    total,
    totalPages,
    onPageChange,
    onClose,
}: AccessLogsModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#f7f3ed] rounded-2xl border border-[#ddd5cb] w-full max-w-2xl p-6 space-y-4 shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-semibold text-[#2f2b27]">
                        Access logs
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-[#6a6259] hover:text-[#2f2b27]"
                    >
                        Close
                    </button>
                </div>

                {error && <p className="text-xs text-[#c61b1b]">{error}</p>}

                <div className="min-h-[220px] overflow-auto rounded-xl border border-[#e7e2db] bg-[#fbf9f5]">
                    {loading ? (
                        <div className="p-4 text-sm text-[#6a6259]">
                            Loading access logs...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-4 text-sm text-[#6a6259]">
                            No access logs found.
                        </div>
                    ) : (
                        <ul className="divide-y divide-[#e7e2db]">
                            {logs.map((log) => (
                                <li key={log.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[#1f1c19] truncate">
                                                {accessLogTitle(log)}
                                            </p>
                                            <p className="text-xs text-[#5f564d] truncate mt-0.5">
                                                {accessLogSubTitle(log)}
                                            </p>
                                            <p className="text-xs text-[#8a8074] mt-1">
                                                {log.endedAt
                                                    ? `Ended ${formatDate(log.endedAt)}`
                                                    : "Session still active"}
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
                                                log.status === "ACTIVE"
                                                    ? "bg-[#d6eed7] text-[#234e25]"
                                                    : log.status === "REVOKED"
                                                      ? "bg-[#f5d5cf] text-[#7f2216]"
                                                      : "bg-[#ece5d9] text-[#584b37]"
                                            }`}
                                        >
                                            {log.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex items-center justify-between text-sm text-[#8a8074]">
                    <p>
                        Page {page} of {Math.max(1, totalPages)} • {total} total
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            disabled={page <= 1 || loading}
                            className="disabled:opacity-50 hover:text-[#5f564d]"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                onPageChange(Math.min(totalPages, page + 1))
                            }
                            disabled={page >= totalPages || loading}
                            className="disabled:opacity-50 hover:text-[#5f564d]"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface TwoFactorSetupModalProps {
    setup: TwoFactorSetupResult;
    onVerify: (code: string) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    error: string;
}

function TwoFactorSetupModal({
    setup,
    onVerify,
    onCancel,
    loading,
    error,
}: TwoFactorSetupModalProps) {
    const [code, setCode] = useState("");
    const [validationError, setValidationError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setValidationError("");

        if (!/^\d{6}$/.test(code)) {
            setValidationError("Enter a valid 6-digit code.");
            return;
        }

        await onVerify(code);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#f7f3ed] rounded-2xl border border-[#ddd5cb] max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-semibold text-[#2f2b27]">
                    Set up two-factor authentication
                </h3>
                <p className="text-sm text-[#5d554c]">
                    Scan the QR code in your authenticator app, then enter the
                    6-digit code.
                </p>

                <div className="rounded-xl border border-[#e2dbd1] bg-white p-3 flex items-center justify-center">
                    <Image
                        src={setup.qrCodeDataUrl}
                        alt="2FA QR code"
                        width={176}
                        height={176}
                        className="h-44 w-44"
                        unoptimized
                    />
                </div>

                <div className="rounded-xl border border-[#e7e2db] bg-[#f9f7f3] px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#6c645c]">
                        Manual setup key
                    </p>
                    <p className="mt-1 text-sm text-[#2f2b27] font-mono break-all">
                        {setup.secret}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.18em]">
                            Verification code
                        </span>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) => {
                                setCode(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 6),
                                );
                            }}
                            placeholder="000000"
                            className="w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-base tracking-[0.32em] text-center font-mono bg-[#f9f7f3] focus:outline-none focus:ring-1 focus:ring-[#352f2a]"
                        />
                    </label>

                    {(validationError || error) && (
                        <p className="text-xs text-[#c61b1b]">
                            {validationError || error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 rounded-lg bg-[#2f2b27] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Verify and enable"}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 py-2 rounded-lg border border-[#d8cfc4] text-sm text-[#6a6259] hover:text-[#2f2b27] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface AvatarEditorModalProps {
    file: File;
    onCancel: () => void;
    onSave: (croppedFile: File) => Promise<void>;
    saving: boolean;
    error: string;
}

function AvatarEditorModal({
    file,
    onCancel,
    onSave,
    saving,
    error,
}: AvatarEditorModalProps) {
    const DEFAULT_ZOOM = 1.2;
    const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [validationError, setValidationError] = useState("");
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const computeCropRect = useCallback((image: HTMLImageElement) => {
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        const sourceSize = Math.min(sourceWidth, sourceHeight) / zoom;
        const baseCenterX = sourceWidth / 2;
        const baseCenterY = sourceHeight / 2;
        const maxShiftX = Math.max(0, (sourceWidth - sourceSize) / 2);
        const maxShiftY = Math.max(0, (sourceHeight - sourceSize) / 2);
        const centerX = Math.min(
            sourceWidth - sourceSize / 2,
            Math.max(
                sourceSize / 2,
                baseCenterX + (offsetX / 100) * maxShiftX,
            ),
        );
        const centerY = Math.min(
            sourceHeight - sourceSize / 2,
            Math.max(
                sourceSize / 2,
                baseCenterY + (offsetY / 100) * maxShiftY,
            ),
        );

        return {
            sx: centerX - sourceSize / 2,
            sy: centerY - sourceSize / 2,
            sourceSize,
        };
    }, [zoom, offsetX, offsetY]);

    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);

        const img = new Image();
        img.onload = () => {
            setImageEl(img);
            setZoom(DEFAULT_ZOOM);
            setOffsetX(0);
            setOffsetY(0);
        };
        img.src = objectUrl;

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    useEffect(() => {
        if (!imageEl || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { sx, sy, sourceSize } = computeCropRect(imageEl);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
            imageEl,
            sx,
            sy,
            sourceSize,
            sourceSize,
            0,
            0,
            canvas.width,
            canvas.height,
        );
    }, [imageEl, computeCropRect]);

    async function buildCroppedAvatarFile() {
        if (!imageEl) {
            throw new Error("Image is still loading.");
        }

        const outputSize = 512;
        const canvas = document.createElement("canvas");
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Unable to initialize image editor.");
        }

        const { sx, sy, sourceSize } = computeCropRect(imageEl);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, outputSize, outputSize);
        ctx.drawImage(
            imageEl,
            sx,
            sy,
            sourceSize,
            sourceSize,
            0,
            0,
            outputSize,
            outputSize,
        );

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((value) => resolve(value), "image/jpeg", 0.92);
        });

        if (!blob) {
            throw new Error("Unable to create avatar image.");
        }

        return new File([blob], "avatar.jpg", { type: "image/jpeg" });
    }

    async function handleSave() {
        setValidationError("");
        try {
            const croppedFile = await buildCroppedAvatarFile();
            await onSave(croppedFile);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Unable to process selected image.";
            setValidationError(message);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#f7f3ed] rounded-2xl border border-[#ddd5cb] max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-semibold text-[#2f2b27]">
                    Edit profile photo
                </h3>

                <div className="rounded-xl border border-[#e2dbd1] bg-white p-3 flex items-center justify-center">
                    {imageEl ? (
                        <canvas
                            ref={canvasRef}
                            width={260}
                            height={260}
                            className="h-[260px] w-[260px] rounded-full border border-[#e7e2db] bg-[#f9f7f3]"
                        />
                    ) : (
                        <p className="text-sm text-[#6a6259]">
                            Loading image...
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="block">
                        <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.16em]">
                            Zoom
                        </span>
                        <input
                            type="range"
                            min={1.05}
                            max={3}
                            step={0.01}
                            value={zoom}
                            onChange={(event) =>
                                setZoom(Number(event.target.value))
                            }
                            className="w-full"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.16em]">
                            Horizontal
                        </span>
                        <input
                            type="range"
                            min={-100}
                            max={100}
                            step={1}
                            value={offsetX}
                            onChange={(event) =>
                                setOffsetX(Number(event.target.value))
                            }
                            className="w-full"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.16em]">
                            Vertical
                        </span>
                        <input
                            type="range"
                            min={-100}
                            max={100}
                            step={1}
                            value={offsetY}
                            onChange={(event) =>
                                setOffsetY(Number(event.target.value))
                            }
                            className="w-full"
                        />
                    </label>
                </div>

                {(validationError || error) && (
                    <p className="text-xs text-[#c61b1b]">
                        {validationError || error}
                    </p>
                )}

                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !imageEl}
                        className="flex-1 py-2 rounded-lg bg-[#2f2b27] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? "Uploading..." : "Save photo"}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="flex-1 py-2 rounded-lg border border-[#d8cfc4] text-sm text-[#6a6259] hover:text-[#2f2b27] disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function MyProfileSkeleton() {
    return (
        <section className="max-w-[1180px] space-y-8 pb-8 animate-pulse">
            <div className="space-y-3">
                <div className="h-14 w-[420px] max-w-full rounded bg-[#e9e3d9]" />
                <div className="h-5 w-[380px] max-w-full rounded bg-[#eee8de]" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 rounded-2xl border border-[#e9e3db] bg-[#f8f6f2] p-8">
                    <div className="h-10 w-72 rounded bg-[#e8e2d8] mb-7" />
                    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-7">
                        <div>
                            <div className="w-[160px] h-[160px] rounded-3xl bg-[#e8e1d7]" />
                            <div className="h-4 w-[120px] rounded bg-[#ece5db] mt-4" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={`personal-skeleton-${index}`}
                                    className="space-y-2"
                                >
                                    <div className="h-3 w-24 rounded bg-[#ebe5da]" />
                                    <div className="h-4 w-36 rounded bg-[#e5ddd1]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="xl:col-span-4 rounded-2xl border border-[#e3ddd4] bg-[#f2eee7] p-8">
                    <div className="h-10 w-44 rounded bg-[#e8e2d7] mb-8" />
                    <div className="space-y-7">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={`notify-skeleton-${index}`}
                                className="h-12 rounded bg-[#eae3d8]"
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-4 rounded-2xl border border-[#e3ddd4] bg-[#f2eee7] p-8">
                    <div className="h-10 w-36 rounded bg-[#e8e2d7] mb-8" />
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={`security-skeleton-${index}`}
                                className="h-16 rounded-xl bg-[#ebe5da]"
                            />
                        ))}
                    </div>
                </div>
                <div className="xl:col-span-8 rounded-2xl border border-[#e9e3db] bg-[#f8f6f2] p-8">
                    <div className="h-10 w-52 rounded bg-[#e8e2d7] mb-8" />
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={`session-skeleton-${index}`}
                                className="h-16 rounded bg-[#ede7dd]"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

const SESSIONS_PAGE_SIZE = 5;
const ACCESS_LOGS_PAGE_SIZE = 8;

export default function MyProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const avatarInputRef = useRef<HTMLInputElement | null>(null);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [sessions, setSessions] = useState<UserSession[]>([]);

    const [editing, setEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] =
        useState(false);
    const [changePasswordLoading, setChangePasswordLoading] = useState(false);
    const [changePasswordError, setChangePasswordError] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState("");
    const [sessionsPage, setSessionsPage] = useState(1);
    const [showAccessLogsModal, setShowAccessLogsModal] = useState(false);
    const [accessLogsPage, setAccessLogsPage] = useState(1);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorSetup, setTwoFactorSetup] =
        useState<TwoFactorSetupResult | null>(null);
    const [twoFactorActionLoading, setTwoFactorActionLoading] = useState(false);
    const [twoFactorActionError, setTwoFactorActionError] = useState("");
    const [avatarLoadError, setAvatarLoadError] = useState(false);
    const [avatarSourceFile, setAvatarSourceFile] = useState<File | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarUploadError, setAvatarUploadError] = useState("");
    const [notifications, setNotifications] = useState({
        emailDigests: true,
        securityAlerts: true,
    });
    const [notificationSaving, setNotificationSaving] = useState<
        "emailDigests" | "securityAlerts" | null
    >(null);
    const [notificationError, setNotificationError] = useState("");

    const profileQuery = useApiQuery({
        queryKey: queryKeys.user.profile(),
        queryFn: getProfile,
    });
    const sessionsQuery = useApiQuery({
        queryKey: queryKeys.user.sessions(),
        queryFn: getSessions,
    });
    const accessLogsQuery = useApiQuery({
        queryKey: queryKeys.user.accessLogs(
            accessLogsPage,
            ACCESS_LOGS_PAGE_SIZE,
        ),
        queryFn: () => getAccessLogs(accessLogsPage, ACCESS_LOGS_PAGE_SIZE),
        enabled: showAccessLogsModal,
    });

    useEffect(() => {
        if (!profileQuery.data) return;
        const p = profileQuery.data;
        setProfile(p);
        setTwoFactorEnabled(p.twoFactorEnabled);
        setNotifications({
            emailDigests: p.emailDigestsEnabled,
            securityAlerts: p.securityAlertsEnabled,
        });
    }, [profileQuery.data]);

    useEffect(() => {
        if (!sessionsQuery.data) return;
        setSessions(sessionsQuery.data);
    }, [sessionsQuery.data]);

    useEffect(() => {
        setAvatarLoadError(false);
    }, [profile?.avatarUrl]);

    useEffect(() => {
        const nextTotalPages = Math.max(
            1,
            Math.ceil(sessions.length / SESSIONS_PAGE_SIZE),
        );
        setSessionsPage((current) => Math.min(current, nextTotalPages));
    }, [sessions.length]);

    async function handleRevokeSession(sessionId: string) {
        setRevokeLoadingId(sessionId);
        setSessionError("");
        try {
            await revokeSession(sessionId);
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            queryClient.setQueryData<UserSession[] | undefined>(
                queryKeys.user.sessions(),
                (current) =>
                    current
                        ? current.filter((session) => session.id !== sessionId)
                        : current,
            );
        } catch (err) {
            setSessionError(formatApiError(err));
        } finally {
            setRevokeLoadingId(null);
        }
    }

    async function handleDeleteAccount() {
        setDeleteLoading(true);
        setDeleteError("");
        try {
            await deleteAccount();
            clearAuthSession();
            router.replace("/login");
        } catch (err) {
            setDeleteError(formatApiError(err));
            setDeleteLoading(false);
        }
    }

    async function handleChangePassword(payload: {
        currentPassword: string;
        newPassword: string;
    }) {
        setChangePasswordLoading(true);
        setChangePasswordError("");
        try {
            await changePassword(payload);
            clearAuthSession();
            router.replace("/login");
        } catch (err) {
            setChangePasswordError(formatApiError(err));
            setChangePasswordLoading(false);
        }
    }

    async function handleTwoFactorActionClick() {
        if (twoFactorActionLoading) return;
        setTwoFactorActionError("");
        setTwoFactorActionLoading(true);
        try {
            if (twoFactorEnabled) {
                await disable2FA();
                setTwoFactorEnabled(false);
                setTwoFactorSetup(null);
            } else {
                const setup = await enable2FA();
                setTwoFactorSetup(setup);
            }
        } catch (err) {
            setTwoFactorActionError(formatApiError(err));
        } finally {
            setTwoFactorActionLoading(false);
        }
    }

    async function handleVerifyTwoFactor(code: string) {
        if (twoFactorActionLoading) return;
        setTwoFactorActionError("");
        setTwoFactorActionLoading(true);
        try {
            await verify2FA(code);
            setTwoFactorEnabled(true);
            setTwoFactorSetup(null);
        } catch (err) {
            setTwoFactorActionError(formatApiError(err));
        } finally {
            setTwoFactorActionLoading(false);
        }
    }

    function handleOpenAccessLogs() {
        setAccessLogsPage(1);
        setShowAccessLogsModal(true);
    }

    function handleAvatarFileChange(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setAvatarUploadError("Please select a valid image file.");
            return;
        }

        setAvatarUploadError("");
        setAvatarSourceFile(file);
    }

    async function handleSaveAvatar(croppedFile: File) {
        setAvatarUploading(true);
        setAvatarUploadError("");
        try {
            const updated = await uploadAvatar(croppedFile);
            setProfile(updated);
            queryClient.setQueryData(queryKeys.user.profile(), updated);
            setAvatarSourceFile(null);
            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("profile-avatar-updated", {
                        detail: { avatarUrl: updated.avatarUrl ?? "" },
                    }),
                );
            }
        } catch (err) {
            setAvatarUploadError(formatApiError(err));
        } finally {
            setAvatarUploading(false);
        }
    }

    async function handleNotificationToggle(
        key: "emailDigests" | "securityAlerts",
    ) {
        if (notificationSaving) return;

        const nextValue = !notifications[key];
        setNotificationSaving(key);
        setNotificationError("");
        try {
            const updated = await updateNotificationPreferences(
                key === "emailDigests"
                    ? { emailDigests: nextValue }
                    : { securityAlerts: nextValue },
            );
            setNotifications({
                emailDigests: updated.emailDigests,
                securityAlerts: updated.securityAlerts,
            });
        } catch (err) {
            setNotificationError(formatApiError(err));
        } finally {
            setNotificationSaving(null);
        }
    }

    const loading = profileQuery.isPending || sessionsQuery.isPending;
    const pageError = profileQuery.isError
        ? formatApiError(profileQuery.error)
        : sessionsQuery.isError
          ? formatApiError(sessionsQuery.error)
          : "";
    const accessLogs = accessLogsQuery.data?.data ?? [];
    const accessLogsLoading =
        accessLogsQuery.isPending || accessLogsQuery.isFetching;
    const accessLogsError = accessLogsQuery.isError
        ? formatApiError(accessLogsQuery.error)
        : "";
    const accessLogsTotalPages = accessLogsQuery.data?.totalPages ?? 1;
    const accessLogsTotal = accessLogsQuery.data?.total ?? 0;

    if (loading) return <MyProfileSkeleton />;

    if (pageError) {
        return (
            <section className="max-w-[1180px]">
                <p className="text-sm text-[#c61b1b]">{pageError}</p>
            </section>
        );
    }

    const fullName =
        profile?.name ||
        `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
        "—";
    const avatarUrl = profile?.avatarUrl?.trim() || "";
    const roleLabel = profile?.roleName || profile?.roleCode || "—";
    const organizationLabel = profile?.organizationName || "—";
    const canManageRoleAndOrganization = ["superadmin", "admin"].includes(
        (profile?.roleCode ?? "").toLowerCase(),
    );
    const currentSessionId = sessions[0]?.id;
    const sessionsTotalPages = Math.max(
        1,
        Math.ceil(sessions.length / SESSIONS_PAGE_SIZE),
    );
    const sessionsPageStartIndex = (sessionsPage - 1) * SESSIONS_PAGE_SIZE;
    const sessionsPageEndIndex = sessionsPageStartIndex + SESSIONS_PAGE_SIZE;
    const visibleSessions = sessions.slice(
        sessionsPageStartIndex,
        sessionsPageEndIndex,
    );

    return (
        <>
            {showDeleteModal && (
                <DeleteAccountModal
                    onConfirm={handleDeleteAccount}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setDeleteError("");
                    }}
                    loading={deleteLoading}
                    error={deleteError}
                />
            )}
            {showChangePasswordModal && (
                <ChangePasswordModal
                    onSubmit={handleChangePassword}
                    onCancel={() => {
                        setShowChangePasswordModal(false);
                        setChangePasswordError("");
                    }}
                    loading={changePasswordLoading}
                    error={changePasswordError}
                />
            )}
            {twoFactorSetup && (
                <TwoFactorSetupModal
                    setup={twoFactorSetup}
                    onVerify={handleVerifyTwoFactor}
                    onCancel={() => {
                        setTwoFactorSetup(null);
                        setTwoFactorActionError("");
                    }}
                    loading={twoFactorActionLoading}
                    error={twoFactorActionError}
                />
            )}
            {avatarSourceFile && (
                <AvatarEditorModal
                    file={avatarSourceFile}
                    onCancel={() => {
                        if (!avatarUploading) setAvatarSourceFile(null);
                    }}
                    onSave={handleSaveAvatar}
                    saving={avatarUploading}
                    error={avatarUploadError}
                />
            )}
            {showAccessLogsModal && (
                <AccessLogsModal
                    logs={accessLogs}
                    loading={accessLogsLoading}
                    error={accessLogsError}
                    page={accessLogsPage}
                    total={accessLogsTotal}
                    totalPages={accessLogsTotalPages}
                    onPageChange={setAccessLogsPage}
                    onClose={() => setShowAccessLogsModal(false)}
                />
            )}

            <section className="max-w-[1180px]">
                <header className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="font-serif text-[32px] font-semibold leading-[0.95] tracking-tight text-[#2f2a25]">
                            Account Profile
                        </h1>
                        <p className="mt-3 text-sm text-[#4f463e] md:text-base">
                            Manage your editorial identity and security
                            preferences.
                        </p>
                    </div>
                </header>

                <section className="mb-8 grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <article className="xl:col-span-8 rounded-2xl border border-[#e9e3db] bg-[#f8f6f2] p-8">
                        <div className="flex items-center justify-between mb-7">
                            <h2 className="font-serif text-2xl leading-tight text-[#201c18]">
                                Personal Information
                            </h2>
                            {!editing && (
                                <button
                                    type="button"
                                    onClick={() => setEditing(true)}
                                    className="text-[#9e4f10] font-semibold text-sm md:text-base"
                                >
                                    Edit Details
                                </button>
                            )}
                        </div>

                        {editing && profile ? (
                            <EditProfileForm
                                profile={profile}
                                canManageRoleAndOrganization={
                                    canManageRoleAndOrganization
                                }
                                onSave={(updated) => {
                                    setProfile(updated);
                                    queryClient.setQueryData(
                                        queryKeys.user.profile(),
                                        updated,
                                    );
                                    setEditing(false);
                                }}
                                onCancel={() => setEditing(false)}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-7">
                                <div>
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleAvatarFileChange}
                                    />
                                    <div className="w-[160px] h-[160px] rounded-3xl overflow-hidden border border-[#ddd6cc] bg-gradient-to-br from-[#766043] to-[#2f2b27]">
                                        {avatarUrl && !avatarLoadError ? (
                                            <Image
                                                src={avatarUrl}
                                                alt={`${fullName} avatar`}
                                                width={160}
                                                height={160}
                                                className="h-full w-full object-cover"
                                                unoptimized
                                                referrerPolicy="no-referrer"
                                                onError={() =>
                                                    setAvatarLoadError(true)
                                                }
                                            />
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            avatarInputRef.current?.click()
                                        }
                                        className="mt-3 w-[160px] text-center text-[#9e4f10] uppercase tracking-[0.1em] text-sm font-semibold"
                                    >
                                        Change Photo
                                    </button>
                                    {avatarUploadError && (
                                        <p className="mt-2 w-[160px] text-xs text-[#c61b1b]">
                                            {avatarUploadError}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.24em] text-[#5d564d]">
                                            Full Name
                                        </p>
                                        <p className="mt-2 text-md leading-tight text-[#1f1c19]">
                                            {fullName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.24em] text-[#5d564d]">
                                            Email Address
                                        </p>
                                        <p className="mt-2 text-md leading-tight text-[#1f1c19] break-words">
                                            {profile?.email || "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.24em] text-[#5d564d]">
                                            Primary Role
                                        </p>
                                        <p className="mt-2 text-md leading-tight text-[#1f1c19]">
                                            {roleLabel}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.24em] text-[#5d564d]">
                                            Organization
                                        </p>
                                        <p className="mt-2 text-md leading-tight text-[#1f1c19]">
                                            {organizationLabel}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.24em] text-[#5d564d]">
                                            Phone Number
                                        </p>
                                        <p className="mt-2 text-md leading-tight text-[#1f1c19]">
                                            {profile?.phone || "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </article>

                    <article className="xl:col-span-4 rounded-2xl border border-[#e3ddd4] bg-[#f2eee7] p-8">
                        <h2 className="font-serif text-2xl leading-tight text-[#201c18] mb-8">
                            Notifications
                        </h2>
                        <div className="space-y-7">
                            <ToggleRow
                                title="Email Digests"
                                subtitle="Weekly archive summaries"
                                enabled={notifications.emailDigests}
                                onToggle={() =>
                                    handleNotificationToggle("emailDigests")
                                }
                                disabled={notificationSaving === "emailDigests"}
                            />

                            <ToggleRow
                                title="Security Alerts"
                                subtitle="New logins and activity"
                                enabled={notifications.securityAlerts}
                                onToggle={() =>
                                    handleNotificationToggle("securityAlerts")
                                }
                                disabled={
                                    notificationSaving === "securityAlerts"
                                }
                            />
                            {notificationError && (
                                <p className="text-xs text-[#c61b1b]">
                                    {notificationError}
                                </p>
                            )}
                        </div>
                    </article>
                </section>

                <section className="mb-8 grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <article className="xl:col-span-4 rounded-2xl border border-[#e3ddd4] bg-[#f2eee7] p-8">
                        <h2 className="font-serif text-2xl leading-tight text-[#201c18] mb-8">
                            Security
                        </h2>

                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setChangePasswordError("");
                                    setShowChangePasswordModal(true);
                                }}
                                className="w-full rounded-xl bg-[#faf8f4] border border-[#e8e1d8] px-5 py-5 flex items-center justify-between"
                            >
                                <span className="flex items-center gap-3 text-[#2d2824]">
                                    <KeyRound
                                        size={20}
                                        strokeWidth={2}
                                        className="text-[#95510f]"
                                    />
                                    <span className="text-lg leading-none">
                                        Change Password
                                    </span>
                                </span>
                                <ChevronRight
                                    size={20}
                                    strokeWidth={2}
                                    className="text-[#4e453d]"
                                />
                            </button>

                            <div className="w-full rounded-xl bg-[#faf8f4] border border-[#e8e1d8] px-5 py-5 flex items-center justify-between">
                                <span className="flex items-center gap-3 text-[#2d2824]">
                                    <ShieldCheck
                                        size={20}
                                        strokeWidth={2}
                                        className="text-[#95510f]"
                                    />
                                    <span className="text-lg leading-none">
                                        Two-Factor Auth
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleTwoFactorActionClick}
                                    disabled={twoFactorActionLoading}
                                    aria-pressed={twoFactorEnabled}
                                    aria-label="Toggle two-factor authentication"
                                    className={`shrink-0 h-[24px] w-[46px] rounded-full border p-[2px] transition-colors disabled:opacity-60 ${
                                        twoFactorEnabled
                                            ? "bg-[#a85f00] border-[#a85f00]"
                                            : "bg-[#d7d2cb] border-[#cfc8bf]"
                                    }`}
                                >
                                    <span
                                        className={`block h-[16px] w-[16px] rounded-full bg-white border border-[#e7e2da] transition-transform ${
                                            twoFactorEnabled
                                                ? "translate-x-[22px]"
                                                : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>
                            {twoFactorActionError && (
                                <p className="text-xs text-[#c61b1b] px-1">
                                    {twoFactorActionError}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleOpenAccessLogs}
                                className="w-full rounded-xl bg-[#faf8f4] border border-[#e8e1d8] px-5 py-5 flex items-center justify-between"
                            >
                                <span className="flex items-center gap-3 text-[#2d2824]">
                                    <ScrollText
                                        size={20}
                                        strokeWidth={2}
                                        className="text-[#95510f]"
                                    />
                                    <span className="text-lg leading-none">
                                        Access Logs
                                    </span>
                                </span>
                                <ChevronRight
                                    size={20}
                                    strokeWidth={2}
                                    className="text-[#4e453d]"
                                />
                            </button>
                        </div>
                    </article>

                    <article className="xl:col-span-8 rounded-2xl border border-[#e9e3db] bg-[#f8f6f2] p-8">
                        <h2 className="font-serif text-2xl leading-tight text-[#201c18] mb-8">
                            Active Sessions
                        </h2>

                        {sessionError && (
                            <p className="text-sm text-[#c61b1b] mb-3">
                                {sessionError}
                            </p>
                        )}

                        {sessions.length === 0 ? (
                            <p className="text-sm text-[#5f564d]">
                                No active sessions found.
                            </p>
                        ) : (
                            <>
                                <ul>
                                    {visibleSessions.map((session) => {
                                        const isCurrent =
                                            session.id === currentSessionId;
                                        return (
                                            <li
                                                key={session.id}
                                                className="flex items-center justify-between gap-4 py-4 border-b border-[#ebe4db] last:border-b-0"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <span className="w-14 h-14 rounded-md bg-[#ece8e1] border border-[#ddd5cb] text-[#6a4d35] flex items-center justify-center shrink-0">
                                                        <SessionIcon
                                                            session={session}
                                                        />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-lg leading-tight font-semibold text-[#1f1c19] truncate">
                                                            {sessionTitle(
                                                                session,
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-[#5f564d] truncate">
                                                            {sessionSubTitle(
                                                                session,
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-[#8a8074] mt-0.5">
                                                            Expires{" "}
                                                            {formatDate(
                                                                session.expiresAt,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {isCurrent ? (
                                                    <span className="rounded-full bg-[#f1cfb5] text-[#3b3128] px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
                                                        Current
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRevokeSession(
                                                                session.id,
                                                            )
                                                        }
                                                        disabled={
                                                            revokeLoadingId ===
                                                            session.id
                                                        }
                                                        className="text-[#c61b1b] text-sm uppercase font-semibold tracking-[0.05em] disabled:opacity-50"
                                                    >
                                                        {revokeLoadingId ===
                                                        session.id
                                                            ? "Revoking..."
                                                            : "Revoke"}
                                                    </button>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>

                                <div className="mt-4 flex items-center justify-between text-sm text-[#8a8074]">
                                    <p>
                                        Showing {sessionsPageStartIndex + 1}-
                                        {Math.min(
                                            sessionsPageEndIndex,
                                            sessions.length,
                                        )}{" "}
                                        of {sessions.length} sessions
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSessionsPage((current) =>
                                                    Math.max(1, current - 1),
                                                )
                                            }
                                            disabled={sessionsPage <= 1}
                                            className="disabled:opacity-50 hover:text-[#5f564d]"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            className="h-9 min-w-9 rounded bg-[#9f6207] px-3 text-sm font-semibold text-white"
                                        >
                                            {sessionsPage}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSessionsPage((current) =>
                                                    Math.min(
                                                        sessionsTotalPages,
                                                        current + 1,
                                                    ),
                                                )
                                            }
                                            disabled={
                                                sessionsPage >=
                                                sessionsTotalPages
                                            }
                                            className="disabled:opacity-50 hover:text-[#5f564d]"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </article>
                </section>

                <section className="mb-8">
                    <article className="rounded-2xl border border-[#efc8c2] bg-[#fbf1ef] px-8 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="font-serif text-2xl leading-tight text-[#c21919]">
                                Archive Deactivation
                            </h2>
                            <p className="mt-3 text-sm md:text-base text-[#4d433a]">
                                Once you delete your archive, there is no going
                                back. Please be certain.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="shrink-0 rounded-xl bg-[#cc1b1b] hover:bg-[#b71717] text-white font-semibold text-base px-8 py-4"
                        >
                            Delete Account
                        </button>
                    </article>
                </section>
            </section>
        </>
    );
}
