import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '@/services/transactions.service';
import { membersService, type Member } from '@/services/members.service';
import { booksService, type Book } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, Search, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BorrowModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [error, setError] = useState('');

  const { data: membersData } = useQuery({
    queryKey: ['modal-members', memberSearch],
    queryFn: () => membersService.getAll({ q: memberSearch, limit: 8 }),
    enabled: memberSearch.length > 0,
  });
  const members = (membersData?.data as { data?: Member[] })?.data ?? [];

  const { data: booksData } = useQuery({
    queryKey: ['modal-books', bookSearch],
    queryFn: () => booksService.getAll({ search: bookSearch, limit: 8 }),
    enabled: bookSearch.length > 0,
  });
  const books = (booksData?.data as { data?: Book[] })?.data ?? [];

  const mutation = useMutation({
    mutationFn: () => transactionsService.borrow(selectedMember!.id, selectedBooks.map((b) => b.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      handleClose();
    },
    onError: () => setError('Failed to record borrow. Please check availability and try again.'),
  });

  function handleClose() {
    setMemberSearch('');
    setBookSearch('');
    setSelectedMember(null);
    setSelectedBooks([]);
    setError('');
    onClose();
  }

  function toggleBook(book: Book) {
    setSelectedBooks((prev) =>
      prev.some((b) => b.id === book.id) ? prev.filter((b) => b.id !== book.id) : [...prev, book]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedMember) { setError('Please select a member.'); return; }
    if (selectedBooks.length === 0) { setError('Please select at least one book.'); return; }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-accent/10">
              <ArrowDownCircle size={20} className="text-accent" />
            </div>
            <DialogTitle>Borrow Books</DialogTitle>
          </div>
          <DialogDescription>Search for a member and select books to borrow.</DialogDescription>
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
                <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedMember(null)}>
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

          {/* Book search */}
          <div className="space-y-2">
            <Label>Books</Label>
            {selectedBooks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {selectedBooks.map((b) => (
                  <Badge key={b.id} variant="secondary" className="gap-1 pr-1">
                    {b.title}
                    <button type="button" onClick={() => toggleBook(b)} className="ml-0.5 hover:text-danger">
                      <X size={10} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="space-y-1">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <Input
                  className="pl-8"
                  placeholder="Search by title, author, or ISBN…"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                />
              </div>
              {books.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden max-h-44 overflow-y-auto">
                  {books.map((b) => {
                    const isSelected = selectedBooks.some((s) => s.id === b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${isSelected ? 'bg-accent/10' : 'hover:bg-accent/5'}`}
                        onClick={() => toggleBook(b)}
                      >
                        <span>
                          <span className="font-medium">{b.title}</span>
                          <span className="text-text-secondary ml-2 text-xs">{b.author}</span>
                        </span>
                        <Badge variant={b.availableCopies > 0 ? 'secondary' : 'destructive'} className="text-xs ml-2 shrink-0">
                          {b.availableCopies > 0 ? `${b.availableCopies} avail.` : 'Out'}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="border-l-4 border-danger bg-danger/5 px-3 py-2 rounded-r-md">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || !selectedMember || selectedBooks.length === 0}>
              {mutation.isPending ? 'Processing…' : `Borrow ${selectedBooks.length > 0 ? `(${selectedBooks.length})` : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
