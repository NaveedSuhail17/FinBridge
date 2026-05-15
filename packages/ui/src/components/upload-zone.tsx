'use client';

import * as React from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { Upload, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  accept?: DropzoneOptions['accept'];
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UploadZone({
  onFiles,
  accept = ACCEPTED_TYPES,
  maxSize = MAX_SIZE_BYTES,
  multiple = false,
  disabled,
  className,
}: UploadZoneProps) {
  const [rejectedMessage, setRejectedMessage] = React.useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    multiple,
    disabled,
    onDropAccepted: (files) => {
      setRejectedMessage(null);
      onFiles(files);
    },
    onDropRejected: (rejections) => {
      const reason = rejections[0]?.errors[0]?.message ?? 'File not accepted';
      setRejectedMessage(reason);
    },
  });

  return (
    <div className={cn('space-y-2', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/30',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-sm font-medium text-primary">Drop the file here</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drag & drop or click to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, PNG, JPG up to 10 MB</p>
          </>
        )}
      </div>
      {rejectedMessage && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{rejectedMessage}</span>
        </div>
      )}
    </div>
  );
}
