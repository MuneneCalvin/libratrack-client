import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '@/services/transactions.service';
import { membersService, type Member } from '@/services/members.service';
import { QUERY_KEYS } from '@/lib/constants';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, Search, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Transaction {
  id: number;
  memberName: string;
  borrowedAt: string;
  dueDate: string;
  status: string;
  items: { book: { title: string } }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReturnModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [error, setError] = useState('');

  const { data: membersData } = useQuery({
    queryKey: ['return-members', memberSearch],
    queryFn: () => membersService.getAll({ q: memberSearch, limit: 8 }),
    enabled: memberSearch.length > 0,
  });
  const members = (membersData?.data as { data?: Member[] })?.data ?? [];

  const { data: txnData } = useQuery({
    queryKey: ['return-transactions', selectedMember?.id],
    queryFn: () => transactionsService.getByMember(selectedMember!.id, { status: 'ACTIVE', limit: 20 }),
    enabled: !!selectedMember,
  });
  const transactions = (txnData?.data as { data?: Transaction[] })?.data ?? [];

  const mutation = useMutation({
    mutationFn: () => transactionsService.return(selectedTxn!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      handleClose();
    },
    onError: () => setError('Failed to process return. Please try again.'),
  });

  function handleClose() {
    setMemberSearch('');
    setSelectedMember(null);
    setSelectedTxn(null);
    setError('');
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedTxn) { setError('Please select a transaction to return.'); return; }
    mutation.mutate();
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    ACTIVE: 'default', OVERDUE: 'destructive',
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-accent/10">
              <ArrowUpCircle size={20} className="text-accent" />
            </div>
            <DialogTitle>Return Books</DialogTitle>
          </div>
          <DialogDescription>Select a member to see their active borrows and process a return.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Member search */}
          <div className="space-y-2">
            <Label>Member</Label>
            {selectedMember ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-surface">
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedMember.fullName}</p>
                  <p className="text-xs text-text-secondary">{selectedMember.membershipNumber}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => { setSelectedMember(null); setSelectedTxn(null); }}>
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <Input
                    className="pl-8"
                    placeholder="Search by name or membership number…"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
                {members.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent/5 text-sm transition-colors"
                        onClick={() => { setSelectedMember(m); setMemberSearch(''); }}
                      >
                        <span className="font-medium">{m.fullName}</span>
                        <span className="text-text-secondary ml-2 text-xs">{m.membershipNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active transactions */}
          {selectedMember && (
            <div className="space-y-2">
              <Label>Active Borrows</Label>
              {transactions.length === 0 ? (
                <p className="text-sm text-text-secondary py-2">No active borrows for this member.</p>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                  {transactions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-border last:border-0 ${selectedTxn?.id === t.id ? 'bg-accent/10' : 'hover:bg-accent/5'}`}
                      onClick={() => setSelectedTxn(selectedTxn?.id === t.id ? null : t)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium leading-snug">{t.items.map((i) => i.book.title).join(', ')}</p>
                          <p className="text-xs text-text-secondary mt-0.5">Due: {formatDate(t.dueDate)}</p>
                        </div>
                        <Badge variant={statusVariant[t.status] ?? 'secondary'} className="text-xs shrink-0">{t.status}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="border-l-4 border-danger bg-danger/5 px-3 py-2 rounded-r-md">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || !selectedTxn}>
              {mutation.isPending ? 'Processing…' : 'Confirm Return'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
