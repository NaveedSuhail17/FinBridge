import * as React from 'react';
import { cn } from '../lib/utils';

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string | Date;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  className?: string;
  emptyMessage?: string;
}

const variantDotClass: Record<NonNullable<ActivityItem['variant']>, string> = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  destructive: 'bg-destructive',
};

function formatTimestamp(ts: string | Date): string {
  const date = ts instanceof Date ? ts : new Date(ts);
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function ActivityFeed({
  items,
  className,
  emptyMessage = 'No recent activity',
}: ActivityFeedProps) {
  if (items.length === 0) {
    return <p className={cn('text-sm text-muted-foreground', className)}>{emptyMessage}</p>;
  }

  return (
    <ol className={cn('space-y-4', className)}>
      {items.map((item, idx) => {
        const dotClass = variantDotClass[item.variant ?? 'default'];
        return (
          <li key={item.id} className="relative flex gap-3">
            {idx < items.length - 1 && (
              <span className="absolute left-2 top-5 -bottom-4 w-px bg-border" aria-hidden />
            )}
            <span
              className={cn(
                'mt-1.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full',
                dotClass,
              )}
            >
              {item.icon ?? <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              )}
              <time className="mt-0.5 block text-xs text-muted-foreground">
                {formatTimestamp(item.timestamp)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
