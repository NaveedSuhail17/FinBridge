import { apiClient } from '../api-client';
import type { PaymentHead, PaymentSubHead, BusinessTypeTemplate } from '@finbridge/types';
import type { BusinessType } from '@finbridge/types';

export interface PaymentHeadWithSubHeads extends PaymentHead {
  subHeads: PaymentSubHead[];
}

export interface CreatePaymentHeadDto {
  code: string;
  name: string;
  description?: string;
}

export interface UpdatePaymentHeadDto {
  code?: string;
  name?: string;
  description?: string;
}

export const paymentHeadsService = {
  async list(): Promise<PaymentHead[]> {
    const { data } = await apiClient.get<PaymentHead[]>('/payment-heads');
    return data;
  },

  async listWithSubHeads(): Promise<PaymentHeadWithSubHeads[]> {
    const { data } = await apiClient.get<PaymentHeadWithSubHeads[]>('/payment-heads/with-subheads');
    return data;
  },

  async get(id: string): Promise<PaymentHead> {
    const { data } = await apiClient.get<PaymentHead>(`/payment-heads/${id}`);
    return data;
  },

  async create(dto: CreatePaymentHeadDto): Promise<PaymentHead> {
    const { data } = await apiClient.post<PaymentHead>('/payment-heads', dto);
    return data;
  },

  async update(id: string, dto: UpdatePaymentHeadDto): Promise<PaymentHead> {
    const { data } = await apiClient.patch<PaymentHead>(`/payment-heads/${id}`, dto);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/payment-heads/${id}`);
  },

  exportCsvUrl(): string {
    const base =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      'http://localhost:3001/api/v1';
    return `${base}/payment-heads/export`;
  },

  async getTemplate(type: BusinessType): Promise<BusinessTypeTemplate> {
    const { data } = await apiClient.get<BusinessTypeTemplate>(`/templates/business-types/${type}`);
    return data;
  },
};
