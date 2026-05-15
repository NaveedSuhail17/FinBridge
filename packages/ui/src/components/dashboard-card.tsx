import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export interface DashboardCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  value,
  delta,
  deltaLabel,
  icon,
  className,
}: DashboardCardProps) {
  const DeltaIcon =
    delta == null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor =
    delta == null
      ? ''
      : delta > 0
        ? 'text-green-600'
        : delta < 0
          ? 'text-destructive'
          : 'text-muted-foreground';

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {DeltaIcon && (
          <p className={cn('mt-1 flex items-center gap-1 text-xs', deltaColor)}>
            <DeltaIcon className="h-3 w-3" />
            <span>
              {Math.abs(delta!)}% {deltaLabel ?? 'from last month'}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
