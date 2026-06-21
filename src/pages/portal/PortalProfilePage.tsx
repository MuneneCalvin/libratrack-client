import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { membersService } from '@/services/members.service';
import { reservationsService } from '@/services/reservations.service';
import { finesService } from '@/services/fines.service';
import { transactionsService } from '@/services/transactions.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MemberAvatar } from '@/components/CatalogVisuals';
import AccountPasswordForm from '@/components/AccountPasswordForm';
import {
  AlertTriangle,
  ArrowLeftRight,
  BookMarked,
  Calendar,
  CheckCircle2,
  Hash,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  KeyRound,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface MemberProfile {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  membershipNumber: string;
  joinedAt: string;
  isActive: boolean;
}

export default function PortalProfilePage() {
  const { user, patchUser } = useAuthStore();
  const memberId = user?.memberId ?? 0;
  const queryClient = useQueryClient();
  const [formPatch, setFormPatch] = useState<Partial<Pick<MemberProfile, 'fullName' | 'email' | 'phone' | 'address'>>>({});

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.member(memberId),
    queryFn: () => membersService.getById(memberId),
    enabled: !!user?.memberId,
  });
  const { data: reservationsData } = useQuery({
    queryKey: QUERY_KEYS.memberReservations(memberId),
    queryFn: () => reservationsService.getByMember(memberId),
    enabled: !!user?.memberId,
  });
  const { data: finesData } = useQuery({
    queryKey: QUERY_KEYS.memberFines(memberId),
    queryFn: () => finesService.getByMember(memberId),
    enabled: !!user?.memberId,
  });
  const { data: transactionsData } = useQuery({
    queryKey: QUERY_KEYS.memberTransactions(memberId),
    queryFn: () => transactionsService.getByMember(memberId),
    enabled: !!user?.memberId,
  });

  const member = unwrapData<MemberProfile>(data?.data);
  const form = {
    fullName: formPatch.fullName ?? member?.fullName ?? '',
    email: formPatch.email ?? member?.email ?? '',
    phone: formPatch.phone ?? member?.phone ?? '',
    address: formPatch.address ?? member?.address ?? '',
  };

  const updateMutation = useMutation({
    mutationFn: () => membersService.update(memberId, form),
    onSuccess: (response) => {
      const updated = unwrapData<MemberProfile>(response.data);
      setFormPatch({});
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.member(memberId) });
      if (updated?.email) patchUser({ email: updated.email });
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });
  const reservations = unwrapData<{ status: string }[]>(reservationsData?.data) ?? [];
  const fines = unwrapData<{ amount: number; isPaid: boolean; isWaived: boolean }[]>(finesData?.data) ?? [];
  const transactions = unwrapData<{ status: string; items?: unknown[] }[]>(transactionsData?.data) ?? [];
  const displayName = member?.fullName ?? user?.email?.split('@')[0] ?? 'Member';
  const activeReservations = reservations.filter((reservation) => reservation.status === 'PENDING').length;
  const activeBorrows = transactions.filter((transaction) => transaction.status === 'ACTIVE' || transaction.status === 'OVERDUE').length;
  const booksBorrowed = transactions.reduce((sum, transaction) => sum + (transaction.items?.length ?? 0), 0);
  const outstandingFineTotal = fines
    .filter((fine) => !fine.isPaid && !fine.isWaived)
    .reduce((sum, fine) => sum + Number(fine.amount), 0);

  if (!user?.memberId) return <p className="text-text-secondary">Not available.</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {isLoading ? <Skeleton className="size-16 rounded-full" /> : <MemberAvatar name={displayName} className="size-16 text-lg" />}
            <div>
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <h1 className="text-2xl font-bold text-text-primary">{displayName}</h1>
              )}
              <Badge variant={member?.isActive ? 'default' : 'secondary'} className="mt-1">
                {member?.isActive ? 'Active Member' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ProfileStat icon={BookMarked} label="Active holds" value={activeReservations} />
            <ProfileStat icon={ArrowLeftRight} label="Open loans" value={activeBorrows} />
            <ProfileStat icon={AlertTriangle} label="Outstanding" value={formatCurrency(outstandingFineTotal)} danger={outstandingFineTotal > 0} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
        <Card className="py-0">
          <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <User size={17} className="text-accent" /> Member Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <InfoRow icon={Mail} label="Email" value={member?.email ?? user?.email} isLoading={isLoading} />
              <InfoRow icon={Hash} label="Membership Number" value={member?.membershipNumber} isLoading={isLoading} />
              <InfoRow icon={Calendar} label="Member Since" value={member?.joinedAt ? formatDate(member.joinedAt) : undefined} isLoading={isLoading} />
              <InfoRow icon={Phone} label="Phone" value={member?.phone ?? '—'} isLoading={isLoading} />
              <InfoRow icon={MapPin} label="Address" value={member?.address ?? '—'} isLoading={isLoading} />
              <InfoRow icon={User} label="Account ID" value={`#${user?.id}`} isLoading={isLoading} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="py-0">
            <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Save size={17} className="text-accent" /> Update Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  updateMutation.mutate();
                }}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="member-full-name">Full name</Label>
                    <Input
                      id="member-full-name"
                      value={form.fullName}
                      onChange={(event) => setFormPatch((current) => ({ ...current, fullName: event.target.value }))}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      value={form.email}
                      type="email"
                      onChange={(event) => setFormPatch((current) => ({ ...current, email: event.target.value }))}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="member-phone">Phone</Label>
                    <Input
                      id="member-phone"
                      value={form.phone}
                      onChange={(event) => setFormPatch((current) => ({ ...current, phone: event.target.value }))}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="member-address">Address</Label>
                    <Input
                      id="member-address"
                      value={form.address}
                      onChange={(event) => setFormPatch((current) => ({ ...current, address: event.target.value }))}
                      autoComplete="street-address"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="gap-2" disabled={updateMutation.isPending || !form.fullName || !form.email}>
                    <Save size={15} />
                    {updateMutation.isPending ? 'Saving...' : 'Save details'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound size={17} className="text-accent" /> Password
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <AccountPasswordForm />
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck size={17} className="text-accent" /> Account Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs font-medium uppercase text-text-secondary">Membership status</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-lg font-bold text-text-primary">{member?.isActive ? 'Active' : 'Inactive'}</p>
                  {member?.isActive ? <CheckCircle2 size={19} className="text-success" /> : <AlertTriangle size={19} className="text-danger" />}
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  {member?.isActive ? 'You can browse, reserve, and track books from this account.' : 'Access has been paused by library staff.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Books borrowed" value={booksBorrowed} />
                <MiniStat label="Fine records" value={fines.length} />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
              <CardTitle className="text-base">Library Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <ActivityRow label="Reservations" value={`${activeReservations} pending`} />
              <ActivityRow label="Borrowing history" value={`${transactions.length} transactions`} />
              <ActivityRow label="Fines" value={outstandingFineTotal > 0 ? `${formatCurrency(outstandingFineTotal)} outstanding` : 'No outstanding balance'} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileStat({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className={`mb-2 inline-grid size-8 place-items-center rounded-full ${danger ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-base font-bold text-text-primary">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-lg font-bold text-text-primary">{value}</p>
    </div>
  );
}

function ActivityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
      <p className="text-sm font-medium text-text-primary">{label}</p>
      <p className="text-sm text-text-secondary">{value}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, isLoading }: { icon: React.ElementType; label: string; value?: string; isLoading?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        {isLoading ? <Skeleton className="h-4 w-40 mt-1" /> : <p className="truncate text-sm text-text-primary">{value ?? '—'}</p>}
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
