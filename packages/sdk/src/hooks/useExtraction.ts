'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { extractionService, type ExtractionJobStatus } from '../services/extraction.service';
import { ExtractionStatus } from '@finbridge/types';

const TERMINAL_STATES: ExtractionStatus[] = [
  ExtractionStatus.COMPLETED,
  ExtractionStatus.COMPLETED_WITH_ERRORS,
  ExtractionStatus.FAILED,
];

const POLL_INTERVAL_MS = 2000;

export function useExtraction(jobId: string | null) {
  const [job, setJob] = useState<ExtractionJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeJobId = useRef<string | null>(null);

  const poll = useCallback(async (id: string) => {
    try {
      const status = await extractionService.getStatus(id);
      setJob(status);

      const isTerminal = TERMINAL_STATES.includes(status.status as ExtractionStatus);
      if (!isTerminal && activeJobId.current === id) {
        timerRef.current = setTimeout(() => poll(id), POLL_INTERVAL_MS);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch extraction status');
    }
  }, []);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      return;
    }

    activeJobId.current = jobId;
    setJob(null);
    setError(null);
    void poll(jobId);

    return () => {
      activeJobId.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [jobId, poll]);

  const isTerminal = job ? TERMINAL_STATES.includes(job.status as ExtractionStatus) : false;

  return { job, error, isTerminal };
}
