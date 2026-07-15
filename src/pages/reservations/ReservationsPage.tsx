import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsService } from '@/services/reservations.service';
import { QUERY_KEYS } from '@/lib/constants';
import { getApiErrorMessage } from '@/lib/apiErrors';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, BookOpen, Search, Clock3, CheckCircle2, TimerReset } from 'lucide-react';
import { toast } from 'sonner';
import { BookThumb, MemberAvatar } from '@/components/CatalogVisuals';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TableActionButton, TableActionGroup } from '@/components/TableActions';

interface Reservation {
  id: number;
  memberId?: number;
  memberName: string;
  bookId?: number;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl?: string | null;
  reservedAt: string;
  expiresAt: string;
  status: string;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'default',
  READY_FOR_PICKUP: 'default',
  BORROWED: 'secondary',
  CANCELLED: 'secondary',
  EXPIRED: 'destructive',
};

type ReservationAction = { type: 'approve' | 'issue' | 'decline'; reservation: Reservation };

export default function ReservationsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [pendingAction, setPendingAction] = useState<ReservationAction | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.reservations, 'table'],
    queryFn: () => reservationsService.getAll({ limit: 100 }),
  });

  const cancelMutation = useMutation({
    mutationFn: reservationsService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
      setPendingAction(null);
      toast.success('Reservation cancelled');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to cancel reservation'));
    },
  });

  const approveMutation = useMutation({
    mutationFn: reservationsService.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
      setPendingAction(null);
      toast.success('Reservation approved', {
        description: 'Copy held for pickup until the reservation deadline.',
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to approve reservation'));
    },
  });

  const issueMutation = useMutation({
    mutationFn: reservationsService.issue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
      setPendingAction(null);
      toast.success('Book issued');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to issue reserved book'));
    },
  });

  const isPending = cancelMutation.isPending || approveMutation.isPending || issueMutation.isPending;
  const reservations: Reservation[] = (data?.data as { data?: Reservation[] })?.data ?? [];
  const needle = q.trim().toLowerCase();
  const filteredReservations = reservations.filter((reservation) => {
    const statusMatch = !status || reservation.status === status;
    if (!needle) return statusMatch;
    const text = `${reservation.bookTitle} ${reservation.bookAuthor} ${reservation.memberName} ${reservation.status}`.toLowerCase();
    return statusMatch && text.includes(needle);
  });
  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / 20));
  const pageRows = filteredReservations.slice((page - 1) * 20, page * 20);
  const pendingCount = reservations.filter((reservation) => reservation.status === 'PENDING').length;
  const readyCount = reservations.filter((reservation) => reservation.status === 'READY_FOR_PICKUP').length;
  const borrowedCount = reservations.filter((reservation) => reservation.status === 'BORROWED' || reservation.status === 'FULFILLED').length;
  const closedCount = reservations.filter((reservation) => reservation.status === 'CANCELLED' || reservation.status === 'EXPIRED').length;
  const confirmCopy = getReservationConfirmCopy(pendingAction);

  const columns = [
    {
      key: 'book',
      header: 'Book',
      sortValue: (reservation: Reservation) => reservation.bookTitle,
      className: 'min-w-[22rem]',
      render: (reservation: Reservation) => (
        <div className="flex items-center gap-3">
          <BookThumb book={{ title: reservation.bookTitle, coverUrl: reservation.bookCoverUrl ?? undefined }} />
          <div className="min-w-0">
            <p className="line-clamp-1 font-medium text-text-primary">{reservation.bookTitle}</p>
            <p className="truncate text-xs text-text-secondary">{reservation.bookAuthor}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Member',
      sortValue: (reservation: Reservation) => reservation.memberName,
      render: (reservation: Reservation) => (
        <div className="flex items-center gap-3">
          <MemberAvatar name={reservation.memberName} />
          <span className="font-medium">{reservation.memberName}</span>
        </div>
      ),
    },
    { key: 'reserved', header: 'Reserved', sortValue: (reservation: Reservation) => reservation.reservedAt, render: (reservation: Reservation) => formatDate(reservation.reservedAt) },
    { key: 'expires', header: 'Expires', sortValue: (reservation: Reservation) => reservation.expiresAt, render: (reservation: Reservation) => formatDate(reservation.expiresAt) },
    {
      key: 'status',
      header: 'Status',
      sortValue: (reservation: Reservation) => reservation.status,
      render: (reservation: Reservation) => (
        <Badge variant={statusVariant[reservation.status] ?? 'secondary'}>{formatStatus(reservation.status)}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (reservation: Reservation) => {
        if (reservation.status === 'PENDING') {
          return (
            <TableActionGroup>
              <TableActionButton
                label="Approve hold"
                icon={CheckCircle}
                tone="success"
                disabled={isPending}
                onClick={() => setPendingAction({ type: 'approve', reservation })}
              />
              <TableActionButton
                label="Cancel"
                icon={XCircle}
                tone="danger"
                disabled={isPending}
                onClick={() => setPendingAction({ type: 'decline', reservation })}
              />
            </TableActionGroup>
          );
        }

        if (reservation.status === 'READY_FOR_PICKUP') {
          return (
            <TableActionGroup>
              <TableActionButton
                label="Issue book"
                icon={CheckCircle}
                tone="success"
                disabled={isPending}
                onClick={() => setPendingAction({ type: 'issue', reservation })}
              />
              <TableActionButton
                label="Cancel"
                icon={XCircle}
                tone="danger"
                disabled={isPending}
                onClick={() => setPendingAction({ type: 'decline', reservation })}
              />
            </TableActionGroup>
          );
        }

        return null;
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reservations</h1>
        <p className="mt-1 text-sm text-text-secondary">Search, sort, approve, and track book reservations.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard icon={Clock3} label="Pending" value={pendingCount} />
        <MetricCard icon={CheckCircle2} label="Ready for pickup" value={readyCount} />
        <MetricCard icon={BookOpen} label="Borrowed" value={borrowedCount} />
        <MetricCard icon={TimerReset} label="Closed" value={closedCount} />
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-surface p-3 lg:grid-cols-[minmax(16rem,1fr)_13rem]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <Input
            className="pl-9"
            placeholder="Search by book, author, member, or status..."
            value={q}
            onChange={(event) => { setQ(event.target.value); setPage(1); }}
          />
        </div>
        <Select value={status || 'ALL'} onValueChange={(value) => { setStatus(value === 'ALL' ? '' : value); setPage(1); }}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            {['ALL', 'PENDING', 'READY_FOR_PICKUP', 'BORROWED', 'EXPIRED', 'CANCELLED'].map((option) => (
              <SelectItem key={option} value={option}>{option === 'ALL' ? 'All statuses' : formatStatus(option)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={pageRows}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No reservations match your filters."
      />
      <ConfirmDialog
        open={!!pendingAction}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        eyebrow={confirmCopy.eyebrow}
        tone={confirmCopy.tone}
        isPending={isPending}
        contentClassName="min-h-[30rem] sm:max-w-[44rem]"
        onOpenChange={(open) => !open && setPendingAction(null)}
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.type === 'approve') approveMutation.mutate(pendingAction.reservation.id);
          else if (pendingAction.type === 'issue') issueMutation.mutate(pendingAction.reservation.id);
          else cancelMutation.mutate(pendingAction.reservation.id);
        }}
      >
        {pendingAction && <ReservationConfirmSummary reservation={pendingAction.reservation} />}
      </ConfirmDialog>
    </div>
  );
}

function ReservationConfirmSummary({ reservation }: { reservation: Reservation }) {
  return (
    <div className="grid gap-3 rounded-xl border border-border/80 bg-background/75 p-3 text-sm sm:grid-cols-2">
      <div className="flex min-w-0 items-center gap-3 rounded-lg bg-surface/80 p-3">
        <BookThumb book={{ title: reservation.bookTitle, coverUrl: reservation.bookCoverUrl ?? undefined }} className="size-12 rounded-md" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Book</p>
          <p className="truncate font-semibold text-text-primary">{reservation.bookTitle}</p>
          <p className="truncate text-xs text-text-secondary">{reservation.bookAuthor || 'Unknown author'}</p>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-3 rounded-lg bg-surface/80 p-3">
        <MemberAvatar name={reservation.memberName} className="size-12" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Member</p>
          <p className="truncate font-semibold text-text-primary">{reservation.memberName}</p>
          <p className="text-xs text-text-secondary">Reserved {formatDate(reservation.reservedAt)}</p>
        </div>
      </div>
      <div className="rounded-lg bg-surface/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Status</p>
        <p className="mt-1 font-semibold text-text-primary">{formatStatus(reservation.status)}</p>
      </div>
      <div className="rounded-lg bg-surface/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Hold expires</p>
        <p className="mt-1 font-semibold text-text-primary">{formatDate(reservation.expiresAt)}</p>
      </div>
    </div>
  );
}

function getReservationConfirmCopy(action: ReservationAction | null): {
  title: string;
  description: string;
  confirmLabel: string;
  eyebrow: string;
  tone: 'danger' | 'warning' | 'success';
} {
  if (!action) return { title: '', description: '', confirmLabel: '', eyebrow: '', tone: 'warning' };
  const { reservation } = action;
  if (action.type === 'approve') {
    return {
      title: 'Approve pickup hold?',
      description: `${reservation.memberName}'s reservation for "${reservation.bookTitle}" will hold one copy until ${formatDate(reservation.expiresAt)}. The book is not borrowed until pickup.`,
      confirmLabel: 'Approve hold',
      eyebrow: 'Pickup hold',
      tone: 'success',
    };
  }
  if (action.type === 'issue') {
    return {
      title: 'Issue reserved book?',
      description: `${reservation.memberName} has arrived to pick up "${reservation.bookTitle}". This creates an active borrow and counts against their borrowing limit.`,
      confirmLabel: 'Issue book',
      eyebrow: 'Issue book',
      tone: 'success',
    };
  }
  return {
    title: 'Cancel reservation?',
    description: reservation.status === 'READY_FOR_PICKUP'
      ? `${reservation.memberName}'s pickup hold for "${reservation.bookTitle}" will be cancelled and the held copy will be released.`
      : `${reservation.memberName}'s reservation for "${reservation.bookTitle}" will be cancelled and closed.`,
    confirmLabel: 'Cancel',
    eyebrow: 'Cancel hold',
    tone: 'danger',
  };
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-accent/10 p-2 text-accent">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="text-xl font-bold text-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    READY_FOR_PICKUP: 'Ready for pickup',
    BORROWED: 'Borrowed',
    FULFILLED: 'Borrowed',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  };
  return labels[status] ?? status.charAt(0) + status.slice(1).toLowerCase();
}
