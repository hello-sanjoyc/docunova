'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { verifyEmail } from '@/lib/api/auth';
import { formatApiError } from '@/lib/api/errors';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}

function VerifyEmailPageContent() {
  const params = useSearchParams();
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    async function run() {
      setLoading(true);
      setError('');
      setMessage('');
      try {
        await verifyEmail({ token });
        if (mounted) {
          setMessage('Email verified successfully.');
          toast.success('Email verified successfully');
        }
      } catch (err) {
        if (mounted) {
          const message = formatApiError(err);
          setError(message);
          toast.error(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-border bg-cream rounded-2xl p-8">
        <h1 className="text-2xl font-light text-ink">Verify Email</h1>
        <p className="text-sm text-muted mt-2">Confirm your email address using the verification token.</p>

        {!token && (
          <p className="text-xs text-danger mt-4">
            Missing token. Open this page with a valid <code>?token=</code> value.
          </p>
        )}

        {loading && <p className="text-xs text-muted mt-4">Verifying...</p>}
        {message && <p className="text-xs text-sage mt-4">{message}</p>}
        {error && <p className="text-xs text-danger mt-4">{error}</p>}

        <Link href="/login" className="inline-block mt-6 text-sm text-muted hover:text-ink">
          Back to login
        </Link>
      </div>
    </div>
  );
}
