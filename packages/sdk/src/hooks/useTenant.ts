'use client';

import { useAuthStore } from '../store/auth.store';

export function useTenant() {
  const user = useAuthStore((s) => s.user);

  return {
    tenantId: user?.tenantId ?? null,
    tenantType: user?.tenantType ?? null,
    role: user?.role ?? null,
  };
}
