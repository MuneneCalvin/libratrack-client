import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsService } from '@/services/reservations.service';
import { QUERY_KEYS } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, BookOpen, Search, Clock3, CheckCircle2, TimerReset } from 'lucide-react';
import { toast } from 'sonner';
import { BookThumb, MemberAvatar } from '@/components/CatalogVisuals';

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
  PENDING: 'default', FULFILLED: 'secondary', CANCELLED: 'secondary', EXPIRED: 'destructive',
};

export default function ReservationsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.reservations, 'table'],
    queryFn: () => reservationsService.getAll({ limit: 100 }),
  });

  const cancelMutation = useMutation({
    mutationFn: reservationsService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
      toast.success('Reservation declined');
    },
    onError: () => {
      toast.error('Failed to decline reservation');
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: reservationsService.fulfill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
      toast.success('Reservation approved');
    },
    onError: () => {
      toast.error('Failed to approve reservation');
    },
  });

  const isPending = cancelMutation.isPending || fulfillMutation.isPending;
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
  const fulfilledCount = reservations.filter((reservation) => reservation.status === 'FULFILLED').length;
  const closedCount = reservations.filter((reservation) => reservation.status === 'CANCELLED' || reservation.status === 'EXPIRED').length;

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
      render: (reservation: Reservation) => (
        reservation.status === 'PENDING' ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-success"
              disabled={isPending}
              onClick={() => fulfillMutation.mutate(reservation.id)}
            >
              <CheckCircle size={14} /> Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger"
              disabled={isPending}
              onClick={() => cancelMutation.mutate(reservation.id)}
            >
              <XCircle size={14} /> Decline
            </Button>
          </div>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reservations</h1>
        <p className="mt-1 text-sm text-text-secondary">Search, sort, approve, and track book reservations.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard icon={BookOpen} label="Total reservations" value={reservations.length} />
        <MetricCard icon={Clock3} label="Pending" value={pendingCount} />
        <MetricCard icon={CheckCircle2} label="Fulfilled" value={fulfilledCount} />
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
            {['ALL', 'PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED'].map((option) => (
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
    </div>
  );
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
  return status.charAt(0) + status.slice(1).toLowerCase();
}
