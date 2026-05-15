'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@finbridge/sdk';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!token || !user) {
      router.replace(`/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [token, user, router, pathname]);

  if (!token || !user) return null;

  return <>{children}</>;
}
