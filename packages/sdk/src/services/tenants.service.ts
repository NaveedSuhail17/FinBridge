import { apiClient } from '../api-client';

export interface TenantItem {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export const tenantsService = {
  async list(): Promise<TenantItem[]> {
    const { data } = await apiClient.get<TenantItem[]>('/tenants');
    return data;
  },
};
