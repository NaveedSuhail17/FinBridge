'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  transactionsService,
  type TransactionFilters,
  type TransactionListResponse,
} from '../services/transactions.service';

export function useTransactionList(filters: TransactionFilters = {}) {
  const [result, setResult] = useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = JSON.stringify(filters);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionsService.list(filters);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const exportCsv = useCallback(() => {
    const url = transactionsService.exportCsvUrl(filters);
    window.open(url, '_blank');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { result, loading, error, refetch: fetch, exportCsv };
}
