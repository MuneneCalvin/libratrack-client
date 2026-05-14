import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { reservationsService } from '@/services/reservations.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export default function PortalReservationsPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.memberReservations(memberId),
    queryFn: () => reservationsService.getByMember(memberId),
    enabled: !!user?.memberId,
  });

  const cancelMutation = useMutation({
    mutationFn: reservationsService.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberReservations(memberId) }),
  });

  if (!user?.memberId) return <p className="text-text-secondary">Not available.</p>;
  if (isLoading) return <p className="text-text-secondary">Loading…</p>;

  const reservations = (data?.data as { data?: { id: number; book: { title: string; author: string }; status: string; reservedAt: string; expiresAt: string }[] })?.data ?? [];

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold text-text-primary">My Reservations</h1>
      {reservations.length === 0 && <p className="text-text-secondary">No reservations yet.</p>}
      {reservations.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4 flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-medium">{r.book.title}</p>
              <p className="text-sm text-text-secondary">{r.book.author}</p>
              <p className="text-xs text-text-secondary">Reserved {formatDate(r.reservedAt)} · Expires {formatDate(r.expiresAt)}</p>
              <Badge variant={r.status === 'PENDING' ? 'default' : 'secondary'}>{r.status}</Badge>
            </div>
            {r.status === 'PENDING' && (
              <Button variant="ghost" size="sm" className="text-danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(r.id)}>Cancel</Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
