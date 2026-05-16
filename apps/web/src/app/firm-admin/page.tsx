'use client';

import { useState, useEffect } from 'react';
import { paymentHeadsService } from '@finbridge/sdk';
import type { PaymentHeadWithSubHeads } from '@finbridge/sdk';
import {
  Button,
  Badge,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@finbridge/ui';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell';
import { Plus, Trash2, ChevronRight } from 'lucide-react';

function PaymentHeadsTab() {
  const [heads, setHeads] = useState<PaymentHeadWithSubHeads[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    paymentHeadsService
      .listWithSubHeads()
      .then((data) => setHeads(data))
      .catch(() => setHeads([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newCode.trim() || !newName.trim()) {
      setCreateError('Code and name are required');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await paymentHeadsService.create({
        code: newCode.trim(),
        name: newName.trim(),
      });
      setHeads((prev) => [...prev, { ...created, subHeads: [] }]);
      setNewCode('');
      setNewName('');
      setShowCreate(false);
    } catch {
      setCreateError('Failed to create payment head');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment head? This will fail if any transactions reference it.'))
      return;
    try {
      await paymentHeadsService.remove(id);
      setHeads((prev) => prev.filter((h) => h.id !== id));
    } catch {
      alert('Cannot delete: transactions or sub-heads still reference this payment head.');
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{heads.length} payment heads configured</p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Head
        </Button>
      </div>

      <div className="rounded-lg border divide-y">
        {heads.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No payment heads yet. Add one to get started.
          </div>
        ) : (
          heads.map((head) => (
            <div key={head.id}>
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                <button
                  onClick={() => toggleExpanded(head.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      expanded.has(head.id) ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {head.code}
                </span>
                <span className="flex-1 font-medium text-sm">{head.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {head.subHeads.length} sub-heads
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(head.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              {expanded.has(head.id) && head.subHeads.length > 0 && (
                <div className="border-t bg-muted/20 divide-y">
                  {head.subHeads.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 px-10 py-2.5 text-sm">
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {sub.code}
                      </span>
                      <span className="text-muted-foreground">{sub.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Head</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g. EXP-001"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Operating Expenses"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Tab = 'payment-heads' | 'settings';

export default function FirmAdminPage() {
  const [tab, setTab] = useState<Tab>('payment-heads');

  return (
    <ProtectedRoute allowedRoles={['ACCOUNTING_FIRM_ADMIN']}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Firm Admin</h1>
            <p className="text-muted-foreground">
              Manage your accounting firm settings and chart of accounts
            </p>
          </div>

          <div className="flex gap-1 border-b">
            {[
              { id: 'payment-heads' as Tab, label: 'Payment Heads' },
              { id: 'settings' as Tab, label: 'Settings' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'payment-heads' && <PaymentHeadsTab />}
          {tab === 'settings' && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="font-semibold mb-4">Firm Settings</h2>
              <p className="text-sm text-muted-foreground">
                Contact support to update your firm&apos;s profile, GST number, or subscription
                details.
              </p>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
