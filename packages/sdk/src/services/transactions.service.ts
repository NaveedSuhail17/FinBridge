import { apiClient } from '../api-client';
import type { Transaction } from '@finbridge/types';
import type { PaginatedMeta } from '../types';

export interface TransactionFilters {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  paymentHeadId?: string;
  vendorName?: string;
  amountMin?: number;
  amountMax?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface UpdateTransactionDto {
  paymentHeadId?: string;
  paymentSubHeadId?: string;
  notes?: string;
}

export interface TransactionListResponse {
  data: Transaction[];
  meta: PaginatedMeta;
}

export const transactionsService = {
  async list(filters: TransactionFilters = {}): Promise<TransactionListResponse> {
    const response = await apiClient.get<Transaction[]>('/transactions', { params: filters });
    return response.data as unknown as TransactionListResponse;
  },

  async get(id: string): Promise<Transaction> {
    const { data } = await apiClient.get<Transaction>(`/transactions/${id}`);
    return data;
  },

  async update(id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const { data } = await apiClient.patch<Transaction>(`/transactions/${id}`, dto);
    return data;
  },

  exportCsvUrl(filters: TransactionFilters = {}): string {
    const params = new URLSearchParams(
      Object.entries(filters)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)]),
    );
    const base =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      'http://localhost:3001/api/v1';
    return `${base}/transactions/export?${params}`;
  },
};
