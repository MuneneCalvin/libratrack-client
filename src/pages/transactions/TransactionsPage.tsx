import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionsService } from '@/services/transactions.service';
import { QUERY_KEYS } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import BorrowModal from '@/components/modals/BorrowModal';
import ReturnModal from '@/components/modals/ReturnModal';
import { BookThumb, MemberAvatar } from '@/components/CatalogVisuals';
import type { Book } from '@/services/books.service';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ACTIVE: 'default', RETURNED: 'secondary', OVERDUE: 'destructive',
};

interface TransactionRow {
  memberName: string;
  items: { book: Book }[];
  borrowedAt: string;
  dueDate: string;
  status: string;
  fine?: { amount: number };
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.transactions, page, status],
    queryFn: () => transactionsService.getAll({ page, limit: 20, status: status || undefined }),
  });

  const rows: TransactionRow[] = (data?.data as { data?: TransactionRow[] })?.data ?? [];
  const totalPages = (data?.data as { meta?: { totalPages?: number } })?.meta?.totalPages;

  const columns = [
    { key: 'member', header: 'Member', sortValue: (t: TransactionRow) => t.memberName, render: (t: TransactionRow) => (
      <div className="flex items-center gap-3">
        <MemberAvatar name={t.memberName} />
        <span className="font-medium">{t.memberName}</span>
      </div>
    ) },
    { key: 'books', header: 'Books', sortValue: (t: TransactionRow) => t.items.map((i) => i.book.title).join(', '), className: 'min-w-[20rem] max-w-[28rem]', render: (t: TransactionRow) => {
      const firstBook = t.items[0]?.book;
      return (
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 -space-x-2">
            {t.items.slice(0, 3).map((item) => (
              <BookThumb key={item.book.id} book={item.book} className="ring-2 ring-surface" />
            ))}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{firstBook?.title ?? 'No books'}</p>
            <p className="truncate text-xs text-text-secondary">
              {t.items.length > 1 ? `${t.items.length} books: ${t.items.map((i) => i.book.title).join(', ')}` : firstBook?.author}
            </p>
          </div>
        </div>
      );
    } },
    { key: 'borrowed', header: 'Borrowed', sortValue: (t: TransactionRow) => t.borrowedAt, render: (t: TransactionRow) => formatDate(t.borrowedAt) },
    { key: 'due', header: 'Due', sortValue: (t: TransactionRow) => t.dueDate, render: (t: TransactionRow) => formatDate(t.dueDate) },
    { key: 'status', header: 'Status', sortValue: (t: TransactionRow) => t.status, render: (t: TransactionRow) => <Badge variant={statusVariant[t.status] ?? 'secondary'}>{t.status}</Badge> },
    { key: 'fine', header: 'Fine', sortValue: (t: TransactionRow) => t.fine?.amount ?? 0, render: (t: TransactionRow) => t.fine ? `KES ${Number(t.fine.amount).toFixed(2)}` : '—' },
  ];

  return (
    <>
      <BorrowModal open={borrowOpen} onClose={() => setBorrowOpen(false)} />
      <ReturnModal open={returnOpen} onClose={() => setReturnOpen(false)} />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button onClick={() => setBorrowOpen(true)} className="gap-2"><ArrowDownCircle size={16} /> Borrow</Button>
            <Button variant="outline" onClick={() => setReturnOpen(true)} className="gap-2"><ArrowUpCircle size={16} /> Return</Button>
          </div>
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
          </SelectContent>
        </Select>
        <DataTable columns={columns} data={rows} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}
