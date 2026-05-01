"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    CircleHelp,
    CircleUser,
    History,
    LayoutGrid,
    LogOut,
    Settings,
    Bell,
    CreditCard,
    FileText,
    Trash2,
    Users,
    UserRound,
    X,
} from "lucide-react";
import { logout } from "@/lib/api/auth";
import { clearAuthSession, getRefreshToken } from "@/lib/api/session";

const navItems = [
    {
        href: "/dashboard",
        label: "Overview",
        icon: <LayoutGrid size={16} strokeWidth={1.8} aria-hidden="true" />,
    },
    {
        href: "/documents",
        label: "Documents",
        icon: <FileText size={16} strokeWidth={1.8} aria-hidden="true" />,
    },
    {
        href: "/recent-activities",
        label: "Recent Activities",
        icon: <History size={16} strokeWidth={1.8} aria-hidden="true" />,
    },
    /*     {
        href: "/archives",
        label: "All Archives",
        icon: <Archive size={16} strokeWidth={1.8} aria-hidden="true" />,
    }, */
    {
        href: "/team",
        label: "Team",
        icon: <Users size={16} strokeWidth={1.8} aria-hidden="true" />,
    },
    {
        href: "/billing",
        label: "Subscription",
        icon: <CreditCard size={16} strokeWidth={1.8} aria-hidden="true" />,
    },
    {
        href: "/trash",
        label: "Trash",
        icon: <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />,
    },
    {
        href: "/myprofile",
        label: "Account Profile",
        icon: <CircleUser size={16} strokeWidth={1.8} aria-hidden="true" />,
    },
] as const;

interface SidebarProps {
    mobile?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ mobile = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        try {
            await logout({ refreshToken: getRefreshToken() ?? undefined });
        } catch {
            // best effort
        } finally {
            clearAuthSession();
            onClose?.();
            router.replace("/login");
        }
    }

    return (
        <aside
            className={
                mobile
                    ? "w-[280px] max-w-[85vw] border-r border-border bg-parchment flex flex-col h-full"
                    : "w-64 border-r border-border bg-parchment hidden lg:flex flex-col h-screen sticky top-0"
            }
        >
            <div className="h-16 bg-cream border-b border-border px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                {mobile && (
                    <button
                        type="button"
                        onClick={() => onClose?.()}
                        className="text-muted hover:text-ink"
                        aria-label="Close menu"
                    >
                        <X size={22} strokeWidth={2} aria-hidden="true" />
                    </button>
                )}
            </div>

            {mobile && (
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="text-muted hover:text-ink"
                            aria-label="Notifications"
                        >
                            <Bell
                                size={16}
                                strokeWidth={1.8}
                                aria-hidden="true"
                            />
                        </button>
                        <button
                            type="button"
                            className="text-muted hover:text-ink"
                            aria-label="Settings"
                        >
                            <Settings
                                size={16}
                                strokeWidth={1.8}
                                aria-hidden="true"
                            />
                        </button>
                        <button
                            type="button"
                            className="w-8 h-8 rounded-full bg-sage-dark text-sage-light flex items-center justify-center"
                            aria-label="Profile"
                        >
                            <UserRound
                                size={15}
                                strokeWidth={2}
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                </div>
            )}

            <nav className="mt-2 px-2 py-5 space-y-1 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname?.startsWith(item.href) ?? false;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => onClose?.()}
                            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                                isActive
                                    ? "text-amber-dark font-semibold"
                                    : "text-muted hover:text-ink"
                            }`}
                        >
                            {isActive && (
                                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded bg-amber" />
                            )}
                            <span
                                className={
                                    isActive ? "text-amber-dark" : "text-muted"
                                }
                            >
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto border-t border-border px-2 py-4 space-y-1">
                <button
                    type="button"
                    onClick={() => onClose?.()}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted hover:text-ink"
                >
                    <span>
                        <CircleHelp
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                        />
                    </span>
                    <span>Help</span>
                </button>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted hover:text-danger"
                >
                    <span>
                        <LogOut
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                        />
                    </span>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
