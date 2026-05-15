'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { ConfidenceBadge } from './confidence-badge';
import { Input } from './ui/input';
import { Label } from './ui/label';

export interface ExtractionField {
  key: string;
  label: string;
  value: string | number | null;
  confidence?: number;
  editable?: boolean;
}

export interface ExtractionFormProps {
  fields: ExtractionField[];
  onChange?: (key: string, value: string) => void;
  readOnly?: boolean;
  className?: string;
}

export function ExtractionForm({
  fields,
  onChange,
  readOnly = false,
  className,
}: ExtractionFormProps) {
  const [edited, setEdited] = React.useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
    onChange?.(key, value);
  };

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      {fields.map((field) => {
        const displayValue = edited[field.key] ?? String(field.value ?? '');
        const isEditable = !readOnly && field.editable !== false;

        return (
          <div key={field.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={field.key}
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                {field.label}
              </Label>
              {field.confidence != null && (
                <ConfidenceBadge score={field.confidence} fieldName={field.label} />
              )}
            </div>
            {isEditable ? (
              <Input
                id={field.key}
                value={displayValue}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className={cn(edited[field.key] != null && 'border-primary/50 bg-primary/5')}
              />
            ) : (
              <p
                id={field.key}
                className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
              >
                {displayValue || '—'}
              </p>
            )}
            {edited[field.key] != null && field.value != null && (
              <p className="text-xs text-muted-foreground line-through">
                Original: {String(field.value)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
