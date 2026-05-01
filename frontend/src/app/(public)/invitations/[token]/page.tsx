"use client";

/**
 * Invitation landing page — /invitations/[token]
 *
 * Flow:
 *   1. Fetch invitation details (public endpoint).
 *   2. If the visitor is already signed in, accept immediately and go to /team.
 *   3. Otherwise, route to /login or /signup with a `next` param that brings
 *      them back here after auth — at which point step 2 runs.
 */

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
    acceptInvitation,
    getInvitation,
} from "@/lib/api/organizations";
import { formatApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/api/session";
import { useApiQuery } from "@/lib/query/apiQuery";
import { queryKeys } from "@/lib/query/queryKeys";

type Stage = "loading" | "invalid" | "ready" | "accepting";

export default function InvitationPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = use(params);
    const router = useRouter();
    const hasAttemptedAutoAccept = useRef(false);
    const [autoAcceptStage, setAutoAcceptStage] = useState<"idle" | "accepting" | "failed">("idle");
    const [autoAcceptErrorMessage, setAutoAcceptErrorMessage] = useState("");
    const invitationQuery = useApiQuery({
        queryKey: queryKeys.organizations.invitation(token),
        queryFn: () => getInvitation(token),
    });
    const invitation = invitationQuery.data ?? null;

    useEffect(() => {
        if (!invitation) return;
        // Already signed in? Accept immediately.
        if (getAccessToken() && !hasAttemptedAutoAccept.current) {
            hasAttemptedAutoAccept.current = true;
            queueMicrotask(() => setAutoAcceptStage("accepting"));
            void acceptInvitation(token)
                .then((result) => {
                    toast.success(
                        result.organization
                            ? `You're now a member of ${result.organization.name}.`
                            : "Invitation accepted.",
                    );
                    router.replace("/team");
                })
                .catch((error) => {
                    setAutoAcceptErrorMessage(formatApiError(error));
                    setAutoAcceptStage("failed");
                });
        }
    }, [invitation, router, token]);

    const stage: Stage = invitationQuery.isPending
        ? "loading"
        : invitationQuery.isError || autoAcceptStage === "failed"
          ? "invalid"
          : autoAcceptStage === "accepting"
            ? "accepting"
            : "ready";

    const errorMessage = invitationQuery.isError
        ? formatApiError(invitationQuery.error)
        : autoAcceptErrorMessage;

    const nextPath  = `/invitations/${token}`;
    const emailQs   = invitation ? `&email=${encodeURIComponent(invitation.email)}` : "";
    const loginHref = `/login?next=${encodeURIComponent(nextPath)}${emailQs}`;
    const signupHref = `/signup?next=${encodeURIComponent(nextPath)}${emailQs}`;

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-16">
            <Link href="/" className="flex items-center gap-2 mb-10" aria-label="DocuNova AI home">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-amber">
                    <rect x="3" y="2" width="13" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="18" cy="17" r="4" fill="#F5E6CC" stroke="#C8852A" strokeWidth="1.5" />
                    <path d="M16.5 17l1 1 2-2" stroke="#C8852A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-medium text-ink text-[15px] tracking-tight">
                    DocuNova <span className="text-amber font-semibold">AI</span>
                </span>
            </Link>

            <div className="w-full max-w-md bg-cream border border-border rounded-2xl p-8 shadow-[0_4px_24px_rgba(15,14,12,0.06)]">
                {stage === "loading" && (
                    <div className="text-center text-[14px] text-muted py-4">
                        Loading invitation…
                    </div>
                )}

                {stage === "accepting" && (
                    <div className="text-center text-[14px] text-muted py-4">
                        Accepting invitation…
                    </div>
                )}

                {stage === "invalid" && (
                    <div className="text-center space-y-4">
                        <h1 className="text-[20px] font-light tracking-tight text-ink">
                            Invitation unavailable
                        </h1>
                        <p className="text-[13px] text-muted">
                            {errorMessage || "This invitation is invalid or has expired."}
                        </p>
                        <Link
                            href="/login"
                            className="inline-block text-[13px] text-ink font-medium hover:text-amber transition-colors"
                        >
                            Back to sign in
                        </Link>
                    </div>
                )}

                {stage === "ready" && invitation && (
                    <>
                        <h1 className="text-2xl font-light tracking-tight text-ink mb-1">
                            You&apos;re invited
                        </h1>
                        <p className="text-[14px] text-muted mb-6">
                            <span className="font-medium text-ink">
                                {invitation.invitedBy?.name || invitation.invitedBy?.email || "Someone"}
                            </span>{" "}
                            has invited you to join{" "}
                            <span className="font-medium text-ink">
                                {invitation.organization.name}
                            </span>
                            {invitation.role ? (
                                <>
                                    {" "}
                                    as a{" "}
                                    <span className="font-medium text-ink capitalize">
                                        {invitation.role}
                                    </span>
                                </>
                            ) : null}
                            .
                        </p>

                        <div className="bg-amber-light/30 border border-border rounded-xl px-4 py-3 mb-6">
                            <p className="text-[12px] text-muted">Invitation sent to</p>
                            <p className="text-[14px] font-medium text-ink break-all">
                                {invitation.email}
                            </p>
                        </div>

                        {invitation.hasExistingUser ? (
                            <Link
                                href={loginHref}
                                className="block text-center w-full bg-ink text-cream text-[14px] font-medium py-2.5 rounded-full hover:bg-amber transition-colors"
                            >
                                Sign in to accept
                            </Link>
                        ) : (
                            <Link
                                href={signupHref}
                                className="block text-center w-full bg-ink text-cream text-[14px] font-medium py-2.5 rounded-full hover:bg-amber transition-colors"
                            >
                                Create your account
                            </Link>
                        )}

                        <p className="text-center text-[12px] text-muted mt-4">
                            {invitation.hasExistingUser ? (
                                <>
                                    Not you?{" "}
                                    <Link
                                        href={signupHref}
                                        className="text-ink hover:text-amber transition-colors"
                                    >
                                        Create a new account
                                    </Link>
                                </>
                            ) : (
                                <>
                                    Already have an account?{" "}
                                    <Link
                                        href={loginHref}
                                        className="text-ink hover:text-amber transition-colors"
                                    >
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
