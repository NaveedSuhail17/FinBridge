// Utility
export { cn } from './lib/utils';

// shadcn/ui base components
export { Button, buttonVariants } from './components/ui/button';
export type { ButtonProps } from './components/ui/button';

export { Input } from './components/ui/input';
export type { InputProps } from './components/ui/input';

export { Label } from './components/ui/label';

export { Badge, badgeVariants } from './components/ui/badge';
export type { BadgeProps } from './components/ui/badge';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './components/ui/card';

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from './components/ui/select';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/ui/tooltip';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './components/ui/table';

export { DatePicker } from './components/ui/date-picker';
export type { DatePickerProps } from './components/ui/date-picker';

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from './components/ui/form';

// Custom FinBridge components
export { ConfidenceBadge } from './components/confidence-badge';
export type { ConfidenceBadgeProps } from './components/confidence-badge';

export { UploadZone } from './components/upload-zone';
export type { UploadZoneProps } from './components/upload-zone';

export { FilePreview } from './components/file-preview';
export type { FilePreviewProps, FileStatus } from './components/file-preview';

export { TransactionTable } from './components/transaction-table';
export type { TransactionRow, TransactionTableProps } from './components/transaction-table';

export { ExtractionForm } from './components/extraction-form';
export type { ExtractionField, ExtractionFormProps } from './components/extraction-form';

export { DashboardCard } from './components/dashboard-card';
export type { DashboardCardProps } from './components/dashboard-card';

export { ActivityFeed } from './components/activity-feed';
export type { ActivityItem, ActivityFeedProps } from './components/activity-feed';

export { NavigationSidebar } from './components/navigation-sidebar';
export type { NavItem, NavigationSidebarProps } from './components/navigation-sidebar';

export { UserMenu } from './components/user-menu';
export type { UserMenuProps } from './components/user-menu';

// Layouts
export { MainLayout } from './layouts/main-layout';
export type { MainLayoutProps } from './layouts/main-layout';

export { AuthLayout } from './layouts/auth-layout';
export type { AuthLayoutProps } from './layouts/auth-layout';

export { AdminLayout } from './layouts/admin-layout';
export type { AdminLayoutProps } from './layouts/admin-layout';

// Hooks
export { useDebounce } from './hooks/useDebounce';
export { useLocalStorage } from './hooks/useLocalStorage';
