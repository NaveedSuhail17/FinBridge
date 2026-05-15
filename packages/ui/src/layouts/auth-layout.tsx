import * as React from 'react';
import { cn } from '../lib/utils';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  logo?: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, title, subtitle, logo, className }: AuthLayoutProps) {
  return (
    <div className={cn('flex min-h-screen items-center justify-center bg-muted/30 p-4', className)}>
      <div className="w-full max-w-md space-y-6">
        {(logo || title) && (
          <div className="text-center">
            {logo && <div className="mb-4 flex justify-center">{logo}</div>}
            {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <div className="rounded-lg border bg-card p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
