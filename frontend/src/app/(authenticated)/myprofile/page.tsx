"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
    deleteAccount,
    getSessions,
    revokeSession,
    type UserProfile,
    type UserSession,
    type UpdateProfileRequest,
} from "@/lib/api/user";
import { clearAuthSession } from "@/lib/api/session";
import { formatApiError } from "@/lib/api/errors";
import { enable2FA, disable2FA } from "@/lib/api/twoFactor";

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
}: {
    title: string;
    subtitle: string;
    enabled: boolean;
    onToggle: () => void;
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
                className={`shrink-0 h-[24px] w-[46px] rounded-full border p-[2px] transition-colors ${
                    enabled
                        ? "bg-[#a85f00] border-[#a85f00]"
                        : "bg-[#d7d2cb] border-[#cfc8bf]"
                }`}
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
    onSave: (updated: UserProfile) => void;
    onCancel: () => void;
}

function EditProfileForm({ profile, onSave, onCancel }: EditFormProps) {
    const [form, setForm] = useState<UpdateProfileRequest>({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        phone: profile.phone ?? "",
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
                    firstName: form.firstName || undefined,
                    lastName: form.lastName || undefined,
                    phone: form.phone || undefined,
                });
                onSave(updated);
            } catch (err) {
                setError(formatApiError(err));
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                    <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.22em]">
                        First name
                    </span>
                    <input
                        name="firstName"
                        value={form.firstName ?? ""}
                        onChange={handleChange}
                        className="w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-sm bg-[#f9f7f3] focus:outline-none focus:ring-1 focus:ring-[#352f2a]"
                    />
                </label>
                <label className="block">
                    <span className="text-xs text-[#6c645c] block mb-1 uppercase tracking-[0.22em]">
                        Last name
                    </span>
                    <input
                        name="lastName"
                        value={form.lastName ?? ""}
                        onChange={handleChange}
                        className="w-full border border-[#e7e2db] rounded-xl px-3 py-2.5 text-sm bg-[#f9f7f3] focus:outline-none focus:ring-1 focus:ring-[#352f2a]"
                    />
                </label>
            </div>
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

export default function MyProfilePage() {
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const [editing, setEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState("");
    const [sessionsPage, setSessionsPage] = useState(1);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorActionLoading, setTwoFactorActionLoading] = useState(false);
    const [twoFactorActionError, setTwoFactorActionError] = useState("");
    const [avatarLoadError, setAvatarLoadError] = useState(false);
    const [notifications, setNotifications] = useState({
        emailDigests: true,
        collaborationAlerts: true,
        securityAlerts: true,
    });

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([getProfile(), getSessions()])
            .then(([p, s]) => {
                if (!cancelled) {
                    setProfile(p);
                    setSessions(s);
                    setTwoFactorEnabled(p.twoFactorEnabled);
                }
            })
            .catch((err) => {
                if (!cancelled) setPageError(formatApiError(err));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

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

    async function handleTwoFactorActionClick() {
        if (twoFactorActionLoading) return;
        setTwoFactorActionError("");
        setTwoFactorActionLoading(true);
        try {
            if (twoFactorEnabled) {
                await disable2FA();
                setTwoFactorEnabled(false);
            } else {
                await enable2FA();
                setTwoFactorEnabled(true);
            }
        } catch (err) {
            setTwoFactorActionError(formatApiError(err));
        } finally {
            setTwoFactorActionLoading(false);
        }
    }

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
                                onSave={(updated) => {
                                    setProfile(updated);
                                    setEditing(false);
                                }}
                                onCancel={() => setEditing(false)}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-7">
                                <div>
                                    <div className="w-[160px] h-[160px] rounded-3xl overflow-hidden border border-[#ddd6cc] bg-gradient-to-br from-[#766043] to-[#2f2b27]">
                                        {avatarUrl && !avatarLoadError ? (
                                            <img
                                                src={avatarUrl}
                                                alt={`${fullName} avatar`}
                                                className="h-full w-full object-cover"
                                                referrerPolicy="no-referrer"
                                                loading="eager"
                                                decoding="async"
                                                onError={() =>
                                                    setAvatarLoadError(true)
                                                }
                                            />
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        className="mt-3 w-[160px] text-center text-[#9e4f10] uppercase tracking-[0.1em] text-sm font-semibold"
                                    >
                                        Change Photo
                                    </button>
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
                                    setNotifications((prev) => ({
                                        ...prev,
                                        emailDigests: !prev.emailDigests,
                                    }))
                                }
                            />
                            <ToggleRow
                                title="Collaboration Alerts"
                                subtitle="Real-time edits and comments"
                                enabled={notifications.collaborationAlerts}
                                onToggle={() =>
                                    setNotifications((prev) => ({
                                        ...prev,
                                        collaborationAlerts:
                                            !prev.collaborationAlerts,
                                    }))
                                }
                            />
                            <ToggleRow
                                title="Security Alerts"
                                subtitle="New logins and activity"
                                enabled={notifications.securityAlerts}
                                onToggle={() =>
                                    setNotifications((prev) => ({
                                        ...prev,
                                        securityAlerts: !prev.securityAlerts,
                                    }))
                                }
                            />
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
                                                        {sessionTitle(session)}
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
