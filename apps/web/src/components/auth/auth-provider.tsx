'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@finbridge/sdk';
import { authService } from '@finbridge/sdk';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, refreshToken, setAuth, clearAuth } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // If we have a refresh token but no access token (e.g. after page refresh),
    // silently re-acquire the access token so ProtectedRoute stays happy.
    if (!token && refreshToken) {
      authService
        .refresh(refreshToken)
        .then((tokens) => {
          setAuth({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: tokens.user,
          });
        })
        .catch(() => {
          clearAuth();
        });
    }
  }, [token, refreshToken, setAuth, clearAuth]);

  return <>{children}</>;
}
