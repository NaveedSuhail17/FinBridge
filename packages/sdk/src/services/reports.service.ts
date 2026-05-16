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

  async download(id: string): Promise<void> {
    const response = await apiClient.get(`/reports/${id}/download`, { responseType: 'blob' });
    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    let filename = `report-${id}`;
    if (contentDisposition) {
      const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (match?.[1]) filename = match[1].replace(/['"]/g, '');
    }
    const url = URL.createObjectURL(new Blob([response.data as BlobPart]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  async share(id: string, dto: ShareReportDto): Promise<ShareLink> {
    const { data } = await apiClient.post<ShareLink>(`/reports/${id}/share`, dto);
    return data;
  },
};
