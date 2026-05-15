'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import { NavigationSidebar, type NavigationSidebarProps } from '../components/navigation-sidebar';
import { UserMenu, type UserMenuProps } from '../components/user-menu';

export interface MainLayoutProps {
  children: React.ReactNode;
  sidebar: Omit<NavigationSidebarProps, 'className'>;
  userMenu?: Omit<UserMenuProps, 'className'>;
  headerExtra?: React.ReactNode;
  className?: string;
}

export function MainLayout({
  children,
  sidebar,
  userMenu,
  headerExtra,
  className,
}: MainLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className={cn('flex h-screen overflow-hidden', className)}>
      <NavigationSidebar {...sidebar} collapsed={collapsed} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b bg-background px-4">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            {headerExtra}
            {userMenu && <UserMenu {...userMenu} />}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
