import { apiClient } from '../api-client';
import type { AuthTokens } from '../types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface AcceptInviteDto {
  token: string;
  name: string;
  password: string;
}

export const authService = {
  async login(dto: LoginDto): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>('/auth/login', dto);
    return data;
  },

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>('/auth/register', dto);
    return data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
    return data;
  },

  async acceptInvite(dto: AcceptInviteDto): Promise<AuthTokens> {
    const { token, ...body } = dto;
    const { data } = await apiClient.post<AuthTokens>(`/auth/accept-invite?token=${token}`, body);
    return data;
  },
};
