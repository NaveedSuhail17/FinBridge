import { apiClient } from '../api-client';
import type { ExtractionJob, ExtractionResult } from '@finbridge/types';

export interface ExtractionJobStatus extends ExtractionJob {
  result?: ExtractionResult;
}

export const extractionService = {
  async getStatus(jobId: string): Promise<ExtractionJobStatus> {
    const { data } = await apiClient.get<ExtractionJobStatus>(`/ai/extract/${jobId}`);
    return data;
  },
};
