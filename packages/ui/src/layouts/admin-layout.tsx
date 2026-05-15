import * as React from 'react';
import { cn } from '../lib/utils';
import { MainLayout, type MainLayoutProps } from './main-layout';
import { Badge } from '../components/ui/badge';

export interface AdminLayoutProps extends MainLayoutProps {
  adminLabel?: string;
}

export function AdminLayout({
  adminLabel = 'Admin',
  headerExtra,
  className,
  ...props
}: AdminLayoutProps) {
  const adminBadge = (
    <Badge variant="secondary" className="text-xs">
      {adminLabel}
    </Badge>
  );

  return (
    <MainLayout
      {...props}
      className={cn('', className)}
      headerExtra={
        <div className={cn('flex items-center gap-2', headerExtra ? 'mr-2' : '')}>
          {adminBadge}
          {headerExtra}
        </div>
      }
    />
  );
}
