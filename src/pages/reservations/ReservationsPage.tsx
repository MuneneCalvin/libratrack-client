import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsService } from '@/services/reservations.service';
import { QUERY_KEYS } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'default', FULFILLED: 'secondary', CANCELLED: 'secondary', EXPIRED: 'destructive',
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

  const columns = [
    { key: 'member', header: 'Member', render: (r: { member: { fullName: string } }) => r.member.fullName },
    { key: 'book', header: 'Book', render: (r: { book: { title: string } }) => r.book.title },
    { key: 'reserved', header: 'Reserved', render: (r: { reservedAt: string }) => formatDate(r.reservedAt) },
    { key: 'expires', header: 'Expires', render: (r: { expiresAt: string }) => formatDate(r.expiresAt) },
    { key: 'status', header: 'Status', render: (r: { status: string }) => <Badge variant={statusVariant[r.status] ?? 'secondary'}>{r.status}</Badge> },
    { key: 'actions', header: '', render: (r: { id: number; status: string }) => r.status === 'PENDING' ? (
      <Button variant="ghost" size="sm" className="text-danger" onClick={() => cancelMutation.mutate(r.id)}>Cancel</Button>
    ) : null },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-text-primary">Reservations</h1>
      <Select value={status} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1); }}>
        <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
        <SelectContent>
          {['ALL', 'PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED'].map((s) => <SelectItem key={s} value={s}>{s === 'ALL' ? 'All' : s}</SelectItem>)}
        </SelectContent>
      </Select>
      <DataTable columns={columns} data={(data?.data as { data?: unknown[] })?.data ?? []} isLoading={isLoading} page={page} totalPages={(data?.data as { meta?: { totalPages?: number } })?.meta?.totalPages} onPageChange={setPage} />
    </div>
  );
}
