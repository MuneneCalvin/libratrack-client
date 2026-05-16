import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finesService } from '@/services/fines.service';
import { QUERY_KEYS } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

export default function FinesPage() {
  const [page, setPage] = useState(1);
  const [isPaid, setIsPaid] = useState('');
  const [waiveId, setWaiveId] = useState<number | null>(null);
  const [waiveNote, setWaiveNote] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.fines, page, isPaid],
    queryFn: () => finesService.getAll({ page, limit: 20, isPaid: isPaid || undefined }),
  });

  const payMutation = useMutation({
    mutationFn: finesService.markPaid,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fines }),
  });

  const waiveMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => finesService.waive(id, note),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fines }); setWaiveId(null); setWaiveNote(''); },
  });

  const columns = [
    { key: 'member', header: 'Member', render: (f: { memberName: string }) => f.memberName },
    { key: 'amount', header: 'Amount', render: (f: { amount: number }) => <span className="font-medium text-danger">{formatCurrency(Number(f.amount))}</span> },
    { key: 'reason', header: 'Reason', render: (f: { reason: string }) => f.reason },
    { key: 'created', header: 'Date', render: (f: { createdAt: string }) => formatDate(f.createdAt) },
    { key: 'status', header: 'Status', render: (f: { isPaid: boolean; isWaived: boolean }) => (
      <Badge variant={f.isPaid ? 'secondary' : f.isWaived ? 'secondary' : 'destructive'}>
        {f.isPaid ? 'Paid' : f.isWaived ? 'Waived' : 'Unpaid'}
      </Badge>
    )},
    { key: 'actions', header: '', render: (f: { id: number; isPaid: boolean; isWaived: boolean }) => (
      !f.isPaid && !f.isWaived ? (
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => payMutation.mutate(f.id)}>Mark Paid</Button>
          {user?.role === 'admin' && <Button variant="ghost" size="sm" className="text-warning" onClick={() => setWaiveId(f.id)}>Waive</Button>}
        </div>
      ) : null
    )},
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-text-primary">Fines</h1>
      <Select value={isPaid} onValueChange={(v) => { setIsPaid(v === 'ALL' ? '' : v); setPage(1); }}>
        <SelectTrigger className="w-40"><SelectValue placeholder="All fines" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All</SelectItem>
          <SelectItem value="false">Unpaid</SelectItem>
          <SelectItem value="true">Paid</SelectItem>
        </SelectContent>
      </Select>
      <DataTable columns={columns} data={(data?.data as { data?: unknown[] })?.data ?? []} isLoading={isLoading} page={page} totalPages={(data?.data as { meta?: { totalPages?: number } })?.meta?.totalPages} onPageChange={setPage} />

      <Dialog open={!!waiveId} onOpenChange={() => setWaiveId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Waive Fine</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason for waiver</Label>
            <Input value={waiveNote} onChange={(e) => setWaiveNote(e.target.value)} placeholder="Enter reason…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaiveId(null)}>Cancel</Button>
            <Button onClick={() => waiveId && waiveMutation.mutate({ id: waiveId, note: waiveNote })} disabled={!waiveNote || waiveMutation.isPending}>
              Confirm Waiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
