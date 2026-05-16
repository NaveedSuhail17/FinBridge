'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUpload, useExtraction, uploadsService } from '@finbridge/sdk';
import {
  UploadZone,
  FilePreview,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
} from '@finbridge/ui';
import type { FileStatus } from '@finbridge/ui';
import { ExtractionStatus } from '@finbridge/types';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell';
import type { Upload } from '@finbridge/types';

interface UploadEntry {
  id: string;
  file: File;
  uploadId: string | null;
  extractionJobId: string | null;
  status: FileStatus;
  progress: number;
}

interface BulkEntry {
  id: string;
  fileName: string;
  uploadId: string;
  extractionJobId: string;
  status: FileStatus;
}

function ExtractionPoller({
  jobId,
  onTerminal,
}: {
  jobId: string;
  onTerminal: (failed: boolean) => void;
}) {
  const { job, isTerminal } = useExtraction(jobId);

  useEffect(() => {
    if (isTerminal && job) {
      onTerminal(job.status === ExtractionStatus.FAILED);
    }
  }, [isTerminal, job, onTerminal]);

  return null;
}

function UploadHistory() {
  const router = useRouter();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    uploadsService
      .list()
      .then((data) => setUploads(data))
      .catch(() => setUploads([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading upload history…</p>;

  if (uploads.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No uploads yet. Upload a document above to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="pb-2 text-left font-medium">File name</th>
            <th className="pb-2 text-left font-medium">Type</th>
            <th className="pb-2 text-left font-medium">Size</th>
            <th className="pb-2 text-left font-medium">Date</th>
            <th className="pb-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {uploads.map((u) => (
            <tr key={u.id}>
              <td className="py-2 pr-4 font-medium max-w-xs truncate">{u.fileName}</td>
              <td className="py-2 pr-4 text-muted-foreground">{u.fileType}</td>
              <td className="py-2 pr-4 text-muted-foreground">
                {(u.fileSize / 1024).toFixed(0)} KB
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="py-2 text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(`/reviews?uploadId=${u.id}`)}
                >
                  View Reviews
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DOCUMENT_TYPES = [
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'PAYMENT', label: 'Payment Receipt' },
  { value: 'SALARY_REGISTER', label: 'Salary Register' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
];

// ─── Single upload tab ────────────────────────────────────────────────────────
function SingleUploadTab() {
  const { uploadFile } = useUpload();
  const [queue, setQueue] = useState<UploadEntry[]>([]);
  const [selectedDocType, setSelectedDocType] = useState('INVOICE');

  const handleFiles = async (files: File[]) => {
    const entries: UploadEntry[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      uploadId: null,
      extractionJobId: null,
      status: 'uploading' as FileStatus,
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...entries]);

    for (const entry of entries) {
      try {
        const result = await uploadFile(entry.file, selectedDocType);
        setQueue((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  status: 'processing',
                  progress: 100,
                  uploadId: result.upload.id,
                  extractionJobId: result.extractionJobId,
                }
              : e,
          ),
        );
      } catch {
        setQueue((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: 'failed' } : e)));
      }
    }
  };

  const markTerminal = (entryId: string, failed: boolean) => {
    setQueue((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, status: failed ? 'failed' : 'completed' } : e)),
    );
  };

  return (
    <>
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Upload Financial Documents</h2>
        <div className="mb-4 max-w-xs space-y-1.5">
          <Label htmlFor="doc-type-select">Document Type</Label>
          <Select value={selectedDocType} onValueChange={setSelectedDocType}>
            <SelectTrigger id="doc-type-select">
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((dt) => (
                <SelectItem key={dt.value} value={dt.value}>
                  {dt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <UploadZone onFiles={handleFiles} multiple />
      </div>

      {queue.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Upload Queue</h2>
            <Button variant="ghost" size="sm" onClick={() => setQueue([])}>
              Clear all
            </Button>
          </div>
          <div className="space-y-3">
            {queue.map((entry) => (
              <div key={entry.id}>
                <FilePreview
                  fileName={entry.file.name}
                  fileSize={entry.file.size}
                  mimeType={entry.file.type}
                  status={entry.status}
                  progress={entry.progress}
                />
                {entry.extractionJobId && entry.status === 'processing' && (
                  <ExtractionPoller
                    jobId={entry.extractionJobId}
                    onTerminal={(failed) => markTerminal(entry.id, failed)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Bulk upload tab ──────────────────────────────────────────────────────────
function BulkUploadTab() {
  const [entries, setEntries] = useState<BulkEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    setError(null);
    setUploading(true);
    try {
      const results = await uploadsService.uploadBulk(files, 'BANK_STATEMENT');
      const newEntries: BulkEntry[] = results.map((r) => ({
        id: crypto.randomUUID(),
        fileName: r.fileName,
        uploadId: r.uploadId,
        extractionJobId: r.extractionJobId,
        status: 'processing' as FileStatus,
      }));
      setEntries((prev) => [...prev, ...newEntries]);
    } catch {
      setError('Bulk upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const markTerminal = (entryId: string, failed: boolean) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, status: failed ? 'failed' : 'completed' } : e)),
    );
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-1 font-semibold">Bulk Bank Statement Upload</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Drop up to 20 bank statement PDFs at once. Each file gets its own extraction job.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <UploadZone onFiles={handleFiles} multiple />

      {uploading && <p className="mt-3 text-sm text-muted-foreground">Uploading files…</p>}

      {entries.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Files ({entries.length})</p>
            <Button variant="ghost" size="sm" onClick={() => setEntries([])}>
              Clear
            </Button>
          </div>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id}>
                <FilePreview
                  fileName={entry.fileName}
                  fileSize={0}
                  mimeType="application/pdf"
                  status={entry.status}
                  progress={entry.status === 'processing' ? 50 : 100}
                />
                {entry.status === 'processing' && (
                  <ExtractionPoller
                    jobId={entry.extractionJobId}
                    onTerminal={(failed) => markTerminal(entry.id, failed)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = 'single' | 'bulk';

export default function UploadsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('single');

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Upload Center</h1>
            <p className="text-muted-foreground">
              Upload financial documents for AI extraction and accountant review
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
            <button
              onClick={() => setActiveTab('single')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'single'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Single Upload
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'bulk'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bulk Upload
            </button>
          </div>

          {activeTab === 'single' ? <SingleUploadTab /> : <BulkUploadTab />}

          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">Upload History</h2>
            <UploadHistory />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
