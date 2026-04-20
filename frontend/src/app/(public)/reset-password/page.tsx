'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { resetPassword } from '@/lib/api/auth';
import { formatApiError } from '@/lib/api/errors';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

function ResetPasswordPageContent() {
  const params = useSearchParams();
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resetPassword({ token, password });
      setMessage('Password reset successful. You can now login with the new password.');
      toast.success('Password reset successful');
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
        <h1 className="text-2xl font-light text-ink">Reset Password</h1>
        <p className="text-sm text-muted mt-2">Enter a new password for your account.</p>

        {!token && (
          <p className="text-xs text-danger mt-4">
            Missing token. Open this page with a valid <code>?token=</code> value.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            minLength={8}
            required
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-ink text-cream rounded-full py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        {message && <p className="text-xs text-sage mt-4">{message}</p>}
        {error && <p className="text-xs text-danger mt-4">{error}</p>}

        <Link href="/login" className="inline-block mt-6 text-sm text-muted hover:text-ink">
          Back to login
        </Link>
      </div>
    </div>
  );
}
