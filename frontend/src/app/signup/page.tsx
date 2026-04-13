"use client";

/**
 * Registration page — /signup
 *
 * Fields:
 *   fullName        required, ≥2 chars
 *   email           required, valid format
 *   companyName     optional — useful for team/agency onboarding
 *   password        required, ≥8 chars, ≥1 uppercase, ≥1 number
 *   confirmPassword required, must match password
 *
 * Validation strategy:
 *   - Each field validates on blur (once touched) so errors don't fire
 *     before the user has had a chance to type.
 *   - On submit, all fields are marked touched and fully validated before
 *     the request fires.
 *   - `validateField` is the single source of truth for all rules — no
 *     duplicate logic between blur and submit paths.
 *
 * Integration seam: replace the simulated delay in handleSubmit with a real
 *   POST /api/auth/signup call, then redirect to /dashboard on success.
 */

import { useState, type FormEvent, type FocusEvent } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────

interface Fields {
  fullName: string;
  email: string;
  companyName: string;
  password: string;
  confirmPassword: string;
}

type FieldName = keyof Fields;
type Errors  = Partial<Record<FieldName, string>>;
type Touched = Partial<Record<FieldName, boolean>>;

// ── Validation rules ─────────────────────────────────────────────────────

/**
 * Returns an error string for the given field, or "" if valid.
 * Receives the full field map so confirmPassword can reference password.
 */
function validateField(name: FieldName, value: string, all: Fields): string {
  switch (name) {
    case "fullName":
      if (!value.trim())           return "Full name is required.";
      if (value.trim().length < 2) return "Must be at least 2 characters.";
      return "";

    case "email":
      if (!value.trim()) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Enter a valid email address.";
      return "";

    case "companyName":
      // Optional — no rules.
      return "";

    case "password":
      if (!value)          return "Password is required.";
      if (value.length < 8) return "Must be at least 8 characters.";
      if (!/[A-Z]/.test(value)) return "Must include at least one uppercase letter.";
      if (!/[0-9]/.test(value)) return "Must include at least one number.";
      return "";

    case "confirmPassword":
      if (!value)                return "Please confirm your password.";
      if (value !== all.password) return "Passwords do not match.";
      return "";
  }
}

/** Runs all fields and returns the full errors map. */
function validateAll(fields: Fields): Errors {
  return (Object.keys(fields) as FieldName[]).reduce<Errors>((acc, name) => {
    const msg = validateField(name, fields[name], fields);
    if (msg) acc[name] = msg;
    return acc;
  }, {});
}

// ── Component ─────────────────────────────────────────────────────────────

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function SignupPage() {
  const [fields, setFields] = useState<Fields>({
    fullName: "",
    email: "",
    companyName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors,  setErrors]  = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [serverError, setServerError] = useState("");

  // Update field value and re-validate if already touched.
  function handleChange(name: FieldName, value: string) {
    const updated = { ...fields, [name]: value };
    setFields(updated);

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value, updated),
        // Re-validate confirmPassword whenever password changes.
        ...(name === "password"
          ? { confirmPassword: validateField("confirmPassword", updated.confirmPassword, updated) }
          : {}),
      }));
    }
  }

  // Mark field touched and validate on blur.
  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const name = e.target.name as FieldName;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, fields[name], fields),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Mark every field as touched so all errors surface at once.
    const allTouched = (Object.keys(fields) as FieldName[]).reduce<Touched>(
      (acc, k) => ({ ...acc, [k]: true }),
      {}
    );
    setTouched(allTouched);

    const errs = validateAll(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitState("submitting");
    setServerError("");

    // TODO: Replace with real call:
    //   const res = await fetch("/api/auth/signup", {
    //     method: "POST",
    //     body: JSON.stringify(fields),
    //     headers: { "Content-Type": "application/json" },
    //   });
    //   if (!res.ok) { setServerError(await res.text()); setSubmitState("error"); return; }
    //   router.push("/dashboard");
    await new Promise((r) => setTimeout(r, 900));
    setServerError("Auth backend not connected yet.");
    setSubmitState("error");
  }

  const isSubmitting = submitState === "submitting";

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

      {/* Card — wider than login to comfortably fit 5 fields */}
      <div className="w-full max-w-md bg-cream border border-border rounded-2xl p-8 shadow-[0_4px_24px_rgba(15,14,12,0.06)]">
        <h1 className="text-2xl font-light tracking-tight text-ink mb-1">
          Create your account
        </h1>
        <p className="text-[14px] text-muted mb-8">
          Start with 3 free contract briefs — no credit card required.
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
          Sign up with Google
        </button>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-muted">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Registration form ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">

            {/* Full name */}
            <div>
              <label htmlFor="fullName" className="block text-[12px] font-medium text-ink mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                value={fields.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                onBlur={handleBlur}
                className={`w-full border rounded-xl px-4 py-2.5 text-[14px] text-ink placeholder:text-muted/60 bg-cream focus:outline-none transition-colors ${
                  touched.fullName && errors.fullName
                    ? "border-danger focus:border-danger"
                    : "border-border focus:border-amber"
                }`}
              />
              {touched.fullName && errors.fullName && (
                <p className="text-[12px] text-danger mt-1.5">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[12px] font-medium text-ink mb-1.5">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="jane@company.com"
                value={fields.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={handleBlur}
                className={`w-full border rounded-xl px-4 py-2.5 text-[14px] text-ink placeholder:text-muted/60 bg-cream focus:outline-none transition-colors ${
                  touched.email && errors.email
                    ? "border-danger focus:border-danger"
                    : "border-border focus:border-amber"
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-[12px] text-danger mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Company name (optional) */}
            <div>
              <label htmlFor="companyName" className="block text-[12px] font-medium text-ink mb-1.5">
                Company name{" "}
                <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                autoComplete="organization"
                placeholder="Acme Inc."
                value={fields.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                onBlur={handleBlur}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-[14px] text-ink placeholder:text-muted/60 bg-cream focus:outline-none focus:border-amber transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[12px] font-medium text-ink mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={fields.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={handleBlur}
                className={`w-full border rounded-xl px-4 py-2.5 text-[14px] text-ink placeholder:text-muted/60 bg-cream focus:outline-none transition-colors ${
                  touched.password && errors.password
                    ? "border-danger focus:border-danger"
                    : "border-border focus:border-amber"
                }`}
              />
              {touched.password && errors.password ? (
                <p className="text-[12px] text-danger mt-1.5">{errors.password}</p>
              ) : (
                // Hint shown before the field is touched or when it's valid.
                <p className="text-[12px] text-muted mt-1.5">
                  Min 8 characters, one uppercase letter, one number.
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-[12px] font-medium text-ink mb-1.5">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={fields.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                onBlur={handleBlur}
                className={`w-full border rounded-xl px-4 py-2.5 text-[14px] text-ink placeholder:text-muted/60 bg-cream focus:outline-none transition-colors ${
                  touched.confirmPassword && errors.confirmPassword
                    ? "border-danger focus:border-danger"
                    : "border-border focus:border-amber"
                }`}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-[12px] text-danger mt-1.5">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Server-level error (e.g. email already exists) */}
          {submitState === "error" && serverError && (
            <p
              role="alert"
              className="text-[13px] text-danger mt-5 bg-danger-light rounded-lg px-3 py-2"
            >
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-ink text-cream text-[14px] font-medium py-2.5 rounded-full hover:bg-amber transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <p className="text-center text-[13px] text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-ink font-medium hover:text-amber transition-colors">
            Log in
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
        By creating an account you agree to our{" "}
        <a href="#" className="underline hover:text-ink transition-colors">Terms</a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-ink transition-colors">Privacy Policy</a>.
      </p>
    </div>
  );
}
