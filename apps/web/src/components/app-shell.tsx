'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@finbridge/sdk';
import { MainLayout } from '@finbridge/ui';
import type { NavItem } from '@finbridge/ui';
import { UserRole } from '@finbridge/types';
import {
  LayoutDashboard,
  Upload,
  ClipboardCheck,
  Receipt,
  BarChart3,
  Shield,
  Building2,
  Users,
} from 'lucide-react';
import { NotificationBell } from './notification-bell';

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: 'Upload',
    href: '/uploads',
    icon: <Upload className="h-4 w-4" />,
    roles: [UserRole.COMPANY_USER],
  },
  {
    label: 'Reviews',
    href: '/reviews',
    icon: <ClipboardCheck className="h-4 w-4" />,
    roles: [UserRole.ACCOUNTANT, UserRole.ACCOUNTING_FIRM_ADMIN],
  },
  {
    label: 'Transactions',
    href: '/transactions',
    icon: <Receipt className="h-4 w-4" />,
    roles: [UserRole.ACCOUNTANT, UserRole.ACCOUNTING_FIRM_ADMIN, UserRole.COMPANY_USER],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: <BarChart3 className="h-4 w-4" />,
    roles: [UserRole.ACCOUNTANT, UserRole.ACCOUNTING_FIRM_ADMIN, UserRole.COMPANY_USER],
  },
  {
    label: 'Firm Admin',
    href: '/firm-admin',
    icon: <Building2 className="h-4 w-4" />,
    roles: [UserRole.ACCOUNTING_FIRM_ADMIN],
  },
  {
    label: 'Platform Admin',
    href: '/admin',
    icon: <Shield className="h-4 w-4" />,
    roles: [UserRole.PLATFORM_ADMIN],
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <Users className="h-4 w-4" />,
    roles: [UserRole.PLATFORM_ADMIN],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <MainLayout
      sidebar={{
        items: NAV_ITEMS,
        currentPath: pathname,
        role: user?.role as UserRole | undefined,
        onNavigate: (href) => router.push(href),
        logo: <span className="font-bold text-primary text-lg tracking-tight">FinBridge</span>,
      }}
      headerExtra={<NotificationBell />}
      userMenu={
        user
          ? {
              name: user.name,
              email: user.email,
              role: user.role,
              onLogout: logout,
            }
          : undefined
      }
    >
      {children}
    </MainLayout>
  );
}
