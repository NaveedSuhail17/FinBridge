import * as React from 'react';
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';

export interface ConfidenceBadgeProps {
  score: number;
  fieldName?: string;
  className?: string;
}

function getConfidenceVariant(score: number): {
  label: string;
  className: string;
} {
  if (score >= 80)
    return { label: 'High', className: 'bg-green-100 text-green-800 border-green-200' };
  if (score >= 70)
    return { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  return { label: 'Low', className: 'bg-red-100 text-red-800 border-red-200' };
}

export function ConfidenceBadge({ score, fieldName, className }: ConfidenceBadgeProps) {
  const { label, className: variantClass } = getConfidenceVariant(score);
  const pct = Math.round(score);

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClass,
        className,
      )}
    >
      {pct}%
    </span>
  );

  if (!fieldName) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>
            {fieldName}: {label} confidence ({pct}%)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
