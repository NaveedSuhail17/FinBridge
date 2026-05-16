import { apiClient } from '../api-client';
import type { Upload } from '@finbridge/types';
import type { UploadProgressEvent } from '../types';

export interface UploadResult {
  upload: Upload;
  extractionJobId: string;
}

export const uploadsService = {
  async upload(
    file: File,
    onProgress?: (event: UploadProgressEvent) => void,
    documentType?: string,
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const params = documentType ? { document_type: documentType } : undefined;

    const { data } = await apiClient.post<UploadResult>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
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

  async uploadBulk(
    files: File[],
    documentType = 'BANK_STATEMENT',
  ): Promise<Array<{ uploadId: string; extractionJobId: string; fileName: string }>> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    const { data } = await apiClient.post<
      Array<{ uploadId: string; extractionJobId: string; fileName: string }>
    >('/uploads/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { document_type: documentType },
    });
    return data as unknown as Array<{
      uploadId: string;
      extractionJobId: string;
      fileName: string;
    }>;
  },

  async list(): Promise<Upload[]> {
    const { data } = await apiClient.get<Upload[]>('/uploads');
    return data;
  },

  async get(id: string): Promise<Upload> {
    const { data } = await apiClient.get<Upload>(`/uploads/${id}`);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/uploads/${id}`);
  },

  fileUrl(id: string, token?: string | null): string {
    const base =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      'http://localhost:3001/api/v1';
    const url = `${base}/uploads/${id}/file`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  },

  downloadUrl(id: string, token?: string | null): string {
    const base =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      'http://localhost:3001/api/v1';
    const url = `${base}/uploads/${id}/download`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  },
};
