import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from '@/components/StatsCard';
import ReportChart from '@/components/ReportChart';
import ExportButton from '@/components/ExportButton';
import { useAuthStore } from '@/store/auth.store';
import { BookOpen, ArrowLeftRight, AlertCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const { user } = useAuthStore();

  const { data: borrowing } = useQuery({ queryKey: QUERY_KEYS.reports.borrowing, queryFn: () => reportsService.getBorrowing() });
  const { data: inventory } = useQuery({ queryKey: QUERY_KEYS.reports.inventory, queryFn: () => reportsService.getInventory() });
  const { data: fineStats } = useQuery({ queryKey: QUERY_KEYS.reports.fines, queryFn: () => reportsService.getFines() });
  const { data: popular } = useQuery({ queryKey: QUERY_KEYS.reports.popularBooks, queryFn: () => reportsService.getPopularBooks(), enabled: user?.role === 'admin' });

  const b = borrowing?.data as { active: number; returned: number; overdue: number } | undefined;
  const f = fineStats?.data as { total: string; paid: string; unpaid: string } | undefined;
  const cats = (inventory?.data as { categories?: { name: string; count: number }[] } | undefined)?.categories ?? [];
  const popularBooks = (popular?.data as { id: number; title: string; borrowCount: number }[] | undefined) ?? [];

  const categoryChartData = cats.map((c) => ({ name: c.name, value: c.count }));
  const borrowingChartData = b ? [
    { name: 'Active', value: b.active },
    { name: 'Returned', value: b.returned },
    { name: 'Overdue', value: b.overdue },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
        <ExportButton report="borrowing" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Borrows" value={b?.active ?? '—'} icon={ArrowLeftRight} />
        <StatsCard title="Overdue" value={b?.overdue ?? '—'} icon={AlertCircle} variant="danger" />
        <StatsCard title="Total Fines" value={f?.total ? formatCurrency(Number(f.total)) : '—'} icon={DollarSign} variant="warning" />
        <StatsCard title="Unpaid Fines" value={f?.unpaid ? formatCurrency(Number(f.unpaid)) : '—'} icon={DollarSign} variant="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Borrow Status</CardTitle>
            <ExportButton report="borrowing" />
          </CardHeader>
          <CardContent>
            <ReportChart type="pie" data={borrowingChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Books by Category</CardTitle>
            <ExportButton report="inventory" />
          </CardHeader>
          <CardContent>
            <ReportChart type="bar" data={categoryChartData} />
          </CardContent>
        </Card>
      </div>

      {user?.role === 'admin' && popularBooks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Most Borrowed Books</CardTitle></CardHeader>
          <CardContent>
            <ReportChart type="bar" data={popularBooks.map((p) => ({ name: p.title, value: p.borrowCount }))} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
