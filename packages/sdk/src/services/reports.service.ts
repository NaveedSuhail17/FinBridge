import { apiClient } from '../api-client';
import type { MISReport } from '@finbridge/types';
import type { UploadProgressEvent } from '../types';

export type ReportType = 'EXPENSE_SUMMARY' | 'VENDOR_SUMMARY' | 'CATEGORY_BREAKDOWN' | 'CASH_FLOW';

export interface GenerateReportDto {
  type: ReportType;
  dateFrom: string;
  dateTo: string;
  companyId?: string;
}

export interface ShareReportDto {
  expiresIn: '7d' | '30d' | 'never';
}

export interface ShareLink {
  url: string;
  expiresAt: string | null;
}

export const reportsService = {
  async list(): Promise<MISReport[]> {
    const { data } = await apiClient.get<MISReport[]>('/reports');
    return data;
  },

  async upload(file: File, onProgress?: (event: UploadProgressEvent) => void): Promise<MISReport> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<MISReport>('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
          });
        }
      },
    });
    return data;
  },

  async generate(dto: GenerateReportDto): Promise<MISReport> {
    const { data } = await apiClient.post<MISReport>('/reports/generate', dto);
    return data;
  },

  downloadUrl(id: string): string {
    const base =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      'http://localhost:3001/api/v1';
    return `${base}/reports/${id}/download`;
  },

  async share(id: string, dto: ShareReportDto): Promise<ShareLink> {
    const { data } = await apiClient.post<ShareLink>(`/reports/${id}/share`, dto);
    return data;
  },
};
