import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { finesService } from '@/services/fines.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function PortalFinesPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.memberFines(memberId),
    queryFn: () => finesService.getByMember(memberId),
    enabled: !!user?.memberId,
  });

  if (!user?.memberId) return <p className="text-text-secondary">Not available.</p>;

  const fines = (data?.data as { data?: { id: number; amount: number; reason: string; isPaid: boolean; isWaived: boolean; createdAt: string }[] })?.data ?? [];

  if (isLoading) return <p className="text-text-secondary">Loading…</p>;

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold text-text-primary">My Fines</h1>
      {fines.length === 0 && <p className="text-text-secondary">No fines on your account.</p>}
      {fines.map((f) => (
        <Card key={f.id} className={!f.isPaid && !f.isWaived ? 'border-danger/40' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className={`font-medium ${!f.isPaid && !f.isWaived ? 'text-danger' : 'text-text-primary'}`}>{formatCurrency(Number(f.amount))}</p>
              <p className="text-sm text-text-secondary">{f.reason}</p>
              <p className="text-xs text-text-secondary">{formatDate(f.createdAt)}</p>
            </div>
            <Badge variant={f.isPaid ? 'secondary' : f.isWaived ? 'secondary' : 'destructive'}>
              {f.isPaid ? 'Paid' : f.isWaived ? 'Waived' : 'Unpaid'}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
