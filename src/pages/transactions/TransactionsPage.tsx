import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { transactionsService } from '@/services/transactions.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownCircle, ArrowUpCircle, Search } from 'lucide-react';
import BorrowModal from '@/components/modals/BorrowModal';
import ReturnModal from '@/components/modals/ReturnModal';
import TransactionListTable, { type TransactionRow } from './TransactionListTable';

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAction = searchParams.get('action');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [borrowOpen, setBorrowOpen] = useState(initialAction === 'borrow');
  const [returnOpen, setReturnOpen] = useState(initialAction === 'return');

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.transactions, page, status, q],
    queryFn: () => transactionsService.getAll({
      page,
      limit: 20,
      status: status || undefined,
      q: q.trim() || undefined,
    }),
  });

  const rows: TransactionRow[] = (data?.data as { data?: TransactionRow[] })?.data ?? [];
  const totalPages = (data?.data as { meta?: { totalPages?: number } })?.meta?.totalPages;

  function closeBorrowModal() {
    setBorrowOpen(false);
    if (searchParams.get('action') === 'borrow') setSearchParams({}, { replace: true });
  }

  function closeReturnModal() {
    setReturnOpen(false);
    if (searchParams.get('action') === 'return') setSearchParams({}, { replace: true });
  }

  return (
    <>
      <BorrowModal open={borrowOpen} onClose={closeBorrowModal} />
      <ReturnModal open={returnOpen} onClose={closeReturnModal} />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button onClick={() => setBorrowOpen(true)} className="gap-2"><ArrowDownCircle size={16} /> Borrow</Button>
            <Button variant="outline" onClick={() => setReturnOpen(true)} className="gap-2"><ArrowUpCircle size={16} /> Return</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-surface p-3 lg:grid-cols-[minmax(16rem,1fr)_13rem]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input
              className="pl-9"
              placeholder="Search by member name, book title, or author..."
              value={q}
              onChange={(event) => { setQ(event.target.value); setPage(1); }}
            />
          </div>
          <Select value={status || 'ALL'} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="RETURNED">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TransactionListTable rows={rows} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}
