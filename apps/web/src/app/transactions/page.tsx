'use client';

import { useState, useEffect } from 'react';
import { transactionsService } from '@finbridge/sdk';
import { Button, Badge } from '@finbridge/ui';
import { TransactionStatus } from '@finbridge/types';
import type { Transaction } from '@finbridge/types';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell';
import { Receipt } from 'lucide-react';

const LIMIT = 25;

function statusVariant(s: TransactionStatus): 'default' | 'secondary' | 'destructive' {
  if (s === TransactionStatus.APPROVED) return 'default';
  if (s === TransactionStatus.REJECTED) return 'destructive';
  return 'secondary';
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    transactionsService
      .list({ page, limit: LIMIT, sortBy: 'transactionDate', sortOrder: 'DESC' })
      .then(({ data, meta }) => {
        if (!cancelled) {
          setTransactions(data);
          setTotal(meta?.total ?? data.length);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTransactions([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
              <p className="text-muted-foreground">
                {total} approved transaction{total !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                transactionsService.exportCsv({ sortBy: 'transactionDate', sortOrder: 'DESC' })
              }
            >
              Export CSV
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground text-sm">Loading transactions…</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed">
              <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No transactions yet</p>
              <p className="text-sm text-muted-foreground">Approved invoices will appear here</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Vendor
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{tx.vendorName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(tx.transactionDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {fmt(tx.amount, tx.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(tx.status)}>{tx.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{tx.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {total > LIMIT && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * LIMIT >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
