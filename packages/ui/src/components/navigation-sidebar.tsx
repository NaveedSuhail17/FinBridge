'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import type { UserRole } from '@finbridge/types';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles?: UserRole[];
  badge?: string | number;
}

export interface NavigationSidebarProps {
  items: NavItem[];
  currentPath?: string;
  role?: UserRole;
  collapsed?: boolean;
  onNavigate?: (href: string) => void;
  className?: string;
  logo?: React.ReactNode;
}

export function NavigationSidebar({
  items,
  currentPath,
  role,
  collapsed = false,
  onNavigate,
  className,
  logo,
}: NavigationSidebarProps) {
  const visible = items.filter((item) => !item.roles || !role || item.roles.includes(role));

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
        className,
      )}
    >
      {logo && (
        <div
          className={cn('flex h-16 items-center border-b px-4', collapsed && 'justify-center px-0')}
        >
          {logo}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {visible.map((item) => {
            const isActive = currentPath === item.href || currentPath?.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <button
                  onClick={() => onNavigate?.(item.href)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center px-0',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && item.badge != null && (
                    <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
