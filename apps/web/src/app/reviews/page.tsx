'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { reviewsService } from '@finbridge/sdk';
import { Button, Badge } from '@finbridge/ui';
import { ReviewStatus } from '@finbridge/types';
import type { Review } from '@finbridge/types';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell';
import { ClipboardCheck, Clock } from 'lucide-react';

const LIMIT = 20;

function statusColor(status: ReviewStatus): 'default' | 'secondary' | 'destructive' {
  if (status === ReviewStatus.APPROVED) return 'default';
  if (status === ReviewStatus.REJECTED) return 'destructive';
  return 'secondary';
}

interface ReviewRow {
  review: Review;
  idx: number;
  ageHours: number;
  isStale: boolean;
}

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    reviewsService
      .listPending(page, LIMIT)
      .then(({ data, meta }) => {
        if (!cancelled) {
          setReviews(data);
          setTotal(meta?.total ?? data.length);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReviews([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  const rows: ReviewRow[] = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return reviews.map((review, idx) => {
      const ageHours = Math.round((now - new Date(review.createdAt).getTime()) / (1000 * 60 * 60));
      return { review, idx, ageHours, isStale: ageHours > 48 };
    });
  }, [reviews]);

  return (
    <ProtectedRoute allowedRoles={['ACCOUNTING_FIRM_ADMIN', 'ACCOUNTANT', 'COMPANY_USER']}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
            <p className="text-muted-foreground">
              {total} pending review{total !== 1 ? 's' : ''} awaiting action
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground text-sm">Loading reviews…</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed">
              <ClipboardCheck className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No pending reviews</p>
              <p className="text-sm text-muted-foreground">All invoices have been reviewed</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map(({ review, idx, ageHours, isStale }) => (
                    <tr key={review.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        Review #{idx + 1 + (page - 1) * LIMIT}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {review.tenantId.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColor(review.status)}>{review.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`flex items-center gap-1 text-xs ${
                            isStale ? 'text-destructive' : 'text-muted-foreground'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {ageHours < 1 ? 'Just now' : `${ageHours}h ago`}
                          {isStale && ' (escalated)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => router.push(`/reviews/${review.id}`)}>
                          Review
                        </Button>
                      </td>
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
