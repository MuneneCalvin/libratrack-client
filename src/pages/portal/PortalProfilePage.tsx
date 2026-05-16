import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { membersService } from '@/services/members.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, MapPin, Hash, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function PortalProfilePage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.member(memberId),
    queryFn: () => membersService.getById(memberId),
    enabled: !!user?.memberId,
  });

  const member = (data?.data as { data?: Record<string, unknown> })?.data as {
    id: number; email: string; fullName: string; phone?: string; address?: string;
    membershipNumber: string; joinedAt: string; isActive: boolean;
  } | undefined;

  const initials = member?.fullName
    ? member.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'LT';

  if (!user?.memberId) return <p className="text-text-secondary">Not available.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Member Information</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-primary dark:bg-accent/20 flex items-center justify-center shrink-0">
              {isLoading ? (
                <Skeleton className="size-16 rounded-full" />
              ) : (
                <span className="text-xl font-bold text-primary-foreground dark:text-accent">{initials}</span>
              )}
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <p className="text-lg font-semibold text-text-primary">{member?.fullName ?? user?.email?.split('@')[0]}</p>
              )}
              <Badge variant={member?.isActive ? 'default' : 'secondary'} className="mt-1">
                {member?.isActive ? 'Active Member' : 'Inactive'}
              </Badge>
            </div>
          </div>

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
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, isLoading }: { icon: React.ElementType; label: string; value?: string; isLoading?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon size={16} className="text-text-secondary shrink-0" />
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        {isLoading ? <Skeleton className="h-4 w-40 mt-1" /> : <p className="text-sm text-text-primary">{value ?? '—'}</p>}
      </div>
    </div>
  );
}
