import { useMemo, useState, type ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownAZ, ArrowUpAZ, ChevronsUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
  className?: string;
  headerClassName?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  page = 1,
  totalPages = 1,
  onPageChange,
  emptyMessage = 'No records found.',
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const sortedData = useMemo(() => {
    const column = columns.find((col) => col.key === sortKey && col.sortValue);
    if (!column?.sortValue) return data;

    return [...data].sort((a, b) => {
      const aValue = column.sortValue?.(a);
      const bValue = column.sortValue?.(b);
      const compare = String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [columns, data, sortDirection, sortKey]);

  function toggleSort(column: Column<T>) {
    if (!column.sortValue) return;
    if (sortKey === column.key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column.key);
      setSortDirection('asc');
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-md border border-border overflow-hidden">
        {/* Ghost header */}
        <div className="h-10 bg-primary/8 dark:bg-surface-hover border-b border-border" />
        {/* Ghost rows — one Skeleton per row so the test count stays at 6 */}
        <div className="divide-y divide-border bg-surface">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border overflow-x-auto">
        <Table className="min-w-[64rem]">
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary dark:bg-surface-hover dark:hover:bg-surface-hover border-b border-white/10 dark:border-border">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  aria-sort={sortKey === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                  tabIndex={col.sortValue ? 0 : undefined}
                  className={cn(
                    'text-white/80 dark:text-text-secondary font-medium text-xs uppercase tracking-wide',
                    col.sortValue && 'cursor-pointer select-none',
                    col.headerClassName,
                  )}
                  onClick={() => toggleSort(col)}
                  onKeyDown={(event) => {
                    if (!col.sortValue) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleSort(col);
                    }
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortValue && (
                      sortKey === col.key
                        ? sortDirection === 'asc'
                          ? <ArrowUpAZ size={13} />
                          : <ArrowDownAZ size={13} />
                        : <ChevronsUpDown size={13} className="opacity-60" />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="py-12">
                  <div className="flex flex-col items-center gap-2 text-text-secondary">
                    <Inbox size={36} className="text-text-secondary/40" />
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, i) => (
                <TableRow
                  key={i}
                  className="hover:bg-accent/5 border-b border-border last:border-0 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>{col.render(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold text-text-primary">
            Page {page} <span className="font-normal text-text-secondary">of {totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
