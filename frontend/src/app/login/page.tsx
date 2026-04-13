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

import { useState, type FormEvent, type FocusEvent } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────

interface Fields {
  email: string;
  password: string;
}

type FieldName = keyof Fields;
type Errors    = Partial<Record<FieldName, string>>;
type Touched   = Partial<Record<FieldName, boolean>>;

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

export default function LoginPage() {
  const [fields, setFields] = useState<Fields>({ email: "", password: "" });
  const [errors,  setErrors]  = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [serverError, setServerError] = useState("");

  function handleChange(name: FieldName, value: string) {
    const updated = { ...fields, [name]: value };
    setFields(updated);
    // Re-validate only if the field has already been touched.
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  }

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const name = e.target.name as FieldName;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, fields[name]) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Mark every field touched so all errors appear simultaneously.
    setTouched({ email: true, password: true });

    const errs = validateAll(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitState("submitting");
    setServerError("");

    // TODO: Replace with real call:
    //   const res = await fetch("/api/auth/login", {
    //     method: "POST",
    //     body: JSON.stringify(fields),
    //     headers: { "Content-Type": "application/json" },
    //   });
    //   if (!res.ok) { setServerError(await res.text()); setSubmitState("error"); return; }
    //   router.push("/dashboard");
    await new Promise((r) => setTimeout(r, 800));
    setServerError("Auth backend not connected yet.");
    setSubmitState("error");
  }

  const isSubmitting = submitState === "submitting";

  // Derive border class — error state takes priority over focus style.
  function inputClass(name: FieldName) {
    return `w-full border rounded-xl px-4 py-2.5 text-[14px] text-ink placeholder:text-muted/60 bg-cream focus:outline-none transition-colors ${
      touched[name] && errors[name]
        ? "border-danger focus:border-danger"
        : "border-border focus:border-amber"
    }`;
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
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

      {/* Card */}
      <div className="w-full max-w-sm bg-cream border border-border rounded-2xl p-8 shadow-[0_4px_24px_rgba(15,14,12,0.06)]">
        <h1 className="text-2xl font-light tracking-tight text-ink mb-1">
          Welcome back
        </h1>
        <p className="text-[14px] text-muted mb-8">
          Sign in to your DocuNova account.
        </p>

        {/* ── Google OAuth ──────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => alert("Google OAuth not connected yet.")}
          className="w-full flex items-center justify-center gap-3 border border-border rounded-full py-2.5 text-[14px] font-medium text-ink hover:border-amber hover:bg-amber-light/40 transition-colors mb-5"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-muted">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Email / password form ─────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 mb-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[12px] font-medium text-ink mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={fields.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={handleBlur}
                className={inputClass("email")}
              />
              {touched.email && errors.email && (
                <p className="text-[12px] text-danger mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-[12px] font-medium text-ink">
                  Password
                </label>
                {/* TODO: implement reset flow */}
                <a href="#" className="text-[12px] text-muted hover:text-amber transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={fields.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={handleBlur}
                className={inputClass("password")}
              />
              {touched.password && errors.password && (
                <p className="text-[12px] text-danger mt-1.5">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Server-level error (wrong credentials, account locked, etc.) */}
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

        {/* ── Footer ───────────────────────────────────────────────── */}
        <p className="text-center text-[13px] text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-ink font-medium hover:text-amber transition-colors">
            Start free
          </Link>
        </p>

        {/* Back to home */}
        <div className="flex justify-center mt-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>

      {/* Legal footnote */}
      <p className="text-[12px] text-muted mt-8 text-center max-w-xs">
        By signing in you agree to our{" "}
        <a href="#" className="underline hover:text-ink transition-colors">Terms</a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-ink transition-colors">Privacy Policy</a>.
      </p>
    </div>
  );
}
