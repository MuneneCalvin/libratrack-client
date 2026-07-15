import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { transactionsService } from '@/services/transactions.service';
import { finesService } from '@/services/fines.service';
import { QUERY_KEYS } from '@/lib/constants';
import { BookThumb } from '@/components/CatalogVisuals';
import StatsCard from '@/components/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, BookMarked, CheckCircle2, Clock3, RotateCcw } from 'lucide-react';
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils';

interface TransactionBook {
  id: number;
  title: string;
  author?: string;
  coverUrl?: string | null;
}

interface TransactionItem {
  id: number;
  returnedAt?: string | null;
  book: TransactionBook;
}

interface MemberTransaction {
  id: number;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  status: string;
  items: TransactionItem[];
}

interface FineRow {
  id: number;
  amount: number;
  reason: string;
  isPaid: boolean;
  isWaived: boolean;
  createdAt: string;
}

export default function PortalMyBooksPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: QUERY_KEYS.memberTransactions(memberId),
    queryFn: () => transactionsService.getByMember(memberId),
    enabled: !!user?.memberId,
  });
  const { data: finesData, isLoading: finesLoading } = useQuery({
    queryKey: QUERY_KEYS.memberFines(memberId),
    queryFn: () => finesService.getByMember(memberId),
    enabled: !!user?.memberId,
  });

  const transactions = useMemo(
    () => unwrapData<MemberTransaction[]>(transactionsData?.data) ?? [],
    [transactionsData],
  );
  const fines = unwrapData<FineRow[]>(finesData?.data) ?? [];

  if (!user?.memberId) return <p className="text-text-secondary">Not available.</p>;
  if (transactionsLoading || finesLoading) return <p className="text-text-secondary">Loading…</p>;

  const current = transactions.filter((transaction) =>
    ['ACTIVE', 'OVERDUE'].includes(transaction.status)
    && transaction.items.some((item) => !item.returnedAt)
  );
  const dueSoon = current.filter((transaction) => {
    const days = daysUntil(transaction.dueDate);
    return days >= 0 && days <= 3;
  });
  const overdue = current.filter((transaction) => transaction.status === 'OVERDUE' || daysUntil(transaction.dueDate) < 0);
  const returned = transactions.filter((transaction) => transaction.status === 'RETURNED' || transaction.returnedAt);
  const outstandingFines = fines.filter((fine) => !fine.isPaid && !fine.isWaived);
  const totalFine = outstandingFines.reduce((sum, fine) => sum + Number(fine.amount), 0);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <BookMarked size={13} /> Borrowing shelf
            </div>
            <h1 className="text-2xl font-bold text-text-primary">My Books</h1>
            <p className="mt-1 text-sm text-text-secondary">Current loans, upcoming returns, fines, and returned books.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Currently borrowed" value={current.length} icon={BookMarked} />
        <StatsCard title="Due soon" value={dueSoon.length} icon={Clock3} variant={dueSoon.length ? 'warning' : 'default'} />
        <StatsCard title="Overdue" value={overdue.length} icon={AlertTriangle} variant={overdue.length ? 'danger' : 'default'} />
        <StatsCard title="Outstanding fines" value={formatCurrency(totalFine)} icon={AlertTriangle} variant={totalFine > 0 ? 'danger' : 'default'} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <BookSection
          title="Currently Borrowed"
          empty="No books currently borrowed."
          transactions={current}
          badgeFor={(transaction) => {
            const days = daysUntil(transaction.dueDate);
            if (days < 0) return <Badge variant="destructive">Overdue</Badge>;
            if (days <= 3) return <Badge>Due soon</Badge>;
            return <Badge variant="secondary">Active</Badge>;
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle size={16} /> Fines on Books
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {outstandingFines.length === 0 ? (
              <p className="py-2 text-sm text-text-secondary">No outstanding fines.</p>
            ) : (
              outstandingFines.map((fine) => (
                <div key={fine.id} className="rounded-md border border-danger/20 bg-danger/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{fine.reason}</p>
                      <p className="mt-1 text-xs text-text-secondary">Recorded {formatDate(fine.createdAt)}</p>
                    </div>
                    <span className="shrink-0 font-semibold text-danger">{formatCurrency(Number(fine.amount))}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <BookSection
          title="Nearing Return Date"
          empty="No books due in the next 3 days."
          transactions={dueSoon}
          badgeFor={() => <Badge>Due soon</Badge>}
        />
        <BookSection
          title="Successfully Returned"
          empty="No returned books yet."
          transactions={returned}
          badgeFor={() => <Badge variant="secondary">Returned</Badge>}
        />
      </div>
    </div>
  );
}

function BookSection({
  title,
  empty,
  transactions,
  badgeFor,
}: {
  title: string;
  empty: string;
  transactions: MemberTransaction[];
  badgeFor: (transaction: MemberTransaction) => ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RotateCcw size={16} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-2 text-sm text-text-secondary">{empty}</p>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    {transaction.items.map((item) => (
                      <Link
                        key={item.id}
                        to={`/portal/books/${item.book.id}`}
                        className="group flex min-w-0 items-center gap-3 rounded-lg p-1.5 -m-1.5 transition-colors hover:bg-accent/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      >
                        <BookThumb book={item.book} className="size-12 rounded-md" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary underline-offset-4 group-hover:text-accent group-hover:underline">{item.book.title}</p>
                          <p className="truncate text-xs text-text-secondary">{item.book.author ?? 'Unknown author'}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    {badgeFor(transaction)}
                    <span className="text-xs text-text-secondary">
                      Due {formatDate(transaction.dueDate)}
                    </span>
                    {transaction.returnedAt && (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 size={13} /> Returned {formatDate(transaction.returnedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function unwrapData<T>(payload: unknown): T | undefined {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data;
  }
  return payload as T | undefined;
}
