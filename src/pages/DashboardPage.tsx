import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import { QUERY_KEYS } from '@/lib/constants';
import StatsCard from '@/components/StatsCard';
import { BookOpen, Users, ArrowLeftRight, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { data: borrowing } = useQuery({ queryKey: QUERY_KEYS.reports.borrowing, queryFn: () => reportsService.getBorrowing() });
  const { data: inventory } = useQuery({ queryKey: QUERY_KEYS.reports.inventory, queryFn: () => reportsService.getInventory() });
  const { data: members } = useQuery({ queryKey: QUERY_KEYS.reports.members, queryFn: () => reportsService.getMembers() });

  const b = (borrowing?.data as { data?: { active: number; overdue: number } })?.data;
  const inv = (inventory?.data as { data?: { total?: { _sum?: { totalCopies?: number } } } })?.data;
  const mem = (members?.data as { data?: { total?: number } })?.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Borrows" value={b?.active ?? '—'} icon={ArrowLeftRight} variant="default" />
        <StatsCard title="Overdue" value={b?.overdue ?? '—'} icon={AlertCircle} variant="danger" />
        <StatsCard title="Total Books" value={inv?.total?._sum?.totalCopies ?? '—'} icon={BookOpen} variant="success" />
        <StatsCard title="Members" value={mem?.total ?? '—'} icon={Users} variant="default" />
      </div>
    </div>
  );
}
