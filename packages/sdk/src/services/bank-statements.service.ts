import { apiClient } from '../api-client';

export interface BankTransactionRow {
  date?: string;
  description?: string;
  debit?: number | null;
  credit?: number | null;
  balance?: number | null;
  suggested_head_id?: string | null;
  suggested_head_name?: string | null;
  suggested_sub_head_id?: string | null;
  suggested_sub_head_name?: string | null;
  [key: string]: unknown;
}

export interface BankStatementRecord {
  id: string;
  tenantId: string;
  uploadId: string;
  bankName: string | null;
  accountNumberMasked: string | null;
  accountHolder: string | null;
  currency: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  openingBalance: number | null;
  closingBalance: number | null;
  transactionRows: BankTransactionRow[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const bankStatementsService = {
  async list(
    page = 1,
    limit = 20,
    filters?: { periodStart?: string; periodEnd?: string },
  ): Promise<{
    data: BankStatementRecord[];
    meta: { total: number; page: number; limit: number };
  }> {
    const params: Record<string, string | number> = { page, limit };
    if (filters?.periodStart) params['period_start'] = filters.periodStart;
    if (filters?.periodEnd) params['period_end'] = filters.periodEnd;
    const res = await apiClient.get<BankStatementRecord[]>('/bank-statements', { params });
    return res.data as unknown as {
      data: BankStatementRecord[];
      meta: { total: number; page: number; limit: number };
    };
  },

  async findOne(id: string): Promise<BankStatementRecord> {
    const res = await apiClient.get<BankStatementRecord>(`/bank-statements/${id}`);
    return res.data as unknown as BankStatementRecord;
  },

  async getCategorized(id: string): Promise<BankStatementRecord> {
    const res = await apiClient.get<BankStatementRecord>(`/bank-statements/${id}/categorized`);
    return res.data as unknown as BankStatementRecord;
  },
};
