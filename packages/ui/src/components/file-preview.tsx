import * as React from 'react';
import { FileText, Image, Trash2, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export type FileStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';

export interface FilePreviewProps {
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  status: FileStatus;
  progress?: number;
  onView?: () => void;
  onDelete?: () => void;
  className?: string;
}

const statusConfig: Record<
  FileStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline';
  }
> = {
  pending: { label: 'Pending', variant: 'secondary' },
  uploading: { label: 'Uploading', variant: 'default' },
  processing: { label: 'Processing', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreview({
  fileName,
  fileSize,
  mimeType,
  status,
  progress,
  onView,
  onDelete,
  className,
}: FilePreviewProps) {
  const isImage = mimeType?.startsWith('image/');
  const { label, variant } = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-3 rounded-lg border bg-card p-3', className)}>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted">
        {isImage ? (
          <Image className="h-5 w-5 text-muted-foreground" />
        ) : (
          <FileText className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {fileSize != null && (
            <span className="text-xs text-muted-foreground">{formatBytes(fileSize)}</span>
          )}
          <Badge variant={variant as 'default'}>{label}</Badge>
        </div>
        {status === 'uploading' && progress != null && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {onView && (
          <Button variant="ghost" size="icon" onClick={onView} aria-label="View file">
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Delete file"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
