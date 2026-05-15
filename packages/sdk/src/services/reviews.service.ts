import { apiClient } from '../api-client';
import type { Review } from '@finbridge/types';
import type { PaginatedMeta } from '../types';

export interface ReviewDetail extends Review {
  extractionResult: {
    parsedResponse: Record<string, unknown>;
    rawResponse: string;
    confidenceScore: number;
    fieldConfidences?: Record<string, number>;
  };
  upload: {
    id: string;
    filePath: string;
    fileName: string;
    mimeType: string;
  };
}

export interface ApproveReviewDto {
  notes?: string;
  paymentHeadId?: string;
  paymentSubHeadId?: string;
}

export interface RejectReviewDto {
  reason: string;
  notes?: string;
}

export interface EditReviewDto {
  fields: Record<string, unknown>;
}

export interface PendingReviewsResponse {
  data: Review[];
  meta: PaginatedMeta;
}

export const reviewsService = {
  async listPending(page = 1, limit = 20): Promise<PendingReviewsResponse> {
    const { data, ...rest } = await apiClient.get<Review[]>('/reviews/pending', {
      params: { page, limit },
    });
    return { data, ...(rest as unknown as { meta: PaginatedMeta }) };
  },

  async get(id: string): Promise<ReviewDetail> {
    const { data } = await apiClient.get<ReviewDetail>(`/reviews/${id}`);
    return data;
  },

  async approve(id: string, dto: ApproveReviewDto): Promise<unknown> {
    const { data } = await apiClient.post(`/reviews/${id}/approve`, dto);
    return data;
  },

  async reject(id: string, dto: RejectReviewDto): Promise<void> {
    await apiClient.post(`/reviews/${id}/reject`, dto);
  },

  async edit(id: string, dto: EditReviewDto): Promise<void> {
    await apiClient.patch(`/reviews/${id}/edit`, dto);
  },
};
