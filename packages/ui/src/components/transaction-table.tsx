'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

export interface TransactionRow {
  id: string;
  invoiceNumber?: string;
  vendorName?: string;
  amount: number;
  currency: string;
  date: string;
  paymentHead?: string;
  status: string;
}

export interface TransactionTableProps {
  data: TransactionRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onExportCsv?: () => void;
  loading?: boolean;
  className?: string;
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'destructive',
};

export function TransactionTable({
  data,
  total = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  onExportCsv,
  loading,
  className,
}: TransactionTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = React.useMemo<ColumnDef<TransactionRow>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice #',
        cell: ({ row }) => row.getValue('invoiceNumber') ?? '—',
      },
      {
        accessorKey: 'vendorName',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Vendor <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => row.getValue('vendorName') ?? '—',
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Amount <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const amount = row.getValue<number>('amount');
          const currency = row.original.currency;
          return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
        },
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => new Date(row.getValue<string>('date')).toLocaleDateString(),
      },
      {
        accessorKey: 'paymentHead',
        header: 'Category',
        cell: ({ row }) => row.getValue('paymentHead') ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue<string>('status');
          return <Badge variant={statusVariant[status] ?? 'secondary'}>{status}</Badge>;
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={cn('space-y-3', className)}>
      {onExportCsv && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} transaction{total !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
