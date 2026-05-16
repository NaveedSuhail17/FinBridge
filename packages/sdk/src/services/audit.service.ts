import { apiClient } from '../api-client';
import type { AuditLog } from '@finbridge/types';
import type { PaginatedMeta } from '../types';

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  entityType?: string;
  action?: string;
}

export interface AuditLogListResponse {
  data: AuditLog[];
  meta: PaginatedMeta;
}

export const auditService = {
  async list(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
    const { data } = await apiClient.get<{ data: AuditLog[]; meta: PaginatedMeta }>('/audit-logs', {
      params: filters,
    });
    return data as AuditLogListResponse;
  },

  exportCsvUrl(filters: AuditLogFilters = {}): string {
    const params = new URLSearchParams(
      Object.entries(filters)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)]),
    );
    const base =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      'http://localhost:3001/api/v1';
    return `${base}/audit-logs/export?${params}`;
  },
};
