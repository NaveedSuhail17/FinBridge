import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';

interface AuthStore {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth(payload: { token: string; refreshToken: string; user: AuthUser }): void;
  clearAuth(): void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: ({ token, refreshToken, user }) => set({ token, refreshToken, user }),
      clearAuth: () => set({ token: null, refreshToken: null, user: null }),
    }),
    { name: 'finbridge-auth' },
  ),
);
