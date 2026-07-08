import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { BookThumb, MemberAvatar } from '@/components/CatalogVisuals';
import type { Book } from '@/services/books.service';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ACTIVE: 'default',
  RETURNED: 'secondary',
  OVERDUE: 'destructive',
};

export interface TransactionRow {
  id: number;
  memberId?: number;
  memberName: string;
  items: { id?: number; book: Book }[];
  borrowedAt: string;
  dueDate: string;
  status: string;
  fine?: { amount: number };
}

interface TransactionListTableProps {
  rows: TransactionRow[];
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export default function TransactionListTable({
  rows,
  isLoading,
  page,
  totalPages,
  onPageChange,
  emptyMessage = 'No transactions match your filters.',
}: TransactionListTableProps) {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'member',
      header: 'Member',
      sortValue: (transaction: TransactionRow) => transaction.memberName,
      render: (transaction: TransactionRow) => (
        <button
          type="button"
          onClick={() => transaction.memberId && navigate(`/transactions/members/${transaction.memberId}`)}
          disabled={!transaction.memberId}
          className="group flex items-center gap-3 text-left disabled:pointer-events-none"
        >
          <MemberAvatar name={transaction.memberName} />
          <span className="font-medium text-text-primary underline-offset-4 group-hover:text-accent group-hover:underline">
            {transaction.memberName}
          </span>
        </button>
      ),
    },
    {
      key: 'books',
      header: 'Books',
      sortValue: (transaction: TransactionRow) => transaction.items.map((item) => item.book.title).join(', '),
      className: 'min-w-[22rem] max-w-[30rem]',
      render: (transaction: TransactionRow) => (
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 -space-x-2">
            {transaction.items.slice(0, 3).map((item) => (
              <BookThumb key={item.book.id} book={item.book} className="ring-2 ring-surface" />
            ))}
          </div>
          <div className="min-w-0 space-y-1">
            {transaction.items.length === 0 ? (
              <p className="font-medium text-text-secondary">No books</p>
            ) : (
              transaction.items.map((item) => (
                <button
                  key={item.book.id}
                  type="button"
                  onClick={() => navigate(`/transactions/books/${item.book.id}`)}
                  className="block max-w-full truncate text-left text-sm font-medium text-text-primary underline-offset-4 hover:text-accent hover:underline"
                >
                  {item.book.title}
                </button>
              ))
            )}
            {transaction.items.length === 1 && (
              <p className="truncate text-xs text-text-secondary">{transaction.items[0]?.book.author}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'borrowed',
      header: 'Borrowed',
      sortValue: (transaction: TransactionRow) => transaction.borrowedAt,
      render: (transaction: TransactionRow) => formatDate(transaction.borrowedAt),
    },
    {
      key: 'due',
      header: 'Due',
      sortValue: (transaction: TransactionRow) => transaction.dueDate,
      render: (transaction: TransactionRow) => formatDate(transaction.dueDate),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (transaction: TransactionRow) => transaction.status,
      render: (transaction: TransactionRow) => (
        <Badge variant={statusVariant[transaction.status] ?? 'secondary'}>{transaction.status}</Badge>
      ),
    },
    {
      key: 'fine',
      header: 'Fine',
      sortValue: (transaction: TransactionRow) => transaction.fine?.amount ?? 0,
      render: (transaction: TransactionRow) => transaction.fine ? `KES ${Number(transaction.fine.amount).toFixed(2)}` : '—',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      emptyMessage={emptyMessage}
    />
  );
}
