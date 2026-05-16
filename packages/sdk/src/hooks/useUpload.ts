'use client';

import { useState, useCallback } from 'react';
import { uploadsService } from '../services/uploads.service';
import type { Upload } from '@finbridge/types';
import type { UploadProgressEvent } from '../types';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface UploadState {
  status: UploadStatus;
  progress: number;
  upload: Upload | null;
  error: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    upload: null,
    error: null,
  });

  const uploadFile = useCallback(async (file: File, documentType?: string) => {
    setState({ status: 'uploading', progress: 0, upload: null, error: null });

    try {
      const upload = await uploadsService.upload(
        file,
        (event: UploadProgressEvent) => {
          setState((prev) => ({ ...prev, progress: event.percent }));
        },
        documentType,
      );
      setState({ status: 'processing', progress: 100, upload, error: null });
      return upload;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setState({ status: 'error', progress: 0, upload: null, error: message });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, upload: null, error: null });
  }, []);

  return { ...state, uploadFile, reset };
}
