import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '@/services/reports.service';
import { transactionsService } from '@/services/transactions.service';
import { QUERY_KEYS } from '@/lib/constants';
import StatsCard from '@/components/StatsCard';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, ArrowLeftRight, AlertCircle, DollarSign, CalendarCheck, Boxes, Star } from 'lucide-react';
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
  const { data: inventoryData } = useQuery({
    queryKey: QUERY_KEYS.reports.inventory,
    queryFn: () => reportsService.getInventory(),
  });
  const { data: popularData } = useQuery({
    queryKey: QUERY_KEYS.reports.popularBooks,
    queryFn: () => reportsService.getPopularBooks(),
  });

  const s = (summary?.data as { data?: Record<string, unknown> })?.data ?? (summary?.data as Record<string, unknown>);
  const overdueTx = (overdueData?.data as { data?: { id: number; memberName: string; dueDate: string; items: { book: { title: string } }[] }[] })?.data ?? [];
  const categories = (inventoryData?.data as { data?: { categories?: { name: string; count: number }[] } })?.data?.categories ?? [];
  const popularBooks = (popularData?.data as { data?: { id: number; title: string; author: string; borrowCount: number }[] })?.data ?? [];

  const displayName = user?.email?.split('@')[0] ?? 'there';
  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Librarian';
  const availableCopies = s?.availableCopies ?? s?.availableBooks ?? '—';
  const borrowedBooks = s?.borrowedBooks ?? s?.activeBorrows ?? '—';
  const reservedBooks = s?.reservedBooks ?? s?.pendingReservations ?? '—';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
        <StatsCard title="Titles" value={s?.totalBooks ?? '—'} icon={BookOpen} variant="success" />
        <StatsCard title="Available Copies" value={availableCopies} icon={Boxes} variant="success" />
        <StatsCard title="Given Out" value={borrowedBooks} icon={ArrowLeftRight} variant="default" />
        <StatsCard title="Reserved" value={reservedBooks} icon={CalendarCheck} variant="default" />
        <StatsCard title="Overdue" value={s?.overdueCount ?? '—'} icon={AlertCircle} variant="danger" />
        <StatsCard title="Members" value={s?.totalMembers ?? '—'} icon={Users} variant="default" />
        <StatsCard title="Unpaid Fines" value={s?.unpaidFinesTotal != null ? formatCurrency(Number(s.unpaidFinesTotal)) : '—'} icon={DollarSign} variant="danger" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr_1fr] gap-6">
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

        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Collection Health</h2>
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <Boxes size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Inventory mix</p>
                  <p className="text-xs text-text-secondary">Top categories by catalog size.</p>
                </div>
              </div>
              <div className="space-y-3">
                {categories.slice(0, 5).map((category) => (
                  <div key={category.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-text-primary">{category.name}</span>
                      <span className="text-text-secondary">{category.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-border">
                      <div
                        className="h-2 rounded-full bg-accent"
                        style={{ width: `${Math.min(100, (category.count / Math.max(1, Number(s?.totalBooks ?? 1))) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {categories.length === 0 && <p className="text-sm text-text-secondary">No category data yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star size={16} className="text-accent" /> Popular Titles
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {popularBooks.slice(0, 4).map((book) => (
            <div key={book.id} className="rounded-md border border-border bg-surface-hover/40 p-3">
              <p className="line-clamp-2 text-sm font-semibold text-text-primary">{book.title}</p>
              <p className="mt-1 text-xs text-text-secondary">{book.author}</p>
              <Badge variant="secondary" className="mt-3 text-xs">{book.borrowCount} borrows</Badge>
            </div>
          ))}
          {popularBooks.length === 0 && <p className="text-sm text-text-secondary">No borrowing activity yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
