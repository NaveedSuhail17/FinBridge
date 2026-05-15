'use client';

import { useAuthStore } from '@finbridge/sdk';
import { DashboardCard, ActivityFeed } from '@finbridge/ui';
import type { ActivityItem } from '@finbridge/ui';
import { UserRole } from '@finbridge/types';
import {
  Building2,
  Users,
  ClipboardCheck,
  TrendingUp,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const ACTIVITY_ITEMS: ActivityItem[] = [
  {
    id: '1',
    title: 'Invoice #INV-2024-001 approved',
    description: 'by accountant@finbridge.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    variant: 'success',
  },
  {
    id: '2',
    title: 'vendor_invoice_dec.pdf uploaded',
    description: 'by user@company.com — AI extraction queued',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    variant: 'default',
  },
  {
    id: '3',
    title: 'Extraction completed for Invoice #INV-2024-002',
    description: 'Confidence score: 91% — awaiting review',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    variant: 'default',
  },
  {
    id: '4',
    title: 'Invoice #INV-2024-003 rejected',
    description: 'Reason: duplicate invoice detected',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    variant: 'destructive',
  },
];

function PlatformAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground">Monitor system health across all tenants</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Accounting Firms"
          value="12"
          icon={<Building2 className="h-4 w-4" />}
          delta={8}
        />
        <DashboardCard
          title="Total Users"
          value="147"
          icon={<Users className="h-4 w-4" />}
          delta={12}
        />
        <DashboardCard
          title="Pending Reviews"
          value="34"
          icon={<ClipboardCheck className="h-4 w-4" />}
          delta={-5}
        />
        <DashboardCard
          title="Extractions Today"
          value="89"
          icon={<TrendingUp className="h-4 w-4" />}
          delta={23}
        />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Recent Activity</h2>
        <ActivityFeed items={ACTIVITY_ITEMS} />
      </div>
    </div>
  );
}

function FirmAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Firm Dashboard</h1>
        <p className="text-muted-foreground">Overview of your accounting firm operations</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Accountants" value="8" icon={<Users className="h-4 w-4" />} />
        <DashboardCard
          title="Pending Reviews"
          value="21"
          icon={<ClipboardCheck className="h-4 w-4" />}
          delta={-12}
        />
        <DashboardCard
          title="Transactions This Month"
          value="₹4.2L"
          icon={<TrendingUp className="h-4 w-4" />}
          delta={18}
        />
        <DashboardCard
          title="Companies Managed"
          value="6"
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Recent Activity</h2>
        <ActivityFeed items={ACTIVITY_ITEMS} />
      </div>
    </div>
  );
}

function AccountantDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground">Invoices awaiting your review and approval</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Pending Reviews"
          value="14"
          icon={<ClipboardCheck className="h-4 w-4" />}
          delta={-7}
          deltaLabel="vs yesterday"
        />
        <DashboardCard
          title="Approved Today"
          value="9"
          icon={<CheckCircle className="h-4 w-4" />}
          delta={50}
        />
        <DashboardCard
          title="Extraction Success Rate"
          value="94%"
          icon={<TrendingUp className="h-4 w-4" />}
          delta={2}
        />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Recent Activity</h2>
        <ActivityFeed items={ACTIVITY_ITEMS} />
      </div>
    </div>
  );
}

function CompanyUserDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">Track your invoice uploads and transaction status</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Uploaded This Month"
          value="23"
          icon={<Upload className="h-4 w-4" />}
          delta={15}
        />
        <DashboardCard title="Processing" value="2" icon={<AlertCircle className="h-4 w-4" />} />
        <DashboardCard
          title="Approved Transactions"
          value="18"
          icon={<CheckCircle className="h-4 w-4" />}
          delta={20}
        />
        <DashboardCard
          title="Available Reports"
          value="5"
          icon={<FileText className="h-4 w-4" />}
        />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Recent Activity</h2>
        <ActivityFeed items={ACTIVITY_ITEMS} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  switch (user?.role) {
    case UserRole.PLATFORM_ADMIN:
      return <PlatformAdminDashboard />;
    case UserRole.ACCOUNTING_FIRM_ADMIN:
      return <FirmAdminDashboard />;
    case UserRole.ACCOUNTANT:
      return <AccountantDashboard />;
    case UserRole.COMPANY_USER:
      return <CompanyUserDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard…</p>
        </div>
      );
  }
}
