"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Clock3,
    Shield,
    Trash2,
    User,
    UserPlus,
    X,
    ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import {
    inviteMembers,
    listMembers,
    OrganizationMember,
    OrganizationRoleCode,
} from "@/lib/api/organizations";
import { formatApiError } from "@/lib/api/errors";

const TEAM_ROLES: {
    code: OrganizationRoleCode;
    label: string;
    description: string;
}[] = [
    {
        code: "owner",
        label: "Owner",
        description: "Founder / Director",
    },
    { code: "admin", label: "Admin", description: "Operations / Legal Lead" },
    {
        code: "member",
        label: "Member",
        description: "Day-to-day contributor",
    },
    { code: "viewer", label: "Viewer", description: "Read-only" },
];

function statusClass(status: OrganizationMember["status"]) {
    if (status === "ACTIVE") return "bg-[#d7eedf] text-[#147a49]";
    if (status === "INVITED") return "bg-[#ece7df] text-[#6a6259]";
    return "bg-[#f3dcdc] text-[#9b2f2f]";
}

function formatTime(value: string | null) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return "—";
    }
}

function roleLabel(code: string | null | undefined) {
    if (!code) return "Member";
    const match = TEAM_ROLES.find((r) => r.code === code);
    return match?.label ?? code.charAt(0).toUpperCase() + code.slice(1);
}

function isPrivilegedRole(code: string | null | undefined) {
    return code === "owner" || code === "admin";
}

export default function TeamPageClient() {
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string>("");

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [selectedRole, setSelectedRole] =
        useState<OrganizationRoleCode>("owner");
    const [emailsInput, setEmailsInput] = useState("");
    const [sending, setSending] = useState(false);

    const parsedEmails = useMemo(
        () =>
            emailsInput
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
        [emailsInput],
    );

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasInvalidEmail = parsedEmails.some(
        (email) => !emailRegex.test(email),
    );
    const canSend = parsedEmails.length > 0 && !hasInvalidEmail && !sending;

    const loadMembers = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            const result = await listMembers({ status: "all", limit: 100 });
            setMembers(result.data);
        } catch (error) {
            setLoadError(formatApiError(error));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMembers();
    }, [loadMembers]);

    function resetInviteForm() {
        setSelectedRole("owner");
        setEmailsInput("");
        setSending(false);
    }

    function closeInviteModal() {
        setIsInviteOpen(false);
        resetInviteForm();
    }

    async function handleSendInvitation() {
        if (!canSend) return;

        setSending(true);
        try {
            const result = await inviteMembers({
                role: selectedRole,
                emails: parsedEmails,
            });

            const alreadyMembers = result.results.filter(
                (r) => r.status === "already_member",
            ).length;

            if (result.sent > 0) {
                toast.success(
                    `Invitation sent to ${result.sent} member${result.sent === 1 ? "" : "s"} as ${roleLabel(selectedRole)}.`,
                );
            }
            if (alreadyMembers > 0) {
                toast.info(
                    `${alreadyMembers} email${alreadyMembers === 1 ? " was" : "s were"} skipped — already active member${alreadyMembers === 1 ? "" : "s"}.`,
                );
            }

            closeInviteModal();
            await loadMembers();
        } catch (error) {
            toast.error(formatApiError(error));
            setSending(false);
        }
    }

    const selectedRoleMeta =
        TEAM_ROLES.find((r) => r.code === selectedRole) ?? TEAM_ROLES[0];
    const activeMembers = members.filter(
        (member) => member.status === "ACTIVE",
    );
    const invitedMembers = members.filter(
        (member) => member.status === "INVITED",
    );

    return (
        <>
            {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#d7d7d7] bg-[#f7f7f9] shadow-xl">
                        <div className="flex items-center justify-between border-b border-[#d9d9d9] px-6 py-4">
                            <h2 className="text-2xl font-medium text-[#1f1f1f]">
                                Invite team members
                            </h2>
                            <button
                                type="button"
                                onClick={closeInviteModal}
                                className="text-[#b0b0b0] hover:text-[#6d6d6d]"
                                aria-label="Close invite modal"
                            >
                                <X size={24} strokeWidth={2} />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-base font-medium text-[#1f1f1f]">
                                Add people to your team and control what they
                                can access.
                            </p>
                        </div>

                        <div className="space-y-5 px-6 py-5">
                            <div>
                                <label
                                    htmlFor="team-role"
                                    className="mb-2 block text-sm font-bold text-[#1f1f1f]"
                                >
                                    Role
                                </label>
                                <div className="relative">
                                    <select
                                        id="team-role"
                                        value={selectedRole}
                                        onChange={(event) =>
                                            setSelectedRole(
                                                event.target
                                                    .value as OrganizationRoleCode,
                                            )
                                        }
                                        className="h-12 w-full appearance-none rounded-xl border border-[#cfcfcf] bg-[#f7f7f9] px-4 pr-12 text-base text-[#232323] outline-none focus:border-[#8db8a4]"
                                    >
                                        {TEAM_ROLES.map((role) => (
                                            <option
                                                key={role.code}
                                                value={role.code}
                                            >
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        size={24}
                                        className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#6d6d6d]"
                                    />
                                </div>
                                <p className="mt-3 text-xs text-[#6a6259]">
                                    {selectedRoleMeta.description}
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="team-emails"
                                    className="mb-2 block text-sm font-bold text-[#1f1f1f]"
                                >
                                    Email addresses
                                </label>
                                <input
                                    id="team-emails"
                                    value={emailsInput}
                                    onChange={(event) =>
                                        setEmailsInput(event.target.value)
                                    }
                                    placeholder="name@example.com, name2@example.com, ..."
                                    className="h-12 w-full rounded-xl border border-[#cfcfcf] bg-[#f7f7f9] px-4 text-base text-[#232323] outline-none placeholder:text-[#b9b9b9] focus:border-[#8db8a4]"
                                />
                                <p className="mt-3 text-xs text-[#8a8177]">
                                    Separate multiple emails with commas.
                                </p>
                                {hasInvalidEmail && (
                                    <p className="mt-2 text-xs text-[#c61b1b]">
                                        One or more email addresses are invalid.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#d9d9d9] px-6 py-4">
                            <button
                                type="button"
                                onClick={closeInviteModal}
                                className="h-10 rounded-xl border border-[#cfcfcf] bg-[#f7f7f9] px-4 text-sm font-medium text-[#2a2a2a]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSendInvitation}
                                disabled={!canSend}
                                className="h-10 rounded-xl border border-[#2abf88] bg-[#7ad6b2] px-4 text-sm font-medium text-[#043e2c] disabled:cursor-not-allowed disabled:opacity-55"
                            >
                                {sending ? "Sending..." : "Send invitation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <section className="max-w-[1180px]">
                <header className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="font-serif text-[32px] font-semibold leading-[0.95] tracking-tight text-[#2f2a25]">
                            Team
                        </h1>
                        <p className="mt-3 text-sm text-[#4f463e] md:text-base">
                            Manage your workspace members and access.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 lg:pt-2">
                        <button
                            type="button"
                            onClick={() => setIsInviteOpen(true)}
                            className="flex h-12 items-center gap-2.5 rounded-md border border-[#d4b37a] bg-[#e5c186] px-5 text-[14px] font-medium text-[#3d3327]"
                        >
                            <UserPlus
                                size={16}
                                strokeWidth={2}
                                className="text-[#3d3327]"
                            />
                            New Member
                        </button>
                    </div>
                </header>

                <div className="overflow-hidden rounded-[28px] border border-[#e4ddd3] bg-[#f9f7f3]">
                    <div className="border-b border-[#e8e1d8] px-8 py-5">
                        <h2 className="font-serif text-2xl leading-tight text-[#201c18]">
                            Members
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] table-fixed">
                            <colgroup>
                                <col className="w-[16%]" />
                                <col className="w-[36%]" />
                                <col className="w-[16%]" />
                                <col className="w-[18%]" />
                                <col className="w-[14%]" />
                            </colgroup>
                            <thead>
                                <tr className="bg-[#f1eee8] text-[11px] uppercase tracking-[0.24em] text-[#b0a79c]">
                                    <th className="px-4 py-4 text-left font-medium">
                                        Type
                                    </th>
                                    <th className="px-4 py-4 text-left font-medium">
                                        Details
                                    </th>
                                    <th className="px-4 py-4 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-4 text-left font-medium">
                                        Time
                                    </th>
                                    <th className="px-4 py-4 text-left font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-sm text-[#8d847a]"
                                        >
                                            Loading members…
                                        </td>
                                    </tr>
                                )}
                                {!loading && loadError && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-sm text-[#c61b1b]"
                                        >
                                            {loadError}
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    !loadError &&
                                    activeMembers.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-6 text-center text-sm text-[#8d847a]"
                                            >
                                                No active members yet.
                                            </td>
                                        </tr>
                                    )}
                                {!loading &&
                                    !loadError &&
                                    activeMembers.map((member) => {
                                        const roleCode =
                                            member.role?.code ?? null;
                                        const typeLabel = roleLabel(roleCode);
                                        const timestamp =
                                            member.status === "INVITED"
                                                ? (member.invitedAt ??
                                                  member.createdAt)
                                                : (member.joinedAt ??
                                                  member.user.lastLoginAt ??
                                                  member.createdAt);

                                        return (
                                            <tr
                                                key={member.id}
                                                className="border-t border-[#ebe5db]"
                                            >
                                                <td className="px-4 py-4 text-sm text-[#5f564d]">
                                                    <span className="inline-flex items-center gap-2">
                                                        {isPrivilegedRole(
                                                            roleCode,
                                                        ) ? (
                                                            <Shield
                                                                size={16}
                                                                strokeWidth={2}
                                                                className="text-[#b87013]"
                                                            />
                                                        ) : (
                                                            <User
                                                                size={16}
                                                                strokeWidth={2}
                                                                className="text-[#6a6259]"
                                                            />
                                                        )}
                                                        {typeLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="truncate text-base leading-none text-[#27231f]">
                                                        {member.user.name ||
                                                            member.user.email}
                                                    </p>
                                                    <p className="mt-2 truncate text-xs leading-none text-[#8d847a]">
                                                        {member.user.email}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-4 py-1.5 text-[11px] font-semibold ${statusClass(member.status)}`}
                                                    >
                                                        {member.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-4 text-sm leading-none text-[#6a6259]">
                                                    <span className="inline-flex items-center gap-2">
                                                        <Clock3
                                                            size={14}
                                                            strokeWidth={2}
                                                            className="text-[#8e8479]"
                                                        />
                                                        {formatTime(timestamp)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="flex items-center gap-4 whitespace-nowrap text-[#b2a89c]">
                                                        <button
                                                            type="button"
                                                            title="Remove"
                                                            className="hover:text-[#cf2525]"
                                                        >
                                                            <Trash2
                                                                size={18}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                        </button>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[28px] border border-[#e4ddd3] bg-[#f9f7f3]">
                    <div className="border-b border-[#e8e1d8] px-8 py-5">
                        <h2 className="font-serif text-2xl leading-tight text-[#201c18]">
                            Invited Members
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] table-fixed">
                            <colgroup>
                                <col className="w-[16%]" />
                                <col className="w-[36%]" />
                                <col className="w-[16%]" />
                                <col className="w-[18%]" />
                                <col className="w-[14%]" />
                            </colgroup>
                            <thead>
                                <tr className="bg-[#f1eee8] text-[11px] uppercase tracking-[0.24em] text-[#b0a79c]">
                                    <th className="px-4 py-4 text-left font-medium">
                                        Type
                                    </th>
                                    <th className="px-4 py-4 text-left font-medium">
                                        Details
                                    </th>
                                    <th className="px-4 py-4 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-4 text-left font-medium">
                                        Time
                                    </th>
                                    <th className="px-4 py-4 text-left font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-sm text-[#8d847a]"
                                        >
                                            Loading invited members…
                                        </td>
                                    </tr>
                                )}
                                {!loading && loadError && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-sm text-[#c61b1b]"
                                        >
                                            {loadError}
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    !loadError &&
                                    invitedMembers.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-6 text-center text-sm text-[#8d847a]"
                                            >
                                                No pending invitations.
                                            </td>
                                        </tr>
                                    )}
                                {!loading &&
                                    !loadError &&
                                    invitedMembers.map((member) => {
                                        const roleCode =
                                            member.role?.code ?? null;
                                        const typeLabel = roleLabel(roleCode);
                                        const timestamp =
                                            member.invitedAt ??
                                            member.createdAt;

                                        return (
                                            <tr
                                                key={member.id}
                                                className="border-t border-[#ebe5db]"
                                            >
                                                <td className="px-4 py-4 text-sm text-[#5f564d]">
                                                    <span className="inline-flex items-center gap-2">
                                                        {isPrivilegedRole(
                                                            roleCode,
                                                        ) ? (
                                                            <Shield
                                                                size={16}
                                                                strokeWidth={2}
                                                                className="text-[#b87013]"
                                                            />
                                                        ) : (
                                                            <User
                                                                size={16}
                                                                strokeWidth={2}
                                                                className="text-[#6a6259]"
                                                            />
                                                        )}
                                                        {typeLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="truncate text-base leading-none text-[#27231f]">
                                                        {member.user.name ||
                                                            member.user.email}
                                                    </p>
                                                    <p className="mt-2 truncate text-xs leading-none text-[#8d847a]">
                                                        {member.user.email}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-4 py-1.5 text-[11px] font-semibold ${statusClass(member.status)}`}
                                                    >
                                                        {member.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-4 text-sm leading-none text-[#6a6259]">
                                                    <span className="inline-flex items-center gap-2">
                                                        <Clock3
                                                            size={14}
                                                            strokeWidth={2}
                                                            className="text-[#8e8479]"
                                                        />
                                                        {formatTime(timestamp)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="flex items-center gap-4 whitespace-nowrap text-[#b2a89c]">
                                                        <button
                                                            type="button"
                                                            title="Remove"
                                                            className="hover:text-[#cf2525]"
                                                        >
                                                            <Trash2
                                                                size={18}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                        </button>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </>
    );
}
