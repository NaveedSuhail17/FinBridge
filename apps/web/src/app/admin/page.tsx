'use client';

import { useState, useEffect } from 'react';
import { auditService, companiesService } from '@finbridge/sdk';
import type { AuditLogFilters } from '@finbridge/sdk';
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
} from '@finbridge/ui';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell';
import type { AuditLog, Company } from '@finbridge/types';
import { AuditAction } from '@finbridge/types';
import { Shield, Building2, Users, BarChart3 } from 'lucide-react';

const ACTION_COLORS: Record<AuditAction, 'default' | 'secondary' | 'destructive'> = {
  [AuditAction.CREATE]: 'default',
  [AuditAction.READ]: 'secondary',
  [AuditAction.UPDATE]: 'secondary',
  [AuditAction.DELETE]: 'destructive',
  [AuditAction.LOGIN]: 'default',
  [AuditAction.LOGOUT]: 'secondary',
  [AuditAction.APPROVE]: 'default',
  [AuditAction.REJECT]: 'destructive',
};

function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);

  const LIMIT = 25;

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    auditService
      .list({ ...filters, page, limit: LIMIT })
      .then(({ data, meta }) => {
        if (!cancelled) {
          setLogs(data);
          setTotal(meta?.total ?? data.length);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLogs([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Entity type</Label>
          <Input
            placeholder="e.g. review"
            className="w-36 h-8 text-sm"
            value={filters.entityType ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value || undefined }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Action</Label>
          <Select
            value={filters.action ?? ''}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, action: (v as AuditAction) || undefined }))
            }
          >
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All actions</SelectItem>
              {Object.values(AuditAction).map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFilters({});
            setPage(1);
          }}
        >
          Reset
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Time</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Entity</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 text-xs">
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-medium">
                    {log.entityType}
                    <span className="text-muted-foreground ml-1 font-mono">
                      {log.entityId.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={ACTION_COLORS[log.action] ?? 'secondary'}>{log.action}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">
                    {log.userId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{log.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > LIMIT && (
          <div className="flex items-center justify-between border-t px-4 py-2.5 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </span>
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
    </div>
  );
}

function CompaniesTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companiesService
      .list()
      .then((data) => setCompanies(data))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border overflow-hidden">
      {loading ? (
        <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Business Type
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">GST</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-muted/20">
                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary">{c.businessType}</Badge>
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground text-xs">
                  {c.gstNumber ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.contactEmail}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

type Tab = 'overview' | 'companies' | 'audit';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'companies', label: 'Companies', icon: <Building2 className="h-4 w-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Platform Admin</h1>
            <p className="text-muted-foreground">System-wide management and audit trail</p>
          </div>

          <div className="flex gap-1 border-b">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Firms', value: '12', icon: <Building2 className="h-5 w-5" /> },
                { label: 'Total Users', value: '147', icon: <Users className="h-5 w-5" /> },
                { label: 'Total Reviews', value: '1,203', icon: <Shield className="h-5 w-5" /> },
                {
                  label: 'Audit Events Today',
                  value: '342',
                  icon: <BarChart3 className="h-5 w-5" />,
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2 text-muted-foreground">{stat.icon}</div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'companies' && <CompaniesTab />}
          {tab === 'audit' && <AuditLogsTab />}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
