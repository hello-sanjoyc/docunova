import type { Metadata } from 'next';
import AuthenticatedShell from '@/components/authenticated/AuthenticatedShell';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
