import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { reservationsService } from '@/services/reservations.service';
import { booksService, type Book } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate, daysUntil } from '@/lib/utils';
import { BookThumb } from '@/components/CatalogVisuals';
import { BookOpen, BookmarkPlus, CalendarCheck, CheckCircle2, Clock3, Plus, Search, TimerReset, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ReservationRow {
  id: number;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl?: string | null;
  status: string;
  reservedAt: string;
  expiresAt: string;
}

export default function PortalReservationsPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.memberReservations(memberId),
    queryFn: () => reservationsService.getByMember(memberId),
    enabled: !!user?.memberId,
  });

  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: [...QUERY_KEYS.books, 'search', search],
    queryFn: () => booksService.getAll({ search, limit: 10, available: true }),
    enabled: open,
  });

  const cancelMutation = useMutation({
    mutationFn: reservationsService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberReservations(memberId) });
      toast.success('Reservation cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel reservation');
    },
  });

  const createMutation = useMutation({
    mutationFn: (bookId: number) => reservationsService.create(memberId, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberReservations(memberId) });
      setOpen(false);
      setSearch('');
      setSelectedBookId(null);
      toast.success('Reservation created');
    },
    onError: () => {
      toast.error('Failed to reserve book');
    },
  });

  const reservations = unwrapData<ReservationRow[]>(data?.data) ?? [];
  const books = unwrapData<Book[]>(booksData?.data) ?? [];
  const pending = reservations.filter((r) => r.status === 'PENDING');
  const fulfilled = reservations.filter((r) => r.status === 'FULFILLED');
  const cancelled = reservations.filter((r) => r.status === 'CANCELLED');
  const expired = reservations.filter((r) => r.status === 'EXPIRED');
  const needle = q.trim().toLowerCase();
  const filteredReservations = reservations.filter((reservation) => {
    const statusMatch = !status || reservation.status === status;
    if (!needle) return statusMatch;
    const text = `${reservation.bookTitle} ${reservation.bookAuthor} ${reservation.status}`.toLowerCase();
    return statusMatch && text.includes(needle);
  });
  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / 20));
  const pageRows = filteredReservations.slice((page - 1) * 20, page * 20);
  const nextExpiry = pending
    .map((r) => daysUntil(r.expiresAt))
    .sort((a, b) => a - b)[0];
  const columns = [
    {
      key: 'book',
      header: 'Book',
      sortValue: (reservation: ReservationRow) => reservation.bookTitle,
      className: 'min-w-[22rem]',
      render: (reservation: ReservationRow) => (
        <div className="flex items-center gap-3">
          <BookThumb book={{ title: reservation.bookTitle, coverUrl: reservation.bookCoverUrl ?? undefined }} />
          <div className="min-w-0">
            <p className="line-clamp-1 font-medium text-text-primary">{reservation.bookTitle}</p>
            <p className="truncate text-xs text-text-secondary">{reservation.bookAuthor}</p>
          </div>
        </div>
      ),
    },
    { key: 'reserved', header: 'Reserved', sortValue: (reservation: ReservationRow) => reservation.reservedAt, render: (reservation: ReservationRow) => formatDate(reservation.reservedAt) },
    { key: 'expires', header: 'Expires', sortValue: (reservation: ReservationRow) => reservation.expiresAt, render: (reservation: ReservationRow) => formatDate(reservation.expiresAt) },
    {
      key: 'status',
      header: 'Status',
      sortValue: (reservation: ReservationRow) => reservation.status,
      render: (reservation: ReservationRow) => <ReservationBadge status={reservation.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (reservation: ReservationRow) => (
        reservation.status === 'PENDING' ? (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-danger"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(reservation.id)}
            >
              Cancel
            </Button>
          </div>
        ) : null
      ),
    },
  ];

  if (!user?.memberId) return <p className="text-text-secondary">Not available.</p>;
  if (isLoading) return <p className="text-text-secondary">Loading…</p>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <BookmarkPlus size={13} /> Reservation shelf
            </div>
            <h1 className="text-2xl font-bold text-text-primary">My Reservations</h1>
            <p className="mt-1 text-sm text-text-secondary">Track holds, expiry dates, and books waiting for pickup.</p>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={16} /> New Reservation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile icon={Clock3} label="Pending" value={pending.length} />
        <SummaryTile icon={CheckCircle2} label="Fulfilled" value={fulfilled.length} tone="success" />
        <SummaryTile icon={TimerReset} label="Next expiry" value={nextExpiry != null ? `${Math.max(0, nextExpiry)} days` : 'None'} />
        <SummaryTile icon={XCircle} label="Closed" value={cancelled.length + expired.length} tone="muted" />
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-surface p-3 lg:grid-cols-[minmax(16rem,1fr)_13rem]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <Input
            className="pl-9"
            placeholder="Search by book, author, or status..."
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

      {reservations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-accent/10 text-accent">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="font-semibold text-text-primary">No reservations yet</p>
              <p className="mt-1 text-sm text-text-secondary">Reserve a book and it will appear here with its pickup window.</p>
            </div>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus size={15} /> Reserve a book
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={pageRows}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No reservations match your filters."
        />
      )}

      {/* New Reservation Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSearch(''); setSelectedBookId(null); } }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] overflow-x-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border px-5 pb-4 pt-5 sm:px-6">
            <DialogTitle>Reserve a Book</DialogTitle>
          </DialogHeader>
          <div className="max-h-[min(64vh,34rem)] space-y-4 overflow-y-auto overflow-x-hidden px-5 py-4 sm:px-6">
            <div className="space-y-1.5">
              <Label>Search for a book</Label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <Input
                  className="pl-9"
                  placeholder="Title, author, or ISBN…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedBookId(null); }}
                />
              </div>
            </div>

            {/* Book results */}
            {booksLoading && <p className="text-sm text-text-secondary">Searching…</p>}
            {books.length > 0 && (
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                {books.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBookId(b.id)}
                    className={`flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-accent/5 ${selectedBookId === b.id ? 'bg-accent/10' : ''}`}
                  >
                    <BookThumb book={b} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text-primary">{b.title}</p>
                      <p className="truncate text-xs text-text-secondary">{b.author} · {b.availableCopies} available</p>
                    </div>
                    {selectedBookId === b.id && <CalendarCheck size={16} className="text-accent" />}
                  </button>
                ))}
              </div>
            )}
            {search && !booksLoading && books.length === 0 && (
              <p className="text-sm text-text-secondary">No books found.</p>
            )}
          </div>
          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-4 sm:px-6">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedBookId || createMutation.isPending}
              onClick={() => selectedBookId && createMutation.mutate(selectedBookId)}
            >
              {createMutation.isPending ? 'Reserving…' : 'Reserve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'muted';
}) {
  const toneClass = tone === 'success' ? 'bg-success/10 text-success' : tone === 'muted' ? 'bg-surface-hover text-text-secondary' : 'bg-accent/10 text-accent';

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid size-10 place-items-center rounded-full ${toneClass}`}>
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

function ReservationBadge({ status }: { status: string }) {
  if (status === 'PENDING') return <Badge>Pending</Badge>;
  if (status === 'FULFILLED') return <Badge variant="secondary">Fulfilled</Badge>;
  if (status === 'EXPIRED') return <Badge variant="destructive">Expired</Badge>;
  return <Badge variant="outline">{status.toLowerCase()}</Badge>;
}

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function unwrapData<T>(payload: unknown): T | undefined {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data;
  }
  return payload as T | undefined;
}
