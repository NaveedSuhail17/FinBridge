'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { reviewsService, paymentHeadsService, uploadsService } from '@finbridge/sdk';
import type { ReviewDetail, ApproveReviewDto, RejectReviewDto } from '@finbridge/sdk';
import {
  ExtractionForm,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@finbridge/ui';
import type { ExtractionField } from '@finbridge/ui';
import type { PaymentHeadWithSubHeads } from '@finbridge/sdk';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell';
import { ChevronLeft, Check, X, Pencil } from 'lucide-react';

const REJECT_REASONS = [
  'Duplicate invoice',
  'Incorrect amount',
  'Invalid vendor details',
  'Missing required fields',
  'Document unclear/illegible',
  'Wrong tax calculation',
  'Other',
];

function buildExtractionFields(
  parsed: Record<string, unknown>,
  confidences: Record<string, number> = {},
): ExtractionField[] {
  const fieldLabels: Record<string, string> = {
    vendorName: 'Vendor Name',
    invoiceNumber: 'Invoice Number',
    invoiceDate: 'Invoice Date',
    amount: 'Total Amount',
    subtotal: 'Subtotal',
    taxAmount: 'Tax Amount',
    currency: 'Currency',
    paymentTerms: 'Payment Terms',
    description: 'Description',
  };

  return Object.entries(parsed)
    .filter(([key]) => fieldLabels[key])
    .map(([key, value]) => ({
      key,
      label: fieldLabels[key] ?? key,
      value: value == null ? null : String(value),
      confidence: confidences[key],
      editable: true,
    }));
}

export function ReviewDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [paymentHeads, setPaymentHeads] = useState<PaymentHeadWithSubHeads[]>([]);
  const [selectedHead, setSelectedHead] = useState('');
  const [selectedSubHead, setSelectedSubHead] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([reviewsService.get(id), paymentHeadsService.listWithSubHeads().catch(() => [])])
      .then(([r, heads]) => {
        setReview(r);
        setPaymentHeads(heads);
      })
      .catch(() => setError('Failed to load review'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFieldChange = (key: string, value: string) => {
    setEditedFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEdits = async () => {
    if (!review || Object.keys(editedFields).length === 0) return;
    try {
      await reviewsService.edit(id, { fields: editedFields });
      setEditedFields({});
    } catch {
      setActionError('Failed to save edits');
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      if (Object.keys(editedFields).length > 0) {
        await reviewsService.edit(id, { fields: editedFields });
      }
      const dto: ApproveReviewDto = {
        notes: '',
        ...(selectedHead && { paymentHeadId: selectedHead }),
        ...(selectedSubHead && { paymentSubHeadId: selectedSubHead }),
      };
      await reviewsService.approve(id, dto);
      setShowApproveDialog(false);
      router.push('/reviews');
    } catch {
      setActionError('Approval failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const dto: RejectReviewDto = { reason: rejectReason, notes: rejectNotes || undefined };
      await reviewsService.reject(id, dto);
      setShowRejectDialog(false);
      router.push('/reviews');
    } catch {
      setActionError('Rejection failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      setShowApproveDialog(true);
    }
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      setShowRejectDialog(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading review…</p>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !review) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-destructive">{error ?? 'Review not found'}</p>
            <Button variant="outline" onClick={() => router.push('/reviews')}>
              Back to Reviews
            </Button>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const parsed = review.extractionResult?.parsedResponse ?? {};
  const confidences = review.extractionResult?.fieldConfidences ?? {};
  const fields = buildExtractionFields(parsed, confidences);
  const documentUrl = review.upload?.id ? uploadsService.fileUrl(review.upload.id) : '';
  const isImage = review.upload?.mimeType?.startsWith('image/');

  const subHeads = paymentHeads.find((h) => h.id === selectedHead)?.subHeads ?? [];

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col h-full gap-4">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/reviews')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                All Reviews
              </Button>
              <Badge variant="secondary">{review.status}</Badge>
              {review.escalatedAt && <Badge variant="destructive">Escalated</Badge>}
            </div>
            <div className="flex items-center gap-2">
              {Object.keys(editedFields).length > 0 && (
                <Button variant="outline" size="sm" onClick={handleSaveEdits}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Save Edits
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => setShowRejectDialog(true)}>
                <X className="h-3.5 w-3.5 mr-1" />
                Reject
                <span className="ml-1.5 text-xs opacity-60">Ctrl+R</span>
              </Button>
              <Button size="sm" onClick={() => setShowApproveDialog(true)}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Approve
                <span className="ml-1.5 text-xs opacity-60">Ctrl+Enter</span>
              </Button>
            </div>
          </div>

          {actionError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </div>
          )}

          <div className="flex flex-1 gap-4 min-h-0">
            <div className="w-2/5 rounded-lg border bg-card overflow-hidden flex flex-col">
              <div className="p-3 border-b bg-muted/40 shrink-0">
                <p className="text-sm font-medium">{review.upload?.fileName ?? 'Document'}</p>
                <p className="text-xs text-muted-foreground">
                  Confidence: {((review.extractionResult?.confidenceScore ?? 0) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={documentUrl}
                    alt="Invoice document"
                    className="w-full h-full object-contain p-2"
                  />
                ) : documentUrl ? (
                  <iframe src={documentUrl} className="w-full h-full" title="Invoice document" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Document preview unavailable
                  </div>
                )}
              </div>
            </div>

            <div className="w-3/5 rounded-lg border bg-card overflow-y-auto">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Extracted Fields</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Edit any field before approving. Changes are tracked in the audit log.
                </p>
              </div>
              <div className="p-4">
                <ExtractionForm fields={fields} onChange={handleFieldChange} />
              </div>
            </div>
          </div>
        </div>

        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Invoice</DialogTitle>
              <DialogDescription>
                Assign a payment category and confirm approval. This will create a transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Payment Head</Label>
                <Select value={selectedHead} onValueChange={setSelectedHead}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment head…" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentHeads.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.code} – {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {subHeads.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Payment Sub-Head</Label>
                  <Select value={selectedSubHead} onValueChange={setSelectedSubHead}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-head…" />
                    </SelectTrigger>
                    <SelectContent>
                      {subHeads.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code} – {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {actionError && <p className="text-sm text-destructive">{actionError}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={submitting}>
                {submitting ? 'Approving…' : 'Confirm Approval'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Invoice</DialogTitle>
              <DialogDescription>
                Select a rejection reason. The company will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Select value={rejectReason} onValueChange={setRejectReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason…" />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECT_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Additional notes (optional)</Label>
                <Input
                  placeholder="Provide more context…"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                />
              </div>
              {actionError && <p className="text-sm text-destructive">{actionError}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason || submitting}
              >
                {submitting ? 'Rejecting…' : 'Confirm Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppShell>
    </ProtectedRoute>
  );
}
