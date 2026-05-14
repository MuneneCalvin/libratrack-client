import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '@/services/members.service';
import { transactionsService } from '@/services/transactions.service';
import { finesService } from '@/services/fines.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const memberId = Number(id);
  const queryClient = useQueryClient();

  const { data: memberData, isLoading } = useQuery({ queryKey: QUERY_KEYS.member(memberId), queryFn: () => membersService.getById(memberId) });
  const { data: txData } = useQuery({ queryKey: QUERY_KEYS.memberTransactions(memberId), queryFn: () => transactionsService.getByMember(memberId) });
  const { data: finesData } = useQuery({ queryKey: QUERY_KEYS.memberFines(memberId), queryFn: () => finesService.getByMember(memberId) });

  const toggleActive = useMutation({
    mutationFn: () => membersService.update(memberId, { isActive: !member?.user.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.member(memberId) }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  const member = memberData?.data?.data;
  if (!member) return <p className="text-danger">Member not found.</p>;

  const transactions = (txData?.data as { data?: unknown[] })?.data ?? [];
  const fines = (finesData?.data as { data?: unknown[] })?.data ?? [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{member.fullName}</h1>
        <Button variant="outline" size="sm" onClick={() => toggleActive.mutate()}>
          {member.user.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          {[
            ['Email', member.user.email],
            ['Membership #', member.membershipNumber],
            ['Phone', member.phone ?? '—'],
            ['Address', member.address ?? '—'],
            ['Joined', formatDate(member.joinedAt)],
            ['Status', <Badge key="s" variant={member.user.isActive ? 'default' : 'secondary'}>{member.user.isActive ? 'Active' : 'Inactive'}</Badge>],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between">
              <span className="text-text-secondary">{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Borrows</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{transactions.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Outstanding Fines</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-danger">
              {formatCurrency((fines as { isPaid: boolean; isWaived: boolean; amount: number }[]).filter((f) => !f.isPaid && !f.isWaived).reduce((sum, f) => sum + Number(f.amount), 0))}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
