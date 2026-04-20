"use client";

import Link from "next/link";
import { FocusEvent, FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { forgotPassword } from "@/lib/api/auth";
import { formatApiError } from "@/lib/api/errors";

interface Fields {
    email: string;
}

type FieldName = keyof Fields;
type Errors = Partial<Record<FieldName, string>>;
type Touched = Partial<Record<FieldName, boolean>>;

function validateField(name: FieldName, value: string): string {
    switch (name) {
        case "email":
            if (!value.trim()) return "Email is required.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                return "Enter a valid email address.";
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

export default function ForgotPasswordPage() {
    const [fields, setFields] = useState<Fields>({ email: "" });
    const [errors, setErrors] = useState<Errors>({});
    const [touched, setTouched] = useState<Touched>({});
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(name: FieldName, value: string) {
        const updated = { ...fields, [name]: value };
        setFields(updated);

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

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setTouched({ email: true });

        const validationErrors = validateAll(fields);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const result = await forgotPassword({ email: fields.email });
            const devToken = result?.resetToken
                ? ` Reset token: ${result.resetToken}`
                : "";
            setMessage(
                `If the email exists, reset instructions were generated.${devToken}`,
            );
            toast.success("Reset request submitted");
        } catch (err) {
            const message = formatApiError(err);
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-6">
            <div className="w-full max-w-md border border-border bg-cream rounded-2xl p-8">
                <h1 className="text-2xl font-light text-ink">
                    Forgot Password
                </h1>
                <p className="text-sm text-muted mt-2">
                    Enter your email to request a password reset token.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <input
                        name="email"
                        type="email"
                        value={fields.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        onBlur={handleBlur}
                        placeholder="you@example.com"
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                            touched.email && errors.email
                                ? "border-danger focus:border-danger"
                                : "border-border focus:border-amber"
                        }`}
                    />
                    {touched.email && errors.email && (
                        <p className="text-xs text-danger -mt-2">
                            {errors.email}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-ink text-cream rounded-full py-2.5 text-sm disabled:opacity-60"
                    >
                        {loading ? "Submitting..." : "Request Reset"}
                    </button>
                </form>

                {message && (
                    <p className="text-xs text-sage mt-4 break-all">
                        {message}
                    </p>
                )}
                {error && <p className="text-xs text-danger mt-4">{error}</p>}

                <Link
                    href="/login"
                    className="inline-block mt-6 text-sm text-muted hover:text-ink"
                >
                    Back to login
                </Link>
            </div>
        </div>
    );
}
