"use client";

/**
 * Login page — /login
 *
 * Two auth paths:
 *   1. Email + password  → POST /api/auth/login (TODO: wire up)
 *   2. Google OAuth      → GET  /api/auth/google (TODO: wire up)
 *
 * Validation strategy mirrors signup/page.tsx:
 *   - Errors fire on blur (once touched), never before.
 *   - On change, re-validates only already-touched fields.
 *   - On submit, all fields are marked touched so every error surfaces at once.
 *   - Server-level errors (wrong credentials, locked account) appear in a
 *     red banner above the submit button — distinct from field errors.
 *
 * Integration seam: replace the simulated delay in handleSubmit with a real
 *   POST /api/auth/login call, then redirect to /dashboard on success.
 */

import { useState, type FocusEvent, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { getGoogleOAuthUrl, login, twoFactorLogin } from "@/lib/api/auth";
import { formatApiError } from "@/lib/api/errors";
import { setAuthSession } from "@/lib/api/session";

function safeNextPath(next: string | null): string {
    // Only allow same-origin relative paths.
    if (!next || !next.startsWith("/") || next.startsWith("//"))
        return "/dashboard";
    return next;
}

// ── Types ────────────────────────────────────────────────────────────────

interface Fields {
    email: string;
    password: string;
}

type FieldName = keyof Fields;
type Errors = Partial<Record<FieldName, string>>;
type Touched = Partial<Record<FieldName, boolean>>;

// ── Validation rules ─────────────────────────────────────────────────────

function validateField(name: FieldName, value: string): string {
    switch (name) {
        case "email":
            if (!value.trim()) return "Email is required.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                return "Enter a valid email address.";
            return "";

        case "password":
            if (!value) return "Password is required.";
            return "";
    }
}

function validateAll(fields: Fields): Errors {
    return (Object.keys(fields) as FieldName[]).reduce<Errors>((acc, name) => {
        const msg = validateField(name, fields[name]);
        if (msg) acc[name] = msg;
        return acc;
    }, {});
}

// ── Component ─────────────────────────────────────────────────────────────

type SubmitState = "idle" | "submitting" | "error";

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo() {
    return (
        <Link
            href="/"
            className="flex items-center gap-2 mb-10"
            aria-label="DocuNova AI home"
        >
            <Image
                src="/logo.png"
                alt="DocuNova AI logo"
                width={32}
                height={32}
            />
            <span className="font-medium text-ink text-xl tracking-tight">
                DocuNova <span className="text-amber font-semibold">AI</span>
            </span>
        </Link>
    );
}

// ── 2FA step ──────────────────────────────────────────────────────────────────

interface TwoFactorStepProps {
    twoFactorToken: string;
    onSuccess: (auth: import("@/lib/api/auth").AuthResult) => void;
    onBack: () => void;
}

function TwoFactorStep({
    twoFactorToken,
    onSuccess,
    onBack,
}: TwoFactorStepProps) {
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (code.length !== 6) return;
        setSubmitting(true);
        setError("");
        try {
            const auth = await twoFactorLogin(twoFactorToken, code);
            onSuccess(auth);
        } catch (err) {
            setError(formatApiError(err));
            setSubmitting(false);
        }
    }

    return (
        <div className="w-full max-w-sm bg-cream border border-border rounded-2xl p-8 shadow-[0_4px_24px_rgba(15,14,12,0.06)]">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-full bg-amber/10 flex items-center justify-center shrink-0">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#C8852A"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 018 0v4" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-[16px] font-semibold text-ink leading-tight">
                        Two-factor authentication
                    </h1>
                    <p className="text-[13px] text-muted">
                        Enter the 6-digit code from your app.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    autoFocus
                    className="w-full border border-border rounded-xl px-4 py-3 text-[22px] text-ink text-center tracking-[0.5em] font-mono bg-cream focus:outline-none focus:border-amber transition-colors mb-4"
                />

                {error && (
                    <p
                        role="alert"
                        className="text-[13px] text-danger mb-4 bg-danger-light rounded-lg px-3 py-2"
                    >
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={submitting || code.length !== 6}
                    className="w-full bg-ink text-cream text-[14px] font-medium py-2.5 rounded-full hover:bg-amber transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                    {submitting ? "Verifying…" : "Verify"}
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="w-full text-[13px] text-muted hover:text-ink transition-colors py-1"
                >
                    ← Back to login
                </button>
            </form>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginPageInner />
        </Suspense>
    );
}

function LoginPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = safeNextPath(searchParams?.get("next") ?? null);
    const prefilledEmail = searchParams?.get("email") ?? "";
    const oauthError = searchParams?.get("oauthError");
    const oauthReason = searchParams?.get("oauthReason");
    const oauthMessage = oauthError
        ? `Google sign-in failed (${oauthError})${oauthReason ? `: ${oauthReason}` : "."}`
        : "";

    // Credential step state
    const [fields, setFields] = useState<Fields>({
        email: prefilledEmail,
        password: "",
    });
    const [errors, setErrors] = useState<Errors>({});
    const [touched, setTouched] = useState<Touched>({});
    const [submitState, setSubmitState] = useState<SubmitState>("idle");
    const [serverError, setServerError] = useState("");

    // 2FA step state — set when the server returns twoFactorRequired: true
    const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);

    function handleChange(name: FieldName, value: string) {
        setFields((prev) => ({ ...prev, [name]: value }));
        if (touched[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: validateField(name, value),
            }));
        }
    }

    function handleBlur(e: FocusEvent<HTMLInputElement>) {
        const name = e.target.name as FieldName;
        setTouched((prev) => ({ ...prev, [name]: true }));
        setErrors((prev) => ({
            ...prev,
            [name]: validateField(name, fields[name]),
        }));
    }

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setTouched({ email: true, password: true });
        const errs = validateAll(fields);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSubmitState("submitting");
        setServerError("");

        try {
            const result = await login(fields);

            // Server requires 2FA — show the code-entry step.
            if ("twoFactorRequired" in result && result.twoFactorRequired) {
                setTwoFactorToken(result.twoFactorToken);
                setSubmitState("idle");
                return;
            }

            // Normal login success — result is AuthResult here.
            const auth = result as import("@/lib/api/auth").AuthResult;
            if (!auth.user.emailVerifiedAt) {
                toast.info("Please verify your email before continuing.");
                router.push(
                    `/verification-pending?email=${encodeURIComponent(auth.user.email)}`,
                );
                return;
            }

            setAuthSession(auth.accessToken, auth.refreshToken);
            toast.success("Login successful");
            router.push(nextPath);
        } catch (error) {
            const message = formatApiError(error);
            setServerError(message);
            toast.error(message);
            setSubmitState("error");
        }
    }

    function handle2FASuccess(auth: import("@/lib/api/auth").AuthResult) {
        if (!auth.user.emailVerifiedAt) {
            toast.info("Please verify your email before continuing.");
            router.push(
                `/verification-pending?email=${encodeURIComponent(auth.user.email)}`,
            );
            return;
        }

        setAuthSession(auth.accessToken, auth.refreshToken);
        toast.success("Login successful");
        router.push(nextPath);
    }

    const isSubmitting = submitState === "submitting";

    function inputClass(name: FieldName) {
        return `w-full border rounded-xl px-4 py-2.5 text-[14px] text-ink placeholder:text-muted/60 bg-cream focus:outline-none transition-colors ${
            touched[name] && errors[name]
                ? "border-danger focus:border-danger"
                : "border-border focus:border-amber"
        }`;
    }

    // ── 2FA challenge screen ───────────────────────────────────────────────────
    if (twoFactorToken) {
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-16">
                <Logo />
                <TwoFactorStep
                    twoFactorToken={twoFactorToken}
                    onSuccess={handle2FASuccess}
                    onBack={() => setTwoFactorToken(null)}
                />
            </div>
        );
    }

    // ── Credential screen ──────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-16">
            <Logo />

            <div className="w-full max-w-sm bg-cream border border-border rounded-2xl p-8 shadow-[0_4px_24px_rgba(15,14,12,0.06)]">
                <h1 className="text-2xl font-light tracking-tight text-ink mb-1">
                    Welcome back
                </h1>
                <p className="text-[14px] text-muted mb-8">
                    Sign in to your DocuNova account.
                </p>

                {oauthMessage && (
                    <p
                        role="alert"
                        className="text-[13px] text-danger mb-4 bg-danger-light rounded-lg px-3 py-2"
                    >
                        {oauthMessage}
                    </p>
                )}

                {/* Google OAuth */}
                <button
                    type="button"
                    onClick={() => {
                        window.location.href = getGoogleOAuthUrl(
                            "login",
                            nextPath,
                        );
                    }}
                    className="w-full flex items-center justify-center gap-3 border border-border rounded-full py-2.5 text-[14px] font-medium text-ink hover:border-amber hover:bg-amber-light/40 transition-colors mb-5"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                            fill="#4285F4"
                        />
                        <path
                            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                            fill="#34A853"
                        />
                        <path
                            d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[12px] text-muted">or</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="space-y-4 mb-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-[12px] font-medium text-ink mb-1.5"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={fields.email}
                                onChange={(e) =>
                                    handleChange("email", e.target.value)
                                }
                                onBlur={handleBlur}
                                className={inputClass("email")}
                            />
                            {touched.email && errors.email && (
                                <p className="text-[12px] text-danger mt-1.5">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label
                                    htmlFor="password"
                                    className="text-[12px] font-medium text-ink"
                                >
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-[12px] text-muted hover:text-amber transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={fields.password}
                                onChange={(e) =>
                                    handleChange("password", e.target.value)
                                }
                                onBlur={handleBlur}
                                className={inputClass("password")}
                            />
                            {touched.password && errors.password && (
                                <p className="text-[12px] text-danger mt-1.5">
                                    {errors.password}
                                </p>
                            )}
                        </div>
                    </div>

                    {submitState === "error" && serverError && (
                        <p
                            role="alert"
                            className="text-[13px] text-danger mb-4 bg-danger-light rounded-lg px-3 py-2"
                        >
                            {serverError}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-ink text-cream text-[14px] font-medium py-2.5 rounded-full hover:bg-amber transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <p className="text-center text-[13px] text-muted mt-6">
                    Don&apos;t have an account?{" "}
                    <Link
                        href={`/signup?next=${encodeURIComponent(nextPath)}${prefilledEmail ? `&email=${encodeURIComponent(prefilledEmail)}` : ""}`}
                        className="text-ink font-medium hover:text-amber transition-colors"
                    >
                        Start free
                    </Link>
                </p>

                <div className="flex justify-center mt-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors"
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M10 3L5 8l5 5" />
                        </svg>
                        Back to home
                    </Link>
                </div>
            </div>

            <p className="text-[12px] text-muted mt-8 text-center max-w-xs">
                By signing in you agree to our{" "}
                <a
                    href="#"
                    className="underline hover:text-ink transition-colors"
                >
                    Terms
                </a>{" "}
                and{" "}
                <a
                    href="#"
                    className="underline hover:text-ink transition-colors"
                >
                    Privacy Policy
                </a>
                .
            </p>
        </div>
    );
}
