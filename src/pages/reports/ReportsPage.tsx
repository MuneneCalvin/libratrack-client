import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatsCard from '@/components/StatsCard';
import ReportChart from '@/components/ReportChart';
import ExportButton from '@/components/ExportButton';
import { useAuthStore } from '@/store/auth.store';
import {
  AlertCircle,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  LibraryBig,
  ReceiptText,
  Users,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const { user } = useAuthStore();

  const { data: summary } = useQuery({ queryKey: QUERY_KEYS.reports.summary, queryFn: () => reportsService.getSummary() });
  const { data: borrowing } = useQuery({ queryKey: QUERY_KEYS.reports.borrowing, queryFn: () => reportsService.getBorrowing() });
  const { data: inventory } = useQuery({ queryKey: QUERY_KEYS.reports.inventory, queryFn: () => reportsService.getInventory() });
  const { data: fineStats } = useQuery({ queryKey: QUERY_KEYS.reports.fines, queryFn: () => reportsService.getFines() });
  const { data: members } = useQuery({ queryKey: QUERY_KEYS.reports.members, queryFn: () => reportsService.getMembers() });
  const { data: popular } = useQuery({ queryKey: QUERY_KEYS.reports.popularBooks, queryFn: () => reportsService.getPopularBooks(), enabled: user?.role === 'admin' });

  const b = unwrapData<{ active: number; returned: number; overdue: number }>(borrowing?.data);
  const f = unwrapData<{ total: string; paid: string; unpaid: string }>(fineStats?.data);
  const s = unwrapData<{
    totalBooks?: number; totalCopies?: number; availableCopies?: number; borrowedBooks?: number;
    totalMembers?: number; activeBorrows?: number; pendingReservations?: number; unpaidFinesTotal?: number;
  }>(summary?.data);
  const m = unwrapData<{ totalMembers?: number; activeMembers?: number; inactiveMembers?: number }>(members?.data);
  const cats = unwrapData<{ categories?: { name: string; count: number }[] }>(inventory?.data)?.categories ?? [];
  const popularBooks = unwrapData<{ id: number; title: string; author?: string; borrowCount: number }[]>(popular?.data) ?? [];

  const categoryChartData = cats.map((c) => ({ name: c.name, value: c.count }));
  const borrowingChartData = b ? [
    { name: 'Active', value: b.active },
    { name: 'Returned', value: b.returned },
    { name: 'Overdue', value: b.overdue },
  ] : [];
  const fineTotal = Number(f?.total ?? 0);
  const finePaid = Number(f?.paid ?? 0);
  const fineUnpaid = Number(f?.unpaid ?? 0);
  const finePaidPercent = fineTotal > 0 ? Math.round((finePaid / fineTotal) * 100) : 0;
  const totalCopies = s?.totalCopies ?? 0;
  const availableCopies = s?.availableCopies ?? 0;
  const circulationPercent = totalCopies > 0 ? Math.round(((s?.borrowedBooks ?? 0) / totalCopies) * 100) : 0;
  const topCategories = cats.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <BarChart3 size={13} /> Management reports
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              Monitor catalog health, lending movement, fine collection, and member activity from one operating view.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
            <ExportButton report="borrowing" label="Borrowing CSV" />
            <ExportButton report="inventory" label="Inventory CSV" />
            <ExportButton report="fines" label="Fines CSV" />
            <ExportButton report="members" label="Members CSV" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Books" value={s?.totalBooks ?? '—'} icon={LibraryBig} subtitle={`${availableCopies.toLocaleString()} copies available`} />
        <StatsCard title="Active Borrows" value={s?.activeBorrows ?? b?.active ?? '—'} icon={ArrowLeftRight} subtitle={`${circulationPercent}% of copies in circulation`} />
        <StatsCard title="Members" value={s?.totalMembers ?? m?.totalMembers ?? '—'} icon={Users} subtitle={`${m?.activeMembers ?? 0} active accounts`} />
        <StatsCard title="Unpaid Fines" value={formatCurrency(fineUnpaid)} icon={DollarSign} variant={fineUnpaid > 0 ? 'danger' : 'success'} subtitle={`${finePaidPercent}% collected`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        <Card className="py-0">
          <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList size={17} className="text-accent" /> Borrowing Status
            </CardTitle>
            <p className="text-xs text-text-secondary">Current lending movement across active, returned, and overdue transactions.</p>
          </CardHeader>
          <CardContent className="p-4">
            <ReportChart type="bar" height={220} data={borrowingChartData} />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ReportMetric label="Active" value={b?.active ?? 0} icon={ArrowLeftRight} />
              <ReportMetric label="Returned" value={b?.returned ?? 0} icon={CheckCircle2} tone="success" />
              <ReportMetric label="Overdue" value={b?.overdue ?? 0} icon={AlertCircle} tone="danger" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText size={17} className="text-accent" /> Fine Collection
            </CardTitle>
            <p className="text-xs text-text-secondary">Collection progress and outstanding balance.</p>
          </CardHeader>
          <CardContent className="space-y-5 p-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase text-text-secondary">Collected</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{formatCurrency(finePaid)}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-hover">
                <div className="h-full rounded-full bg-accent" style={{ width: `${finePaidPercent}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-text-secondary">
                <span>{finePaidPercent}% paid</span>
                <span>{formatCurrency(fineTotal)} total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ReportMetric label="Paid" value={formatCurrency(finePaid)} icon={CheckCircle2} tone="success" />
              <ReportMetric label="Unpaid" value={formatCurrency(fineUnpaid)} icon={AlertCircle} tone={fineUnpaid > 0 ? 'danger' : 'success'} />
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase text-text-secondary">Pending reservations</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{s?.pendingReservations ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="py-0">
          <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen size={17} className="text-accent" /> Books by Category
            </CardTitle>
            <p className="text-xs text-text-secondary">Inventory distribution across the collection.</p>
          </CardHeader>
          <CardContent className="p-4">
            <ReportChart type="bar" data={categoryChartData} />
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
            <CardTitle className="text-base">Top Categories</CardTitle>
            <p className="text-xs text-text-secondary">Largest catalog groups by title count.</p>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {topCategories.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-background p-6 text-center text-sm text-text-secondary">No category data yet.</p>
            ) : (
              topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">{category.name}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.max(8, Math.round((category.count / Math.max(1, topCategories[0]?.count ?? 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="secondary">{category.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {user?.role === 'admin' && (
        <Card className="py-0">
          <CardHeader className="flex flex-col gap-3 border-b border-border bg-surface-hover/40 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Most Borrowed Books</CardTitle>
              <p className="mt-1 text-xs text-text-secondary">Titles with the highest borrow count.</p>
            </div>
            <ExportButton report="popular-books" label="Popular CSV" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
            <ReportChart type="bar" height={320} data={popularBooks.slice(0, 8).map((p) => ({ name: p.title, value: p.borrowCount }))} />
            <div className="space-y-3">
              {popularBooks.slice(0, 8).map((book, index) => (
                <div key={book.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">{book.title}</p>
                    <p className="truncate text-xs text-text-secondary">{book.author || 'Unknown author'}</p>
                  </div>
                  <Badge variant="secondary">{book.borrowCount} borrows</Badge>
                </div>
              ))}
              {popularBooks.length === 0 && (
                <p className="rounded-lg border border-dashed border-border bg-background p-6 text-center text-sm text-text-secondary">No borrowing history yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportMetric({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: 'default' | 'success' | 'danger';
}) {
  const toneClass = tone === 'success' ? 'text-success bg-success/10' : tone === 'danger' ? 'text-danger bg-danger/10' : 'text-accent bg-accent/10';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
      <div className={`grid size-9 shrink-0 place-items-center rounded-full ${toneClass}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="truncate font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function unwrapData<T>(payload: unknown): T | undefined {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data;
  }
  return payload as T | undefined;
}
