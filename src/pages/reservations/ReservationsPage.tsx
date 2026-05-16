import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsService } from '@/services/reservations.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, BookOpen, User, Calendar, Clock } from 'lucide-react';

interface Reservation {
  id: number;
  memberName: string;
  bookTitle: string;
  bookAuthor: string;
  reservedAt: string;
  expiresAt: string;
  status: string;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'default', FULFILLED: 'secondary', CANCELLED: 'secondary', EXPIRED: 'destructive',
};

const statusColor: Record<string, string> = {
  PENDING: 'border-l-accent',
  FULFILLED: 'border-l-green-500',
  CANCELLED: 'border-l-border',
  EXPIRED: 'border-l-danger',
};

export default function ReservationsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.reservations, page, status],
    queryFn: () => reservationsService.getAll({ page, limit: 20, status: status || undefined }),
  });

  const cancelMutation = useMutation({
    mutationFn: reservationsService.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations }),
  });

  const fulfillMutation = useMutation({
    mutationFn: reservationsService.fulfill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations }),
  });

  const isPending = cancelMutation.isPending || fulfillMutation.isPending;
  const reservations: Reservation[] = (data?.data as { data?: Reservation[] })?.data ?? [];
  const totalPages = (data?.data as { meta?: { totalPages?: number } })?.meta?.totalPages;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Reservations</h1>
        <Select value={status} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            {['ALL', 'PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED'].map((s) => (
              <SelectItem key={s} value={s}>{s === 'ALL' ? 'All' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-text-secondary">Loading reservations…</p>}

      {!isLoading && reservations.length === 0 && (
        <div className="text-center py-16 text-text-secondary">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>No reservations found.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reservations.map((r) => (
          <Card key={r.id} className={`border-l-4 ${statusColor[r.status] ?? 'border-l-border'}`}>
            <CardContent className="p-4 space-y-3">
              {/* Book info */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                  <BookOpen size={18} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary leading-snug line-clamp-1">{r.bookTitle}</p>
                  <p className="text-xs text-text-secondary">{r.bookAuthor}</p>
                </div>
                <Badge variant={statusVariant[r.status] ?? 'secondary'} className="text-xs shrink-0 ml-auto">
                  {r.status}
                </Badge>
              </div>

              {/* Member info */}
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <User size={13} className="shrink-0" />
                <span className="font-medium text-text-primary">{r.memberName}</span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} />
                  <span>Reserved: {formatDate(r.reservedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={11} />
                  <span>Expires: {formatDate(r.expiresAt)}</span>
                </div>
              </div>

              {/* Actions */}
              {r.status === 'PENDING' && (
                <div className="flex gap-2 pt-1 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 gap-1.5"
                    disabled={isPending}
                    onClick={() => fulfillMutation.mutate(r.id)}
                  >
                    <CheckCircle size={14} /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-danger border-red-200 hover:bg-red-50 hover:border-red-300 gap-1.5"
                    disabled={isPending}
                    onClick={() => cancelMutation.mutate(r.id)}
                  >
                    <XCircle size={14} /> Decline
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
