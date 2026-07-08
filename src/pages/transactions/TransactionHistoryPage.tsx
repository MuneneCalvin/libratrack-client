import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, UserRound } from 'lucide-react';
import { transactionsService } from '@/services/transactions.service';
import { QUERY_KEYS } from '@/lib/constants';
import PageBackButton from '@/components/PageBackButton';
import TransactionListTable, { type TransactionRow } from './TransactionListTable';

interface TransactionHistoryPageProps {
  scope: 'member' | 'book';
}

export default function TransactionHistoryPage({ scope }: TransactionHistoryPageProps) {
  const [page, setPage] = useState(1);
  const { memberId, bookId } = useParams<{ memberId?: string; bookId?: string }>();
  const navigate = useNavigate();
  const scopeId = Number(scope === 'member' ? memberId : bookId);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.transactions, scope, scopeId, page],
    queryFn: () => transactionsService.getAll({
      page,
      limit: 20,
      memberId: scope === 'member' ? scopeId : undefined,
      bookId: scope === 'book' ? scopeId : undefined,
    }),
    enabled: Number.isFinite(scopeId) && scopeId > 0,
  });

  const rows: TransactionRow[] = (data?.data as { data?: TransactionRow[] })?.data ?? [];
  const totalPages = (data?.data as { meta?: { totalPages?: number } })?.meta?.totalPages;
  const title = scope === 'member'
    ? rows[0]?.memberName ?? `Member #${scopeId}`
    : rows.flatMap((row) => row.items).find((item) => item.book.id === scopeId)?.book.title ?? `Book #${scopeId}`;
  const Icon = scope === 'member' ? UserRound : BookOpen;

  return (
    <div className="space-y-5">
      <div>
        <PageBackButton label="Back to transactions" onClick={() => navigate('/transactions')} />
        <div className="flex items-start gap-3">
          <div className="mt-1 grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {scope === 'member' ? 'All recorded transactions for this member.' : 'All recorded transactions involving this book.'}
            </p>
          </div>
        </div>
      </div>

      <TransactionListTable
        rows={rows}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No transactions found for this view."
      />
    </div>
  );
}
