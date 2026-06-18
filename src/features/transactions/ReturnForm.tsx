import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { transactionsService } from '@/services/transactions.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReturnForm() {
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: [...QUERY_KEYS.transactions, 'ACTIVE'],
    queryFn: () => transactionsService.getAll({ status: 'ACTIVE', limit: 100 }),
  });

  const overdueData = useQuery({
    queryKey: [...QUERY_KEYS.transactions, 'OVERDUE'],
    queryFn: () => transactionsService.getAll({ status: 'OVERDUE', limit: 100 }),
  });

  const activeTransactions = [
    ...((data?.data as { data?: unknown[] })?.data ?? []),
    ...((overdueData.data?.data as { data?: unknown[] })?.data ?? []),
  ] as { id: number; memberName: string; dueDate: string; status: string; items: { book: { title: string } }[] }[];

  const mutation = useMutation({
    mutationFn: () => transactionsService.return(Number(transactionId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fines });
      toast.success('Return recorded');
      navigate('/transactions');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      const message = e.response?.data?.message ?? 'Failed to process return';
      setError(message);
      toast.error(message);
    },
  });

  const selectedTx = activeTransactions.find((t) => t.id === Number(transactionId));

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Process Return</h1>
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-1">
            <Label>Select Transaction</Label>
            <Select value={transactionId} onValueChange={setTransactionId}>
              <SelectTrigger><SelectValue placeholder="Select active borrow…" /></SelectTrigger>
              <SelectContent>
                {activeTransactions.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.memberName} - {t.items.map((i) => i.book.title).join(', ')} (due {formatDate(t.dueDate)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTx && (
            <div className="bg-background rounded-md p-3 text-sm space-y-1">
              <p><span className="text-text-secondary">Member:</span> {selectedTx.memberName}</p>
              <p><span className="text-text-secondary">Books:</span> {selectedTx.items.map((i) => i.book.title).join(', ')}</p>
              <p><span className="text-text-secondary">Due:</span> {formatDate(selectedTx.dueDate)}</p>
              {selectedTx.status === 'OVERDUE' && <p className="text-danger font-medium">Overdue — a fine will be calculated on return.</p>}
            </div>
          )}

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} disabled={!transactionId || mutation.isPending}>
              {mutation.isPending ? 'Processing...' : 'Confirm Return'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/transactions')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
