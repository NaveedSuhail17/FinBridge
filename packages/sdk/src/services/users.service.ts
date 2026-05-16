import { apiClient } from '../api-client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  tenant: { id: string; name: string; type: string };
  role: string;
}

export interface UpdateUserDto {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AdminUserEntry {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  role: string | null;
  tenant: { id: string; name: string; type: string } | null;
}

export const usersService = {
  async listAll(): Promise<AdminUserEntry[]> {
    const { data } = await apiClient.get<AdminUserEntry[]>('/users');
    return data;
  },

  async getMe(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>('/users/me');
    return data;
  },

  async updateMe(dto: UpdateUserDto): Promise<UserProfile> {
    const { data } = await apiClient.patch<UserProfile>('/users/me', dto);
    return data;
  },
};
