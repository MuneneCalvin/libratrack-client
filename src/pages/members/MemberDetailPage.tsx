import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '@/services/members.service';
import { transactionsService } from '@/services/transactions.service';
import { finesService } from '@/services/fines.service';
import { reservationsService } from '@/services/reservations.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AlertCircle, ArrowLeftRight, CalendarCheck, Mail, MapPin, Phone, Trash2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageBackButton from '@/components/PageBackButton';

type DetailAction = 'delete' | 'revoke' | 'restore';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const memberId = Number(id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pendingAction, setPendingAction] = useState<DetailAction | null>(null);

  const { data: memberData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.member(memberId),
    queryFn: () => membersService.getById(memberId),
  });
  const { data: txData } = useQuery({
    queryKey: QUERY_KEYS.memberTransactions(memberId),
    queryFn: () => transactionsService.getByMember(memberId),
  });
  const { data: finesData } = useQuery({
    queryKey: QUERY_KEYS.memberFines(memberId),
    queryFn: () => finesService.getByMember(memberId),
  });
  const { data: reservationsData } = useQuery({
    queryKey: QUERY_KEYS.memberReservations(memberId),
    queryFn: () => reservationsService.getByMember(memberId),
  });

  const toggleActive = useMutation({
    mutationFn: () => membersService.update(memberId, { isActive: !member?.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.member(memberId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members });
      setPendingAction(null);
      toast.success(member?.isActive ? 'Member access revoked' : 'Member access restored', {
        description: member?.fullName,
      });
    },
    onError: () => {
      toast.error('Failed to update member access');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => membersService.remove(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members });
      setPendingAction(null);
      toast.success('Member deleted', { description: member?.fullName });
      navigate('/members');
    },
    onError: () => {
      toast.error('Failed to delete member');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const member = memberData?.data?.data;
  if (!member) return <p className="text-danger">Member not found.</p>;

  const transactions = (txData?.data as { data?: MemberTransaction[] })?.data ?? [];
  const fines = (finesData?.data as { data?: MemberFine[] })?.data ?? [];
  const reservations = (reservationsData?.data as { data?: MemberReservation[] })?.data ?? [];
  const outstandingFines = (fines as { isPaid: boolean; isWaived: boolean; amount: number }[])
    .filter((f) => !f.isPaid && !f.isWaived)
    .reduce((sum, f) => sum + Number(f.amount), 0);
  const activeBorrows = transactions.filter((t) => t.status === 'ACTIVE');
  const overdueBorrows = transactions.filter((t) => t.status === 'OVERDUE' || new Date(t.dueDate) < new Date());
  const pendingReservations = reservations.filter((r) => r.status === 'PENDING');
  const isAdmin = user?.role === 'admin';
  const isLibrarian = user?.role === 'librarian';
  const confirmCopy = getDetailConfirmCopy(pendingAction, member.fullName);

  return (
    <div className="w-full space-y-6">
      <ConfirmDialog
        open={!!pendingAction}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        tone={confirmCopy.tone}
        isPending={toggleActive.isPending || deleteMutation.isPending}
        onOpenChange={(open) => !open && setPendingAction(null)}
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction === 'delete') deleteMutation.mutate();
          else toggleActive.mutate();
        }}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PageBackButton label="Back to members" onClick={() => navigate('/members')} />
          <h1 className="text-2xl font-bold text-text-primary">{member.fullName}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{member.membershipNumber}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {isLibrarian && (
            <Button
              variant={member.isActive ? 'outline' : 'default'}
              size="sm"
              onClick={() => setPendingAction(member.isActive ? 'revoke' : 'restore')}
              disabled={toggleActive.isPending}
              className="w-full gap-2 sm:w-auto"
            >
              {member.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
              {member.isActive ? 'Revoke access' : 'Restore access'}
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPendingAction('delete')}
              disabled={deleteMutation.isPending}
              className="w-full gap-2 sm:w-auto"
            >
              <Trash2 size={14} />
              Delete member
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon={ArrowLeftRight} label="Total borrows" value={transactions.length} />
        <MetricCard icon={CalendarCheck} label="Pending reservations" value={pendingReservations.length} />
        <MetricCard icon={AlertCircle} label="Overdue" value={overdueBorrows.length} tone={overdueBorrows.length > 0 ? 'danger' : 'default'} />
        <MetricCard icon={AlertCircle} label="Outstanding fines" value={formatCurrency(outstandingFines)} tone={outstandingFines > 0 ? 'danger' : 'default'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6">
        {/* Member info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Profile
              <Badge variant={member.isActive ? 'default' : 'secondary'}>
                {member.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 text-sm">
            <ProfileRow icon={Mail} label="Email" value={member.email} />
            <ProfileRow icon={Phone} label="Phone" value={member.phone ?? '—'} />
            <ProfileRow icon={MapPin} label="Address" value={member.address ?? '—'} />
            <ProfileRow icon={CalendarCheck} label="Joined" value={formatDate(member.joinedAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Borrowed Books</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeBorrows.length === 0 ? (
              <p className="text-sm text-text-secondary">No active borrowed books.</p>
            ) : activeBorrows.slice(0, 6).map((transaction) => (
              <ActivityRow
                key={transaction.id}
                title={transaction.items.map((item) => item.book.title).join(', ')}
                meta={`Due ${formatDate(transaction.dueDate)}`}
                badge={new Date(transaction.dueDate) < new Date() ? 'Overdue' : 'Active'}
                danger={new Date(transaction.dueDate) < new Date()}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservation History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reservations.length === 0 ? (
              <p className="text-sm text-text-secondary">No reservations yet.</p>
            ) : reservations.slice(0, 8).map((reservation) => (
              <ActivityRow
                key={reservation.id}
                title={reservation.bookTitle}
                meta={`Reserved ${formatDate(reservation.reservedAt)} · Expires ${formatDate(reservation.expiresAt)}`}
                badge={reservation.status}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fine History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fines.length === 0 ? (
              <p className="text-sm text-text-secondary">No fines recorded.</p>
            ) : fines.slice(0, 8).map((fine) => (
              <ActivityRow
                key={fine.id}
                title={fine.reason}
                meta={formatCurrency(Number(fine.amount))}
                badge={fine.isPaid ? 'Paid' : fine.isWaived ? 'Waived' : 'Unpaid'}
                danger={!fine.isPaid && !fine.isWaived}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getDetailConfirmCopy(action: DetailAction | null, memberName: string): {
  title: string;
  description: string;
  confirmLabel: string;
  tone: 'danger' | 'warning' | 'success';
} {
  if (action === 'delete') {
    return {
      title: 'Delete member account?',
      description: `${memberName} and their member activity will be permanently removed from the system. This action cannot be undone.`,
      confirmLabel: 'Delete member',
      tone: 'danger',
    };
  }
  if (action === 'restore') {
    return {
      title: 'Restore member access?',
      description: `${memberName} will be able to sign in, browse books, and reserve available titles again.`,
      confirmLabel: 'Restore access',
      tone: 'success',
    };
  }
  if (action === 'revoke') {
    return {
      title: 'Revoke member access?',
      description: `${memberName} will no longer be able to sign in or reserve books until access is restored.`,
      confirmLabel: 'Revoke access',
      tone: 'warning',
    };
  }
  return { title: '', description: '', confirmLabel: '', tone: 'warning' };
}

function MetricCard({ icon: Icon, label, value, tone = 'default' }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: React.ReactNode; tone?: 'default' | 'danger' }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2 ${tone === 'danger' ? 'bg-danger/10' : 'bg-accent/10'}`}>
          <Icon size={18} className={tone === 'danger' ? 'text-danger' : 'text-accent'} />
        </div>
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <p className={`text-xl font-bold ${tone === 'danger' ? 'text-danger' : 'text-text-primary'}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <span className="flex shrink-0 items-center gap-2 text-text-secondary font-medium"><Icon size={14} /> {label}</span>
      <span className="min-w-0 break-words text-right text-text-primary">{value}</span>
    </div>
  );
}

function ActivityRow({ title, meta, badge, danger = false }: { title: string; meta: string; badge: string; danger?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-surface-hover/40 p-3">
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-medium text-text-primary">{title}</p>
        <p className="mt-1 text-xs text-text-secondary">{meta}</p>
      </div>
      <Badge variant={danger ? 'destructive' : 'secondary'} className="shrink-0 text-xs">{badge}</Badge>
    </div>
  );
}

interface MemberTransaction {
  id: number;
  dueDate: string;
  status: string;
  items: { book: { title: string } }[];
}

interface MemberFine {
  id: number;
  amount: number;
  reason: string;
  isPaid: boolean;
  isWaived: boolean;
}

interface MemberReservation {
  id: number;
  bookTitle: string;
  status: string;
  reservedAt: string;
  expiresAt: string;
}
