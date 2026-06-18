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
import { BookMarked, CheckCircle2, Search, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';

interface MemberOption {
  id: number;
  fullName: string;
  membershipNumber: string;
}

interface BookOption {
  id: number;
  title: string;
  author: string;
  availableCopies: number;
}

export default function BorrowForm() {
  const [memberId, setMemberId] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<BookOption[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: membersData } = useQuery({ queryKey: QUERY_KEYS.members, queryFn: () => membersService.getAll({ limit: 100 }) });
  const { data: booksData } = useQuery({
    queryKey: [...QUERY_KEYS.books, 'available', bookSearch],
    queryFn: () => booksService.getAll({ available: 'true', q: bookSearch || undefined, limit: 20 }),
    enabled: bookSearch.length > 0,
  });

  const members = (membersData?.data as { data?: MemberOption[] })?.data ?? [];
  const books = (booksData?.data as { data?: BookOption[] })?.data ?? [];
  const selectedBookIds = selectedBooks.map((book) => book.id);
  const selectedMember = members.find((member) => member.id === Number(memberId));

  const mutation = useMutation({
    mutationFn: () => transactionsService.borrow(Number(memberId), selectedBookIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
      toast.success('Borrow recorded', {
        description: `${selectedBooks.length} ${selectedBooks.length === 1 ? 'book' : 'books'} assigned to ${selectedMember?.fullName ?? 'member'}.`,
      });
      navigate('/transactions');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      const message = e.response?.data?.message ?? 'Failed to process borrow';
      setError(message);
      toast.error(message);
    },
  });

  function addBook(book: BookOption) {
    if (!selectedBookIds.includes(book.id)) setSelectedBooks((prev) => [...prev, book]);
    setBookSearch('');
    setError('');
  }

  function removeBook(id: number) {
    setSelectedBooks((prev) => prev.filter((book) => book.id !== id));
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Process Borrow</h1>
        <p className="text-text-secondary text-sm mt-1">Create a borrow record for one member and one or more available books.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-md bg-accent/10 text-accent flex items-center justify-center">
                  <UserRound size={17} />
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary">Member</h2>
                  <p className="text-xs text-text-secondary">Select the borrowing member.</p>
                </div>
              </div>
              <Select value={memberId} onValueChange={(value) => { setMemberId(value); setError(''); }}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={String(member.id)}>
                      {member.fullName} - {member.membershipNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-md bg-accent/10 text-accent flex items-center justify-center">
                  <Search size={17} />
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary">Available Books</h2>
                  <p className="text-xs text-text-secondary">Search by title, author, or ISBN.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="borrow-book-search" className="sr-only">Search books</Label>
                <Input
                  id="borrow-book-search"
                  placeholder="Type to search available books..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                />
                {bookSearch.trim().length > 0 && books.length === 0 && (
                  <div className="rounded-md border border-dashed border-border bg-background px-3 py-4 text-sm text-text-secondary">
                    No available books match this search.
                  </div>
                )}
                {books.length > 0 && (
                  <div className="border border-border rounded-md divide-y divide-border overflow-hidden">
                    {books.map((book) => {
                      const alreadySelected = selectedBookIds.includes(book.id);

                      return (
                        <button
                          key={book.id}
                          type="button"
                          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => addBook(book)}
                          disabled={alreadySelected}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{book.title}</p>
                            <p className="text-xs text-text-secondary truncate">{book.author}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {alreadySelected ? 'Selected' : `${book.availableCopies} left`}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-md bg-accent/10 text-accent flex items-center justify-center">
                <BookMarked size={17} />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">Borrow Summary</h2>
                <p className="text-xs text-text-secondary">Review before confirming.</p>
              </div>
            </div>

            <div className="rounded-md bg-background p-3 text-sm">
              <p className="text-xs uppercase text-text-secondary font-semibold">Member</p>
              <p className="mt-1 font-medium text-text-primary">
                {selectedMember ? `${selectedMember.fullName} (${selectedMember.membershipNumber})` : 'No member selected'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase text-text-secondary font-semibold">Selected Books</p>
              {selectedBooks.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-background px-3 py-4 text-sm text-text-secondary">
                  No books selected.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedBooks.map((book) => (
                    <div key={book.id} className="flex items-start justify-between gap-2 rounded-md border border-border bg-background p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary leading-snug">{book.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{book.author}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBook(book.id)}
                        className="text-text-secondary hover:text-danger"
                        aria-label={`Remove ${book.title}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => mutation.mutate()}
                disabled={!memberId || selectedBooks.length === 0 || mutation.isPending}
                className="gap-1.5"
              >
                <CheckCircle2 size={15} />
                {mutation.isPending ? 'Processing...' : 'Confirm Borrow'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/transactions')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
