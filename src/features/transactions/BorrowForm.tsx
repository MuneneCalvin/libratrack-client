import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { membersService } from '@/services/members.service';
import { booksService } from '@/services/books.service';
import { transactionsService } from '@/services/transactions.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

export default function BorrowForm() {
  const [memberId, setMemberId] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: membersData } = useQuery({ queryKey: QUERY_KEYS.members, queryFn: () => membersService.getAll({ limit: 100 }) });
  const { data: booksData } = useQuery({
    queryKey: [...QUERY_KEYS.books, 'available', bookSearch],
    queryFn: () => booksService.getAll({ available: 'true', q: bookSearch || undefined, limit: 20 }),
    enabled: bookSearch.length > 0,
  });

  const members = (membersData?.data as { data?: { id: number; fullName: string; membershipNumber: string }[] })?.data ?? [];
  const books = (booksData?.data as { data?: { id: number; title: string; author: string; availableCopies: number }[] })?.data ?? [];

  const mutation = useMutation({
    mutationFn: () => transactionsService.borrow(Number(memberId), selectedBookIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
      navigate('/transactions');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => setError(e.response?.data?.message ?? 'Failed to process borrow'),
  });

  function addBook(id: number) {
    if (!selectedBookIds.includes(id)) setSelectedBookIds((prev) => [...prev, id]);
    setBookSearch('');
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Process Borrow</h1>
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-1">
            <Label>Member</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.fullName} — {m.membershipNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Search Books</Label>
            <Input placeholder="Type to search available books…" value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} />
            {books.length > 0 && (
              <div className="border border-border rounded-md divide-y divide-border">
                {books.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-3 py-2 hover:bg-surface-hover cursor-pointer" onClick={() => addBook(b.id)}>
                    <div>
                      <p className="text-sm font-medium">{b.title}</p>
                      <p className="text-xs text-text-secondary">{b.author}</p>
                    </div>
                    <Badge variant="secondary">{b.availableCopies} left</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedBookIds.length > 0 && (
            <div className="space-y-1">
              <Label>Selected Books</Label>
              <div className="flex flex-wrap gap-2">
                {selectedBookIds.map((id) => {
                  const allBooks = (booksData?.data as { data?: { id: number; title: string }[] })?.data ?? [];
                  const book = allBooks.find((b) => b.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1 pr-1">
                      {book?.title ?? `Book #${id}`}
                      <button onClick={() => setSelectedBookIds((prev) => prev.filter((bid) => bid !== id))}><X size={12} /></button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} disabled={!memberId || selectedBookIds.length === 0 || mutation.isPending}>
              {mutation.isPending ? 'Processing…' : 'Confirm Borrow'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/transactions')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
