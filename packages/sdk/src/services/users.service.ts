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

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  tenantId: string;
  roleName: 'PLATFORM_ADMIN' | 'ACCOUNTING_FIRM_ADMIN' | 'ACCOUNTANT' | 'COMPANY_USER';
}

export const usersService = {
  async createUser(dto: CreateUserDto): Promise<AdminUserEntry> {
    const { data } = await apiClient.post<AdminUserEntry>('/users', dto);
    return data;
  },

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
