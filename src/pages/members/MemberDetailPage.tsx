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

  const toggleActive = useMutation({
    mutationFn: () => membersService.update(memberId, { isActive: !member?.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.member(memberId) }),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
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

  const transactions = (txData?.data as { data?: unknown[] })?.data ?? [];
  const fines = (finesData?.data as { data?: unknown[] })?.data ?? [];
  const outstandingFines = (fines as { isPaid: boolean; isWaived: boolean; amount: number }[])
    .filter((f) => !f.isPaid && !f.isWaived)
    .reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{member.fullName}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{member.membershipNumber}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleActive.mutate()}
          disabled={toggleActive.isPending}
        >
          {member.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Member Information
              <Badge variant={member.isActive ? 'default' : 'secondary'}>
                {member.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 text-sm">
            {[
              ['Email', member.email],
              ['Phone', member.phone ?? '—'],
              ['Address', member.address ?? '—'],
              ['Joined', formatDate(member.joinedAt)],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                <span className="text-text-secondary font-medium">{label}</span>
                <span className="text-text-primary">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary font-medium">Total Borrows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-text-primary">{transactions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary font-medium">Outstanding Fines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${outstandingFines > 0 ? 'text-danger' : 'text-success'}`}>
                {formatCurrency(outstandingFines)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
