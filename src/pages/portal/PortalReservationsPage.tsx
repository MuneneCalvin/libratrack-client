import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { reservationsService } from '@/services/reservations.service';
import { booksService } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';

export default function PortalReservationsPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.memberReservations(memberId),
    queryFn: () => reservationsService.getByMember(memberId),
    enabled: !!user?.memberId,
  });

  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: [...QUERY_KEYS.books, 'search', search],
    queryFn: () => booksService.getAll({ search, limit: 10, available: true }),
    enabled: open,
  });

  const cancelMutation = useMutation({
    mutationFn: reservationsService.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberReservations(memberId) }),
  });

  const createMutation = useMutation({
    mutationFn: (bookId: number) => reservationsService.create(memberId, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberReservations(memberId) });
      setOpen(false);
      setSearch('');
      setSelectedBookId(null);
    },
  });

  if (!user?.memberId) return <p className="text-text-secondary">Not available.</p>;
  if (isLoading) return <p className="text-text-secondary">Loading…</p>;

  const reservations = (data?.data as { data?: { id: number; bookTitle: string; bookAuthor: string; status: string; reservedAt: string; expiresAt: string }[] })?.data ?? [];
  const books = (booksData?.data as { data?: { id: number; title: string; author: string; availableCopies: number }[] })?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">My Reservations</h1>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus size={16} /> New Reservation
        </Button>
      </div>

      {reservations.length === 0 && <p className="text-text-secondary">No reservations yet.</p>}
      {reservations.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4 flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-medium">{r.bookTitle}</p>
              <p className="text-sm text-text-secondary">{r.bookAuthor}</p>
              <p className="text-xs text-text-secondary">Reserved {formatDate(r.reservedAt)} · Expires {formatDate(r.expiresAt)}</p>
              <Badge variant={r.status === 'PENDING' ? 'default' : 'secondary'}>{r.status}</Badge>
            </div>
            {r.status === 'PENDING' && (
              <Button variant="ghost" size="sm" className="text-danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(r.id)}>Cancel</Button>
            )}
          </CardContent>
        </Card>
      ))}

      {/* New Reservation Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSearch(''); setSelectedBookId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Reserve a Book</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Search for a book</Label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <Input
                  className="pl-9"
                  placeholder="Title, author, or ISBN…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedBookId(null); }}
                />
              </div>
            </div>

            {/* Book results */}
            {booksLoading && <p className="text-sm text-text-secondary">Searching…</p>}
            {books.length > 0 && (
              <div className="border border-border rounded-md divide-y divide-border max-h-56 overflow-y-auto">
                {books.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBookId(b.id)}
                    className={`w-full text-left px-3 py-2.5 transition-colors text-sm hover:bg-accent/5 ${selectedBookId === b.id ? 'bg-accent/10 border-l-2 border-accent' : ''}`}
                  >
                    <p className="font-medium text-text-primary">{b.title}</p>
                    <p className="text-xs text-text-secondary">{b.author} · {b.availableCopies} available</p>
                  </button>
                ))}
              </div>
            )}
            {search && !booksLoading && books.length === 0 && (
              <p className="text-sm text-text-secondary">No books found.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedBookId || createMutation.isPending}
              onClick={() => selectedBookId && createMutation.mutate(selectedBookId)}
            >
              {createMutation.isPending ? 'Reserving…' : 'Reserve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
