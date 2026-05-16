import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '@/services/reports.service';
import { transactionsService } from '@/services/transactions.service';
import { QUERY_KEYS } from '@/lib/constants';
import StatsCard from '@/components/StatsCard';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, ArrowLeftRight, AlertCircle, DollarSign, CalendarCheck } from 'lucide-react';
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

const quickActions = [
  { label: 'Borrow a Book', description: 'Record a new borrow transaction', icon: ArrowLeftRight, to: '/transactions/borrow' },
  { label: 'Add Member', description: 'Register a new library member', icon: Users, to: '/members/new' },
  { label: 'View Overdue', description: 'See all overdue transactions', icon: AlertCircle, to: '/transactions' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: summary } = useQuery({ queryKey: QUERY_KEYS.reports.summary, queryFn: () => reportsService.getSummary() });
  const { data: overdueData } = useQuery({
    queryKey: [...QUERY_KEYS.transactions, 'overdue-recent'],
    queryFn: () => transactionsService.getAll({ status: 'OVERDUE', limit: 5 }),
  });

  const s = (summary?.data as { data?: Record<string, unknown> })?.data ?? (summary?.data as Record<string, unknown>);
  const overdueTx = (overdueData?.data as { data?: { id: number; memberName: string; dueDate: string; items: { book: { title: string } }[] }[] })?.data ?? [];

  const displayName = user?.email?.split('@')[0] ?? 'there';
  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Librarian';

  return (
    <div className="space-y-8">
      {/* Greeting header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
          {getGreeting()}, {displayName}!
        </h1>
        <p className="text-text-secondary text-sm mt-1">{formatToday()} · {roleLabel}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard title="Active Borrows" value={s?.activeBorrows ?? '—'} icon={ArrowLeftRight} variant="default" />
        <StatsCard title="Overdue" value={s?.overdueCount ?? '—'} icon={AlertCircle} variant="danger" />
        <StatsCard title="Total Books" value={s?.totalBooks ?? '—'} icon={BookOpen} variant="success" />
        <StatsCard title="Members" value={s?.totalMembers ?? '—'} icon={Users} variant="default" />
        <StatsCard title="Reservations" value={s?.pendingReservations ?? '—'} icon={CalendarCheck} variant="default" />
        <StatsCard title="Unpaid Fines" value={s?.unpaidFinesTotal != null ? formatCurrency(Number(s.unpaidFinesTotal)) : '—'} icon={DollarSign} variant="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map(({ label, description, icon: Icon, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-surface text-left transition-all duration-150 hover:border-accent/50 hover:bg-accent/5 hover:shadow-sm group"
              >
                <div className="p-2.5 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-accent shrink-0 group-hover:from-accent/30 group-hover:to-accent/10 transition-all">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">{label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Overdue */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Recent Overdue</h2>
          <Card>
            <CardContent className="p-0">
              {overdueTx.length === 0 ? (
                <p className="text-text-secondary text-sm p-4">No overdue transactions.</p>
              ) : (
                <div className="divide-y divide-border">
                  {overdueTx.map((t) => (
                    <div key={t.id} className="px-4 py-3 flex justify-between items-start gap-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{t.memberName}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{t.items?.map((i) => i.book?.title).join(', ')}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        <p className="text-xs text-text-secondary mt-1">Due {formatDate(t.dueDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
