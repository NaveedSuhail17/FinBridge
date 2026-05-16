'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore, insightsService, uploadsService } from '@finbridge/sdk';
import type {
  CashFlowResponse,
  TopExpenseHeadsResponse,
  UploadFunnelResponse,
  VendorSummaryResponse,
} from '@finbridge/sdk';
import { DashboardCard, ActivityFeed, Badge, Button } from '@finbridge/ui';
import type { ActivityItem } from '@finbridge/ui';
import { UserRole, ExtractionStatus, ReviewStatus } from '@finbridge/types';
import type { Upload } from '@finbridge/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  Users,
  ClipboardCheck,
  TrendingUp,
  Upload,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// ─── Colour palette for pie chart ────────────────────────────────────────────
const PIE_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444'];

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function ChartSkeleton({ height = 'h-48' }: { height?: string }) {
  return <div className={`${height} animate-pulse rounded-lg bg-muted`} />;
}

// ─── Cash-flow area chart ────────────────────────────────────────────────────
function CashFlowChart() {
  const [data, setData] = useState<CashFlowResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insightsService
      .getCashFlow()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 font-semibold">Cash Flow ({data?.year ?? new Date().getFullYear()})</h2>
      {loading ? (
        <ChartSkeleton />
      ) : !data || data.months.every((m) => m.total === 0) ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No transactions yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={192}>
          <AreaChart data={data.months} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              fill="url(#cashFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Top expense heads pie chart ─────────────────────────────────────────────
function TopExpenseHeadsChart() {
  const [data, setData] = useState<TopExpenseHeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insightsService
      .getTopExpenseHeads(30)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 font-semibold">Top Expense Heads (last 30 days)</h2>
      {loading ? (
        <ChartSkeleton />
      ) : !data || data.heads.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No expense data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={192}>
          <PieChart>
            <Pie
              data={data.heads}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label={({ percentage }: { percentage: number }) => `${percentage}%`}
            >
              {data.heads.map((entry, i) => (
                <Cell key={entry.headId} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Total']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Upload funnel cards ──────────────────────────────────────────────────────
function UploadFunnelCards() {
  const [data, setData] = useState<UploadFunnelResponse | null>(null);

  useEffect(() => {
    insightsService
      .getUploadFunnel()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const v = (n: number | undefined) => (n === undefined ? '—' : String(n));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Uploaded"
        value={v(data?.uploaded)}
        icon={<Upload className="h-4 w-4" />}
      />
      <DashboardCard
        title="Extracted"
        value={v(data?.extracted)}
        icon={<AlertCircle className="h-4 w-4" />}
      />
      <DashboardCard
        title="Reviewed"
        value={v(data?.reviewed)}
        icon={<ClipboardCheck className="h-4 w-4" />}
      />
      <DashboardCard
        title="Approved"
        value={v(data?.approved)}
        icon={<CheckCircle className="h-4 w-4" />}
      />
    </div>
  );
}

// ─── Vendor summary table ─────────────────────────────────────────────────────
function VendorSummaryTable() {
  const [data, setData] = useState<VendorSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insightsService
      .getVendorSummary(30)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 font-semibold">Top Vendors (last 30 days)</h2>
      {loading ? (
        <ChartSkeleton height="h-32" />
      ) : !data || data.vendors.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No vendor data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2 text-left font-medium">Vendor</th>
                <th className="pb-2 text-right font-medium">Invoices</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.vendors.map((v) => (
                <tr key={v.vendorName}>
                  <td className="py-2 pr-4 font-medium">{v.vendorName}</td>
                  <td className="py-2 pr-4 text-right text-muted-foreground">{v.count}</td>
                  <td className="py-2 text-right">₹{v.total.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Static activity feed placeholder ────────────────────────────────────────
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

// ─── Upload status helper ─────────────────────────────────────────────────────
function deriveUploadStatus(upload: Upload): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
} {
  const job = upload.extractionJob;
  if (!job || job.status === ExtractionStatus.QUEUED)
    return { label: 'Queued', variant: 'secondary' };
  if (job.status === ExtractionStatus.PROCESSING)
    return { label: 'Processing', variant: 'secondary' };
  if (job.status === ExtractionStatus.FAILED) return { label: 'Failed', variant: 'destructive' };
  const review = job.extractionResult?.review;
  if (!review) return { label: 'Pending Review', variant: 'secondary' };
  if (review.status === ReviewStatus.APPROVED) return { label: 'Approved', variant: 'default' };
  if (review.status === ReviewStatus.REJECTED) return { label: 'Rejected', variant: 'destructive' };
  return { label: 'Pending Review', variant: 'secondary' };
}

// ─── Role dashboards ──────────────────────────────────────────────────────────
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
      <UploadFunnelCards />
      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowChart />
        <VendorSummaryTable />
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
      <UploadFunnelCards />
      <VendorSummaryTable />
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Recent Activity</h2>
        <ActivityFeed items={ACTIVITY_ITEMS} />
      </div>
    </div>
  );
}

function CompanyUserDashboard() {
  const [funnel, setFunnel] = useState<UploadFunnelResponse | null>(null);
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);

  useEffect(() => {
    insightsService
      .getUploadFunnel()
      .then(setFunnel)
      .catch(() => setFunnel(null));
    uploadsService
      .list()
      .then((data) => setRecentUploads(data.slice(0, 5)))
      .catch(() => setRecentUploads([]))
      .finally(() => setUploadsLoading(false));
  }, []);

  const v = (n: number | undefined) => (n === undefined ? '—' : String(n));
  const processing = funnel ? Math.max(0, funnel.uploaded - funnel.extracted) : undefined;
  const pendingReview = funnel ? Math.max(0, funnel.extracted - funnel.reviewed) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">Track your invoice uploads and transaction status</p>
        </div>
        <Link href="/uploads">
          <Button size="sm">
            <Upload className="h-4 w-4 mr-1.5" />
            New Upload
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Uploaded"
          value={v(funnel?.uploaded)}
          icon={<Upload className="h-4 w-4" />}
        />
        <DashboardCard
          title="Processing"
          value={v(processing)}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <DashboardCard
          title="Pending Review"
          value={v(pendingReview)}
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
        <DashboardCard
          title="Approved"
          value={v(funnel?.approved)}
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Recent Uploads</h2>
          <Link href="/uploads">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>
        {uploadsLoading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
        ) : recentUploads.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No uploads yet.{' '}
            <Link href="/uploads" className="underline underline-offset-2">
              Upload your first document
            </Link>
            .
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">File</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentUploads.map((u) => {
                const { label, variant } = deriveUploadStatus(u);
                const reviewId = u.extractionJob?.extractionResult?.review?.id;
                return (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-[220px] truncate">{u.fileName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.fileType}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={variant}>{label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {reviewId && (
                        <Link href={`/reviews/${reviewId}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowChart />
        <TopExpenseHeadsChart />
      </div>
    </div>
  );
}

// ─── Page entry ───────────────────────────────────────────────────────────────
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
