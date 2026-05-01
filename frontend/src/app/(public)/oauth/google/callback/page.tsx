'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { clearAuthSession, setAuthSession } from '@/lib/api/session';

function safeTargetPath(target: string | null): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return '/dashboard';
  }
  return target;
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleOAuthCallbackPageContent />
    </Suspense>
  );
}

function GoogleOAuthCallbackPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params?.get('accessToken');
    const refreshToken = params?.get('refreshToken');
    const target = safeTargetPath(params?.get('target') ?? null);
    const email = params?.get('email') || '';
    const verified = params?.get('verified');

    if (!accessToken || !refreshToken) {
      clearAuthSession();
      router.replace('/login?oauthError=missing_tokens');
      return;
    }

    setAuthSession(accessToken, refreshToken);

    if (verified === '0') {
      router.replace(
        `/verification-pending${email ? `?email=${encodeURIComponent(email)}` : ''}`
      );
      return;
    }

    router.replace(target);
  }, [params, router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-light text-ink">Completing Google sign-in</h1>
        <p className="mt-2 text-sm text-muted">Redirecting you to DocuNova AI...</p>
      </div>
    </div>
  );
}
