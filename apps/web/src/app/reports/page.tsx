'use client';

import { useState, useEffect, useRef } from 'react';
import { reportsService } from '@finbridge/sdk';
import type { ReportType, ShareLink } from '@finbridge/sdk';
import {
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
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell';
import type { MISReport } from '@finbridge/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, Share2, FileText, Plus } from 'lucide-react';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'EXPENSE_SUMMARY', label: 'Expense Summary' },
  { value: 'VENDOR_SUMMARY', label: 'Vendor Summary' },
  { value: 'CATEGORY_BREAKDOWN', label: 'Category Breakdown' },
  { value: 'CASH_FLOW', label: 'Cash Flow' },
];

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const SAMPLE_BAR_DATA = [
  { month: 'Sep', amount: 42000 },
  { month: 'Oct', amount: 67000 },
  { month: 'Nov', amount: 51000 },
  { month: 'Dec', amount: 89000 },
  { month: 'Jan', amount: 73000 },
  { month: 'Feb', amount: 94000 },
];

const SAMPLE_PIE_DATA = [
  { name: 'Salaries', value: 45 },
  { name: 'Rent', value: 20 },
  { name: 'Utilities', value: 12 },
  { name: 'Marketing', value: 15 },
  { name: 'Other', value: 8 },
];

function GenerateReportDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerated: (r: MISReport) => void;
}) {
  const [type, setType] = useState<ReportType>('EXPENSE_SUMMARY');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      setError('Please select a date range');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const report = await reportsService.generate({ type, dateFrom, dateTo });
      onGenerated(report);
      onOpenChange(false);
    } catch {
      setError('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Select the report type and date range to generate a new financial report.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Report Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dateFrom">From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateTo">To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShareDialog({
  reportId,
  open,
  onOpenChange,
}: {
  reportId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [expiry, setExpiry] = useState<'7d' | '30d' | 'never'>('7d');
  const [link, setLink] = useState<ShareLink | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setGenerating(true);
    try {
      const shareLink = await reportsService.share(reportId, { expiresIn: expiry });
      setLink(shareLink);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (link?.url) {
      navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription>Generate a shareable link with configurable expiry.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Link expires</Label>
            <Select value={expiry} onValueChange={(v) => setExpiry(v as typeof expiry)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {link && (
            <div className="space-y-1.5">
              <Label>Shareable link</Label>
              <div className="flex gap-2">
                <Input value={link.url} readOnly className="font-mono text-xs" />
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              {link.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Expires: {new Date(link.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!link && (
            <Button onClick={handleShare} disabled={generating}>
              {generating ? 'Generating…' : 'Generate Link'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<MISReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const misInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reportsService
      .list()
      .then((data) => setReports(data))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const report = await reportsService.upload(file);
      setReports((prev) => [report, ...prev]);
    } catch {
      // ignore — user will see no update
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
              <p className="text-muted-foreground">Generate, view, and share financial reports</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => misInputRef.current?.click()}>
                <FileText className="h-4 w-4 mr-1" />
                Upload MIS
              </Button>
              <input
                ref={misInputRef}
                type="file"
                accept=".xlsx,.xls,.pdf,.csv"
                className="hidden"
                onChange={handleMisUpload}
              />
              <Button onClick={() => setShowGenerate(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Generate Report
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold mb-4">Monthly Expenses (₹)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={SAMPLE_BAR_DATA}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold mb-4">Expense Breakdown</h3>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={SAMPLE_PIE_DATA} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                      {SAMPLE_PIE_DATA.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {SAMPLE_PIE_DATA.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ background: PIE_COLORS[i] }}
                      />
                      <span>{d.name}</span>
                      <span className="text-muted-foreground ml-auto">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">All Reports</h2>
            </div>
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading reports…</div>
            ) : reports.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No reports yet</p>
                <p className="text-sm text-muted-foreground">Generate your first report above</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{r.fileName}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">Report</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => reportsService.download(r.id)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setShareId(r.id)}>
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <GenerateReportDialog
          open={showGenerate}
          onOpenChange={setShowGenerate}
          onGenerated={(r) => setReports((prev) => [r, ...prev])}
        />

        {shareId && (
          <ShareDialog
            reportId={shareId}
            open={!!shareId}
            onOpenChange={(v) => {
              if (!v) setShareId(null);
            }}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
