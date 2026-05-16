'use client';

import { useState, useEffect } from 'react';
import { usersService } from '@finbridge/sdk';
import type { AdminUserEntry } from '@finbridge/sdk';
import { Badge } from '@finbridge/ui';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell';
import { Users } from 'lucide-react';

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PLATFORM_ADMIN: 'destructive',
  ACCOUNTING_FIRM_ADMIN: 'default',
  ACCOUNTANT: 'default',
  COMPANY_USER: 'secondary',
};

const TENANT_TYPE_LABEL: Record<string, string> = {
  PLATFORM: 'Platform',
  ACCOUNTING_FIRM: 'Accounting Firm',
  COMPANY: 'Company',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    usersService
      .listAll()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Users</h1>
              <p className="text-muted-foreground">All registered users across all tenants</p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              {loading ? '…' : `${users.length} total`}
            </div>
          </div>

          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-72 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No users found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.role ? (
                          <Badge variant={ROLE_VARIANT[u.role] ?? 'secondary'}>
                            {u.role.replace(/_/g, ' ')}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.tenant ? (
                          <span className="flex flex-col gap-0.5">
                            <span>{u.tenant.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {TENANT_TYPE_LABEL[u.tenant.type] ?? u.tenant.type}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive ? 'default' : 'destructive'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
