import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { transactionsService } from '@/services/transactions.service';
import { finesService } from '@/services/fines.service';
import { reservationsService } from '@/services/reservations.service';
import { QUERY_KEYS } from '@/lib/constants';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, CalendarCheck, AlertCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function PortalDashboardPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId!;

  const { data: txData } = useQuery({ queryKey: QUERY_KEYS.memberTransactions(memberId), queryFn: () => transactionsService.getByMember(memberId, { status: 'ACTIVE', limit: 5 }) });
  const { data: finesData } = useQuery({ queryKey: QUERY_KEYS.memberFines(memberId), queryFn: () => finesService.getByMember(memberId, { isPaid: 'false' }) });
  const { data: resData } = useQuery({ queryKey: QUERY_KEYS.memberReservations(memberId), queryFn: () => reservationsService.getByMember(memberId, { status: 'PENDING' }) });

  const activeTx = (txData?.data as { data?: { id: number; items: { book: { title: string } }[]; dueDate: string; status: string }[] })?.data ?? [];
  const unpaidFines = (finesData?.data as { data?: { id: number; amount: number; reason: string }[] })?.data ?? [];
  const pendingRes = (resData?.data as { data?: { id: number; book: { title: string }; expiresAt: string }[] })?.data ?? [];
  const totalFines = unpaidFines.reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">My Library</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Active Borrows" value={activeTx.length} icon={ArrowLeftRight} />
        <StatsCard title="Pending Reservations" value={pendingRes.length} icon={CalendarCheck} />
        <StatsCard title="Outstanding Fines" value={formatCurrency(totalFines)} icon={AlertCircle} variant={totalFines > 0 ? 'danger' : 'default'} />
      </div>

      {activeTx.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Currently Borrowed</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {activeTx.map((t) => (
              <div key={t.id} className="py-2 flex justify-between text-sm">
                <span>{t.items.map((i) => i.book.title).join(', ')}</span>
                <span className={new Date(t.dueDate) < new Date() ? 'text-danger' : 'text-text-secondary'}>
                  Due {formatDate(t.dueDate)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
