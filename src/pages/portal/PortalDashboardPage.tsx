import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { transactionsService } from '@/services/transactions.service';
import { finesService } from '@/services/fines.service';
import { reservationsService } from '@/services/reservations.service';
import { membersService } from '@/services/members.service';
import { QUERY_KEYS } from '@/lib/constants';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, CalendarCheck, AlertCircle, BookOpen } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PortalDashboardPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;

  const { data: memberData } = useQuery({
    queryKey: QUERY_KEYS.member(memberId),
    queryFn: () => membersService.getById(memberId),
    enabled: !!user?.memberId,
  });
  const { data: txData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.memberTransactions(memberId),
    queryFn: () => transactionsService.getByMember(memberId, { status: 'ACTIVE', limit: 5 }),
    enabled: !!user?.memberId,
  });
  const { data: finesData } = useQuery({
    queryKey: QUERY_KEYS.memberFines(memberId),
    queryFn: () => finesService.getByMember(memberId, { isPaid: 'false' }),
    enabled: !!user?.memberId,
  });
  const { data: resData } = useQuery({
    queryKey: QUERY_KEYS.memberReservations(memberId),
    queryFn: () => reservationsService.getByMember(memberId, { status: 'PENDING' }),
    enabled: !!user?.memberId,
  });

  if (!user?.memberId) return <p className="text-text-secondary">Not available.</p>;
  if (isLoading) return <p className="text-text-secondary">Loading…</p>;

  const member = (memberData?.data as { data?: { fullName?: string } })?.data;
  const activeTx = (txData?.data as { data?: { id: number; items: { book: { title: string } }[]; dueDate: string; status: string }[] })?.data ?? [];
  const unpaidFines = (finesData?.data as { data?: { id: number; amount: number; reason: string }[] })?.data ?? [];
  const pendingRes = (resData?.data as { data?: { id: number; bookTitle: string; expiresAt: string }[] })?.data ?? [];
  const totalFines = unpaidFines.reduce((s, f) => s + Number(f.amount), 0);

  const displayName = member?.fullName ?? user?.email?.split('@')[0] ?? 'there';
  const overdueItems = activeTx.filter((t) => new Date(t.dueDate) < new Date());

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
          {getGreeting()}, {displayName}!
        </h1>
        <p className="text-text-secondary text-sm mt-1">{formatToday()}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Active Borrows" value={activeTx.length} icon={ArrowLeftRight} />
        <StatsCard title="Pending Reservations" value={pendingRes.length} icon={CalendarCheck} />
        <StatsCard title="Outstanding Fines" value={formatCurrency(totalFines)} icon={AlertCircle} variant={totalFines > 0 ? 'danger' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currently Borrowed */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen size={16} /> Currently Borrowed</CardTitle></CardHeader>
          <CardContent>
            {activeTx.length === 0 ? (
              <p className="text-text-secondary text-sm py-2">No books currently borrowed.</p>
            ) : (
              <div className="divide-y divide-border">
                {activeTx.map((t) => {
                  const isOverdue = new Date(t.dueDate) < new Date();
                  return (
                    <div key={t.id} className="py-2.5 flex justify-between items-start gap-4 text-sm">
                      <span className="text-text-primary">{t.items.map((i) => i.book.title).join(', ')}</span>
                      <div className="text-right shrink-0">
                        <span className={isOverdue ? 'text-danger font-medium' : 'text-text-secondary'}>
                          {isOverdue ? 'Overdue' : 'Due'} {formatDate(t.dueDate)}
                        </span>
                        {isOverdue && <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reservations */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarCheck size={16} /> Pending Reservations</CardTitle></CardHeader>
          <CardContent>
            {pendingRes.length === 0 ? (
              <p className="text-text-secondary text-sm py-2">No pending reservations.</p>
            ) : (
              <div className="divide-y divide-border">
                {pendingRes.map((r) => (
                  <div key={r.id} className="py-2.5 flex justify-between items-center text-sm">
                    <span className="text-text-primary">{r.bookTitle}</span>
                    <span className="text-text-secondary text-xs shrink-0">Expires {formatDate(r.expiresAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue alert */}
      {overdueItems.length > 0 && (
        <Card className="border-danger/40 bg-danger/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-danger shrink-0" />
            <p className="text-sm text-danger font-medium">
              You have {overdueItems.length} overdue book{overdueItems.length > 1 ? 's' : ''}. Please return them to avoid additional fines.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
