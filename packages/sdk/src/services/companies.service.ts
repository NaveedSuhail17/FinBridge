import { apiClient } from '../api-client';
import type { Company, BusinessTypeTemplate } from '@finbridge/types';
import type { BusinessType } from '@finbridge/types';

export interface CreateCompanyDto {
  name: string;
  gstNumber?: string;
  businessType: BusinessType;
  accountingFirmId: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  gstNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CompanyDetails {
  company: Company;
  invoiceCount: number;
  pendingReviewCount: number;
  transactionTotal: number;
}

export const companiesService = {
  async list(): Promise<Company[]> {
    const { data } = await apiClient.get<Company[]>('/companies');
    return data;
  },

  async get(id: string): Promise<Company> {
    const { data } = await apiClient.get<Company>(`/companies/${id}`);
    return data;
  },

  async getDetails(id: string): Promise<CompanyDetails> {
    const { data } = await apiClient.get<CompanyDetails>(`/companies/${id}/details`);
    return data;
  },

  async create(dto: CreateCompanyDto): Promise<Company> {
    const { data } = await apiClient.post<Company>('/companies', dto);
    return data;
  },

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const { data } = await apiClient.patch<Company>(`/companies/${id}`, dto);
    return data;
  },

  async getBusinessTypeTemplate(type: BusinessType): Promise<BusinessTypeTemplate> {
    const { data } = await apiClient.get<BusinessTypeTemplate>(`/templates/business-types/${type}`);
    return data;
  },
};
