'use client';

import { useCallback } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authService, type LoginDto, type RegisterDto } from '../services/auth.service';

export function useAuth() {
  const { user, token, refreshToken, setAuth, clearAuth } = useAuthStore();

  const login = useCallback(
    async (dto: LoginDto) => {
      const tokens = await authService.login(dto);
      setAuth({ token: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user });
      return tokens;
    },
    [setAuth],
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      const tokens = await authService.register(dto);
      setAuth({ token: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user });
      return tokens;
    },
    [setAuth],
  );

  const logout = useCallback(async () => {
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // Clear local state regardless
      }
    }
    clearAuth();
  }, [refreshToken, clearAuth]);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };
}
