import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '@/services/reports.service';
import { QUERY_KEYS } from '@/lib/constants';
import StatsCard from '@/components/StatsCard';
import { useAuthStore } from '@/store/auth.store';
import { BookOpen, Users, ArrowLeftRight, AlertCircle } from 'lucide-react';

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
  const s = summary?.data;

  const firstName = user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="space-y-8">
      {/* Greeting header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-text-secondary text-sm mt-1">{formatToday()}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Borrows" value={s?.activeBorrows ?? '—'} icon={ArrowLeftRight} variant="default" />
        <StatsCard title="Overdue" value={s?.overdueCount ?? '—'} icon={AlertCircle} variant="danger" />
        <StatsCard title="Total Books" value={s?.totalBooks ?? '—'} icon={BookOpen} variant="success" />
        <StatsCard title="Members" value={s?.totalMembers ?? '—'} icon={Users} variant="default" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map(({ label, description, icon: Icon, to }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex items-center gap-4 p-5 rounded-xl border border-border bg-surface text-left transition-all duration-150 hover:border-accent/50 hover:bg-accent/5 hover:shadow-sm group"
            >
              <div className="p-3 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-accent shrink-0 group-hover:from-accent/30 group-hover:to-accent/10 transition-all">
                <Icon size={22} />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">{label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
