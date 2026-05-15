'use client';

import { useState, useCallback } from 'react';
import {
  reviewsService,
  type ApproveReviewDto,
  type RejectReviewDto,
  type EditReviewDto,
} from '../services/reviews.service';

export function useReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async (id: string, dto: ApproveReviewDto) => {
    setLoading(true);
    setError(null);
    try {
      return await reviewsService.approve(id, dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reject = useCallback(async (id: string, dto: RejectReviewDto) => {
    setLoading(true);
    setError(null);
    try {
      await reviewsService.reject(id, dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const edit = useCallback(async (id: string, dto: EditReviewDto) => {
    setLoading(true);
    setError(null);
    try {
      await reviewsService.edit(id, dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Edit failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, approve, reject, edit };
}
