'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { apiClient } from '@/lib/api/client';
import { clearAuthSession, getAccessToken } from '@/lib/api/session';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ContentArea from './ContentArea';

interface AuthenticatedShellProps {
  children: React.ReactNode;
}

export default function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [validatedPath, setValidatedPath] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    let mounted = true;

    apiClient
      .get(API_ENDPOINTS.AUTH.ME)
      .then(() => {
        if (mounted) setValidatedPath(pathname);
      })
      .catch((error: { response?: { status?: number } }) => {
        if (!mounted) return;

        if (error?.response?.status === 403) {
          clearAuthSession();
          router.replace('/verification-pending');
          return;
        }

        clearAuthSession();
        router.replace('/login');
      });

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  if (validatedPath !== pathname) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <p className="text-sm text-muted">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/35"
          />
          <div className="relative h-full">
            <Sidebar mobile onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
          <ContentArea>{children}</ContentArea>
        </div>
      </div>
    </div>
  );
}
