import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { transactionsService } from '@/services/transactions.service';
import { QUERY_KEYS } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ACTIVE: 'default', RETURNED: 'secondary', OVERDUE: 'destructive',
};

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.transactions, page, status],
    queryFn: () => transactionsService.getAll({ page, limit: 20, status: status || undefined }),
  });

  const columns = [
    { key: 'member', header: 'Member', render: (t: { member: { fullName: string } }) => t.member.fullName },
    { key: 'books', header: 'Books', render: (t: { items: { book: { title: string } }[] }) => t.items.map((i) => i.book.title).join(', ') },
    { key: 'borrowed', header: 'Borrowed', render: (t: { borrowedAt: string }) => formatDate(t.borrowedAt) },
    { key: 'due', header: 'Due', render: (t: { dueDate: string }) => formatDate(t.dueDate) },
    { key: 'status', header: 'Status', render: (t: { status: string }) => <Badge variant={statusVariant[t.status] ?? 'secondary'}>{t.status}</Badge> },
    { key: 'fine', header: 'Fine', render: (t: { fine?: { amount: number } }) => t.fine ? `$${Number(t.fine.amount).toFixed(2)}` : '—' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/transactions/borrow')} className="gap-2"><ArrowDownCircle size={16} /> Borrow</Button>
          <Button variant="outline" onClick={() => navigate('/transactions/return')} className="gap-2"><ArrowUpCircle size={16} /> Return</Button>
        </div>
      </div>
      <Select value={status} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1); }}>
        <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="OVERDUE">Overdue</SelectItem>
          <SelectItem value="RETURNED">Returned</SelectItem>
        </SelectContent>
      </Select>
      <DataTable columns={columns} data={(data?.data as { data?: unknown[] })?.data ?? []} isLoading={isLoading} page={page} totalPages={(data?.data as { meta?: { totalPages?: number } })?.meta?.totalPages} onPageChange={setPage} />
    </div>
  );
}
