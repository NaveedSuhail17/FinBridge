import { apiClient } from '../api-client';
import type { Upload } from '@finbridge/types';
import type { UploadProgressEvent } from '../types';

export const uploadsService = {
  async upload(file: File, onProgress?: (event: UploadProgressEvent) => void): Promise<Upload> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<Upload>('/uploads', formData, {
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

  fileUrl(id: string): string {
    const base =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      'http://localhost:3001/api/v1';
    return `${base}/uploads/${id}/file`;
  },

  downloadUrl(id: string): string {
    const base =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      'http://localhost:3001/api/v1';
    return `${base}/uploads/${id}/download`;
  },
};
