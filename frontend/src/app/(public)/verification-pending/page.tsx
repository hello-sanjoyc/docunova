'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function VerificationPendingPage() {
  return (
    <Suspense fallback={null}>
      <VerificationPendingPageContent />
    </Suspense>
  );
}

function VerificationPendingPageContent() {
  const params = useSearchParams();
  const email = params.get('email');

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-border bg-cream rounded-2xl p-8">
        <h1 className="text-2xl font-light text-ink">Verification Pending</h1>
        <p className="text-sm text-muted mt-3">
          We sent a verification email{email ? ` to ${email}` : ''}. Please verify your email before accessing the dashboard.
        </p>
        <p className="text-sm text-muted mt-2">
          After verifying, return to login and continue.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <Link href="/login" className="text-sm text-ink hover:text-amber transition-colors">
            Back to login
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-ink transition-colors">
            Go to home
          </Link>
        </div>
      </div>
    </div>
  );
}
