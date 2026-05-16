import { apiClient } from '../api-client';

export interface CashFlowMonth {
  month: number;
  label: string;
  total: number;
}

export interface CashFlowResponse {
  year: number;
  months: CashFlowMonth[];
}

export interface ExpenseHeadEntry {
  headId: string;
  name: string;
  total: number;
  percentage: number;
}

export interface TopExpenseHeadsResponse {
  period: number;
  heads: ExpenseHeadEntry[];
}

export interface UploadFunnelResponse {
  uploaded: number;
  extracted: number;
  reviewed: number;
  approved: number;
}

export interface VendorEntry {
  vendorName: string;
  total: number;
  count: number;
}

export interface VendorSummaryResponse {
  period: number;
  vendors: VendorEntry[];
}

export const insightsService = {
  async getCashFlow(year?: number): Promise<CashFlowResponse> {
    const params = year ? `?year=${year}` : '';
    const res = await apiClient.get<CashFlowResponse>(`/reports/insights/cash-flow${params}`);
    return res.data as unknown as CashFlowResponse;
  },

  async getTopExpenseHeads(period?: number): Promise<TopExpenseHeadsResponse> {
    const params = period ? `?period=${period}` : '';
    const res = await apiClient.get<TopExpenseHeadsResponse>(
      `/reports/insights/top-expense-heads${params}`,
    );
    return res.data as unknown as TopExpenseHeadsResponse;
  },

  async getUploadFunnel(): Promise<UploadFunnelResponse> {
    const res = await apiClient.get<UploadFunnelResponse>('/reports/insights/upload-funnel');
    return res.data as unknown as UploadFunnelResponse;
  },

  async getVendorSummary(period?: number): Promise<VendorSummaryResponse> {
    const params = period ? `?period=${period}` : '';
    const res = await apiClient.get<VendorSummaryResponse>(
      `/reports/insights/vendor-summary${params}`,
    );
    return res.data as unknown as VendorSummaryResponse;
  },
};
