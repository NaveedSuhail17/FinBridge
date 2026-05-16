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
    const { data } = await apiClient.get<{ data: Transaction[]; meta: PaginatedMeta }>(
      '/transactions',
      { params: filters },
    );
    return data as TransactionListResponse;
  },

  async get(id: string): Promise<Transaction> {
    const { data } = await apiClient.get<Transaction>(`/transactions/${id}`);
    return data;
  },

  async update(id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const { data } = await apiClient.patch<Transaction>(`/transactions/${id}`, dto);
    return data;
  },

  async exportCsv(filters: TransactionFilters = {}): Promise<void> {
    const response = await apiClient.get('/transactions/export', {
      params: filters,
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};
