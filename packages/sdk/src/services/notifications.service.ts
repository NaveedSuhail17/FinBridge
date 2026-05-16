import { apiClient } from '../api-client';

export interface NotificationItem {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  meta: { total: number; page: number; limit: number };
}

export const notificationsService = {
  async list(page = 1, limit = 20): Promise<NotificationListResponse> {
    const res = await apiClient.get<NotificationListResponse>(
      `/notifications?page=${page}&limit=${limit}`,
    );
    return res.data as unknown as NotificationListResponse;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },
};
