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
import { toast } from 'sonner';
import { MemberAvatar } from '@/components/CatalogVisuals';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TableActionButton, TableActionGroup } from '@/components/TableActions';
import { BadgeCheck, Search, ShieldOff } from 'lucide-react';

interface FineRow {
  id: number;
  memberName: string;
  amount: number;
  reason: string;
  createdAt: string;
  isPaid: boolean;
  isWaived: boolean;
}

export default function FinesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [payFine, setPayFine] = useState<FineRow | null>(null);
  const [waiveId, setWaiveId] = useState<number | null>(null);
  const [waiveNote, setWaiveNote] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.fines, page, status, q],
    queryFn: () => finesService.getAll({
      page,
      limit: 20,
      status: status || undefined,
      q: q.trim() || undefined,
    }),
  });

  const payMutation = useMutation({
    mutationFn: finesService.markPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fines });
      setPayFine(null);
      toast.success('Fine marked as paid');
    },
    onError: () => {
      toast.error('Failed to mark fine as paid');
    },
  });

  const waiveMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => finesService.waive(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fines });
      setWaiveId(null);
      setWaiveNote('');
      toast.success('Fine waived');
    },
    onError: () => {
      toast.error('Failed to waive fine');
    },
  });

  const rows: FineRow[] = (data?.data as { data?: FineRow[] })?.data ?? [];
  const totalPages = (data?.data as { meta?: { totalPages?: number } })?.meta?.totalPages;

  const columns = [
    { key: 'member', header: 'Member', sortValue: (f: FineRow) => f.memberName, render: (f: FineRow) => (
      <div className="flex items-center gap-3">
        <MemberAvatar name={f.memberName} />
        <span className="font-medium">{f.memberName}</span>
      </div>
    ) },
    { key: 'amount', header: 'Amount', sortValue: (f: FineRow) => f.amount, render: (f: FineRow) => <span className="font-medium text-danger">{formatCurrency(Number(f.amount))}</span> },
    { key: 'reason', header: 'Reason', sortValue: (f: FineRow) => f.reason, render: (f: FineRow) => f.reason },
    { key: 'created', header: 'Date', sortValue: (f: FineRow) => f.createdAt, render: (f: FineRow) => formatDate(f.createdAt) },
    { key: 'status', header: 'Status', sortValue: (f: FineRow) => f.isPaid ? 'Paid' : f.isWaived ? 'Waived' : 'Unpaid', render: (f: FineRow) => (
      <Badge variant={f.isPaid ? 'secondary' : f.isWaived ? 'secondary' : 'destructive'}>
        {f.isPaid ? 'Paid' : f.isWaived ? 'Waived' : 'Unpaid'}
      </Badge>
    )},
    { key: 'actions', header: '', render: (f: FineRow) => (
      !f.isPaid && !f.isWaived ? (
        <TableActionGroup>
          <TableActionButton
            label="Mark paid"
            icon={BadgeCheck}
            tone="success"
            disabled={payMutation.isPending}
            onClick={() => setPayFine(f)}
          />
          {user?.role === 'admin' && (
            <TableActionButton
              label="Waive"
              icon={ShieldOff}
              tone="warning"
              disabled={waiveMutation.isPending}
              onClick={() => setWaiveId(f.id)}
            />
          )}
        </TableActionGroup>
      ) : null
    )},
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Fines</h1>
        <p className="mt-1 text-sm text-text-secondary">Search by member and filter payment status.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-surface p-3 lg:grid-cols-[minmax(16rem,1fr)_13rem]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <Input
            className="pl-9"
            placeholder="Search by member name or fine reason..."
            value={q}
            onChange={(event) => { setQ(event.target.value); setPage(1); }}
          />
        </div>
        <Select value={status || 'ALL'} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All fines" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All fines</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="WAIVED">Waived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={rows} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmDialog
        open={!!payFine}
        title="Mark fine as paid?"
        description={payFine ? `${payFine.memberName}'s ${formatCurrency(Number(payFine.amount))} fine will be recorded as paid and removed from outstanding balances.` : ''}
        confirmLabel="Mark paid"
        tone="success"
        isPending={payMutation.isPending}
        onOpenChange={(open) => !open && setPayFine(null)}
        onConfirm={() => payFine && payMutation.mutate(payFine.id)}
      />

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
