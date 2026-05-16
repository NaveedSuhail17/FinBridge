'use client';

import { useState, useEffect } from 'react';
import { usersService, tenantsService } from '@finbridge/sdk';
import type { AdminUserEntry, CreateUserDto, TenantItem } from '@finbridge/sdk';
import {
  Badge,
  Button,
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
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell';
import { Users, Plus } from 'lucide-react';

const ROLES = [
  { value: 'PLATFORM_ADMIN', label: 'Platform Admin' },
  { value: 'ACCOUNTING_FIRM_ADMIN', label: 'Firm Admin' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'COMPANY_USER', label: 'Company User' },
] as const;

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

const EMPTY_FORM: CreateUserDto = {
  name: '',
  email: '',
  password: '',
  tenantId: '',
  roleName: 'COMPANY_USER',
};

function CreateUserDialog({
  open,
  onOpenChange,
  tenants,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenants: TenantItem[];
  onCreated: (user: AdminUserEntry) => void;
}) {
  const [form, setForm] = useState<CreateUserDto>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof CreateUserDto, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.tenantId) {
      setError('All fields are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await usersService.createUser(form);
      onCreated(created);
      onOpenChange(false);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>Add a new user and assign them a tenant and role.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cu-name">Full Name</Label>
            <Input
              id="cu-name"
              placeholder="Jane Doe"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-email">Email</Label>
            <Input
              id="cu-email"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-password">Password</Label>
            <Input
              id="cu-password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tenant</Label>
            <Select value={form.tenantId} onValueChange={(v) => set('tenantId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select tenant…" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({TENANT_TYPE_LABEL[t.type] ?? t.type})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.roleName}
              onValueChange={(v) => set('roleName', v as CreateUserDto['roleName'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserEntry[]>([]);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    Promise.all([usersService.listAll(), tenantsService.list()])
      .then(([u, t]) => {
        setUsers(u);
        setTenants(t);
      })
      .catch(() => {})
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
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {loading ? '…' : `${users.length} total`}
              </span>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Create User
              </Button>
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

        <CreateUserDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          tenants={tenants}
          onCreated={(u) => setUsers((prev) => [u, ...prev])}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
