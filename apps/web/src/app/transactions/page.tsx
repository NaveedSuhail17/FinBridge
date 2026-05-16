'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { transactionsService, paymentHeadsService } from '@finbridge/sdk';
import type { TransactionFilters } from '@finbridge/sdk';
import {
  Button,
  Badge,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@finbridge/ui';
import { TransactionStatus } from '@finbridge/types';
import type { Transaction, PaymentHead } from '@finbridge/types';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell';
import { Receipt, X } from 'lucide-react';

const LIMIT = 25;

const BASE_FILTERS: TransactionFilters = { sortBy: 'transactionDate', sortOrder: 'DESC' };

function statusVariant(s: TransactionStatus): 'default' | 'secondary' | 'destructive' {
  if (s === TransactionStatus.APPROVED) return 'default';
  if (s === TransactionStatus.REJECTED) return 'destructive';
  return 'secondary';
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b last:border-0">
      <span className="text-muted-foreground text-sm shrink-0">{label}</span>
      <span className="text-sm text-right">{children}</span>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>(BASE_FILTERS);
  const [paymentHeads, setPaymentHeads] = useState<PaymentHead[]>([]);
  const [headMap, setHeadMap] = useState<Record<string, string>>({});
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    paymentHeadsService
      .list()
      .then((heads) => {
        setPaymentHeads(heads);
        setHeadMap(Object.fromEntries(heads.map((h) => [h.id, h.name])));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    transactionsService
      .list({ ...filters, page, limit: LIMIT })
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
  }, [filters, page]);

  const applyFilter = (key: keyof TransactionFilters, value: string | number | undefined) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(BASE_FILTERS);
  };

  const hasActiveFilters = Object.keys(filters).some(
    (k) =>
      !['sortBy', 'sortOrder'].includes(k) && filters[k as keyof TransactionFilters] !== undefined,
  );

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
              onClick={() => transactionsService.exportCsv({ ...filters })}
            >
              Export CSV
            </Button>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-3 items-end rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <Label className="text-xs">Vendor</Label>
              <Input
                placeholder="Search vendor…"
                className="w-40 h-8 text-sm"
                value={filters.vendorName ?? ''}
                onChange={(e) => applyFilter('vendorName', e.target.value || undefined)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                className="w-36 h-8 text-sm"
                value={filters.dateFrom ?? ''}
                onChange={(e) => applyFilter('dateFrom', e.target.value || undefined)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                className="w-36 h-8 text-sm"
                value={filters.dateTo ?? ''}
                onChange={(e) => applyFilter('dateTo', e.target.value || undefined)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payment Head</Label>
              <Select
                value={filters.paymentHeadId ?? '__ALL__'}
                onValueChange={(v) => applyFilter('paymentHeadId', v === '__ALL__' ? undefined : v)}
              >
                <SelectTrigger className="w-44 h-8 text-sm">
                  <SelectValue placeholder="All heads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">All heads</SelectItem>
                  {paymentHeads.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Min Amount</Label>
              <Input
                type="number"
                placeholder="0"
                className="w-28 h-8 text-sm"
                value={filters.amountMin ?? ''}
                onChange={(e) =>
                  applyFilter('amountMin', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Amount</Label>
              <Input
                type="number"
                placeholder="∞"
                className="w-28 h-8 text-sm"
                value={filters.amountMax ?? ''}
                onChange={(e) =>
                  applyFilter('amountMax', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground text-sm">Loading transactions…</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed">
              <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No transactions found</p>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Approved invoices will appear here'}
              </p>
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
                      Payment Head
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="px-4 py-3 font-medium">{tx.vendorName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(tx.transactionDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {fmt(tx.amount, tx.currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {headMap[tx.paymentHeadId] ?? '—'}
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

        {/* Transaction detail modal */}
        <Dialog
          open={!!selectedTx}
          onOpenChange={(open) => {
            if (!open) setSelectedTx(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTx?.vendorName}</DialogTitle>
            </DialogHeader>
            {selectedTx && (
              <div className="mt-2">
                <DetailRow label="Amount">
                  <span className="font-mono font-medium">
                    {fmt(selectedTx.amount, selectedTx.currency)}
                  </span>
                </DetailRow>
                <DetailRow label="Date">
                  {new Date(selectedTx.transactionDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </DetailRow>
                <DetailRow label="Currency">{selectedTx.currency}</DetailRow>
                <DetailRow label="Payment Head">
                  {headMap[selectedTx.paymentHeadId] ?? (
                    <span className="font-mono text-xs">{selectedTx.paymentHeadId}</span>
                  )}
                </DetailRow>
                <DetailRow label="Status">
                  <Badge variant={statusVariant(selectedTx.status)}>{selectedTx.status}</Badge>
                </DetailRow>
                {selectedTx.notes && <DetailRow label="Notes">{selectedTx.notes}</DetailRow>}
                <DetailRow label="Created">
                  {new Date(selectedTx.createdAt).toLocaleString('en-IN')}
                </DetailRow>
                <DetailRow label="ID">
                  <span className="font-mono text-xs">{selectedTx.id}</span>
                </DetailRow>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AppShell>
    </ProtectedRoute>
  );
}
