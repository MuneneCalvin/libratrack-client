import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '@/services/transactions.service';
import { membersService, type Member } from '@/services/members.service';
import { booksService, type Book } from '@/services/books.service';
import { api } from '@/services/api';
import { QUERY_KEYS } from '@/lib/constants';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookThumb, MemberAvatar } from '@/components/CatalogVisuals';
import { ArrowDownCircle, CheckCircle2, ChevronsUpDown, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface BorrowTransaction {
  status: string;
  items: { returnedAt?: string | null; returned_at?: string | null }[];
}

export default function BorrowModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [bookDropdownOpen, setBookDropdownOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [error, setError] = useState('');

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['modal-members', memberSearch],
    queryFn: () => membersService.getAll({ q: memberSearch.trim() || undefined, limit: 8 }),
    enabled: open && memberDropdownOpen,
  });
  const members = (membersData?.data as { data?: Member[] })?.data ?? [];

  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ['modal-books', selectedMember?.id, bookSearch],
    queryFn: () => booksService.getAll({
      q: bookSearch.trim() || undefined,
      available: bookSearch.trim() ? undefined : 'true',
      limit: 12,
    }),
    enabled: open && !!selectedMember && bookDropdownOpen,
  });
  const books = (booksData?.data as { data?: Book[] })?.data ?? [];
  const selectedBookIds = useMemo(() => new Set(selectedBooks.map((book) => book.id)), [selectedBooks]);
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => api.get('/settings/'),
    enabled: open,
  });
  const { data: memberTransactionsData, isLoading: memberTransactionsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.transactions, 'borrow-capacity', selectedMember?.id],
    queryFn: () => transactionsService.getByMember(selectedMember!.id),
    enabled: open && !!selectedMember,
  });

  const settings = unwrapData<Record<string, string>>(settingsData?.data);
  const maxBooks = Number(settings?.max_books_per_member ?? 0);
  const hasBorrowLimit = Number.isFinite(maxBooks) && maxBooks > 0;
  const memberTransactions = unwrapData<BorrowTransaction[]>(memberTransactionsData?.data) ?? [];
  const currentBorrowedCount = memberTransactions
    .filter((transaction) => transaction.status === 'ACTIVE' || transaction.status === 'OVERDUE')
    .reduce((count, transaction) => (
      count + transaction.items.filter((item) => !(item.returnedAt ?? item.returned_at)).length
    ), 0);
  const remainingSlots = hasBorrowLimit ? Math.max(maxBooks - currentBorrowedCount, 0) : Number.POSITIVE_INFINITY;
  const borrowCapacityLoading = !!selectedMember && (settingsLoading || memberTransactionsLoading);
  const selectedWouldExceedLimit = hasBorrowLimit && selectedBooks.length >= remainingSlots;

  const mutation = useMutation({
    mutationFn: () => transactionsService.borrow(selectedMember!.id, selectedBooks.map((book) => book.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
      toast.success('Borrow recorded', {
        description: `${selectedBooks.length} ${selectedBooks.length === 1 ? 'book' : 'books'} assigned to ${selectedMember?.fullName}.`,
      });
      handleClose();
    },
    onError: (e: { response?: { data?: { detail?: string; message?: string } } }) => {
      const message = e.response?.data?.detail ?? e.response?.data?.message ?? 'Failed to record borrow. Please check availability and try again.';
      setError(message);
      toast.error('Failed to record borrow');
    },
  });

  function handleClose() {
    setMemberSearch('');
    setBookSearch('');
    setMemberDropdownOpen(false);
    setBookDropdownOpen(false);
    setSelectedMember(null);
    setSelectedBooks([]);
    setError('');
    onClose();
  }

  function selectMember(member: Member) {
    setSelectedMember(member);
    setMemberSearch('');
    setSelectedBooks([]);
    setBookSearch('');
    setMemberDropdownOpen(false);
    setError('');
  }

  function toggleBook(book: Book) {
    const alreadySelected = selectedBookIds.has(book.id);
    if (borrowCapacityLoading) {
      setError("Checking this member's borrowing capacity. Please wait a moment.");
      return;
    }
    if (book.availableCopies < 1) {
      setError(`${book.title} has no available copies right now.`);
      return;
    }
    if (!alreadySelected && selectedWouldExceedLimit) {
      setError(
        remainingSlots === 0
          ? `${selectedMember?.fullName ?? 'This member'} already has ${currentBorrowedCount} borrowed books, which reaches the ${maxBooks}-book limit. Return books first or increase the limit in settings.`
          : `${selectedMember?.fullName ?? 'This member'} can only borrow ${remainingSlots} more ${remainingSlots === 1 ? 'book' : 'books'} right now.`,
      );
      return;
    }
    setError('');
    setSelectedBooks((prev) =>
      prev.some((selected) => selected.id === book.id)
        ? prev.filter((selected) => selected.id !== book.id)
        : [...prev, book],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedMember) { setError('Select a member before choosing books.'); return; }
    if (selectedBooks.length === 0) { setError('Select at least one available book.'); return; }
    if (borrowCapacityLoading) {
      setError("Checking this member's borrowing capacity. Please wait a moment.");
      return;
    }
    if (hasBorrowLimit && selectedBooks.length > remainingSlots) {
      setError(`${selectedMember.fullName} can only borrow ${remainingSlots} more ${remainingSlots === 1 ? 'book' : 'books'} right now.`);
      return;
    }
    mutation.mutate();
  }

  const unavailableMatches = bookDropdownOpen && bookSearch.trim().length > 0 && books.some((book) => book.availableCopies < 1);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <DialogContent className="overflow-visible p-0 sm:max-w-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
                <ArrowDownCircle size={20} />
              </div>
              <div>
                <DialogTitle>Borrow books</DialogTitle>
                <DialogDescription>Pick a member, choose titles, and complete the checkout.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-text-primary">Member</Label>
                <div
                  className="relative"
                  onBlur={(event) => {
                    const next = event.relatedTarget;
                    if (!next || !event.currentTarget.contains(next)) setMemberDropdownOpen(false);
                  }}
                >
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <Input
                      className="h-11 pl-9 pr-9"
                      placeholder="Search members..."
                      value={memberDropdownOpen ? memberSearch : selectedMember?.fullName ?? memberSearch}
                      onClick={() => {
                        if (!memberDropdownOpen) {
                          setMemberSearch('');
                          setMemberDropdownOpen(true);
                        }
                      }}
                      onChange={(event) => {
                        setSelectedMember(null);
                        setMemberSearch(event.target.value);
                        setMemberDropdownOpen(true);
                      }}
                    />
                    <ChevronsUpDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  </div>

                  {memberDropdownOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[70] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                      <div className="max-h-64 overflow-y-auto p-1.5">
                        {membersLoading ? (
                          <p className="px-3 py-4 text-sm text-text-secondary">Loading members...</p>
                        ) : members.length === 0 ? (
                          <p className="px-3 py-4 text-sm text-text-secondary">No members found.</p>
                        ) : (
                          members.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent/8"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectMember(member)}
                            >
                              <MemberAvatar name={member.fullName} className="size-9" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-text-primary">{member.fullName}</span>
                                <span className="text-xs text-text-secondary">{member.membershipNumber}</span>
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-text-primary">Books</Label>
                <div
                  className="relative"
                  onBlur={(event) => {
                    const next = event.relatedTarget;
                    if (!next || !event.currentTarget.contains(next)) setBookDropdownOpen(false);
                  }}
                >
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <Input
                      className="h-11 pl-9 pr-9"
                      placeholder={
                        !selectedMember
                          ? 'Select a member first'
                          : borrowCapacityLoading
                            ? 'Checking borrowing capacity...'
                            : remainingSlots === 0
                              ? 'Borrowing limit reached'
                              : 'Search available books...'
                      }
                      value={bookSearch}
                      disabled={!selectedMember || borrowCapacityLoading || remainingSlots === 0}
                      onClick={() => {
                        if (selectedMember && !borrowCapacityLoading && remainingSlots > 0) setBookDropdownOpen(true);
                      }}
                      onChange={(event) => {
                        setBookSearch(event.target.value);
                        setBookDropdownOpen(true);
                        setError('');
                      }}
                    />
                    <ChevronsUpDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  </div>

                  {bookDropdownOpen && selectedMember && (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[70] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                      {unavailableMatches && (
                        <div className="border-b border-danger/20 bg-danger/5 px-3 py-2 text-xs font-medium text-danger">
                          One or more matching books have no available copies.
                        </div>
                      )}
                      <div className="max-h-72 overflow-y-auto p-1.5">
                        {booksLoading ? (
                          <p className="px-3 py-4 text-sm text-text-secondary">Loading books...</p>
                        ) : books.length === 0 ? (
                          <p className="px-3 py-4 text-sm text-text-secondary">
                            {bookSearch.trim() ? 'No books match this search.' : 'No available books found.'}
                          </p>
                        ) : (
                          books.map((book) => {
                            const isSelected = selectedBookIds.has(book.id);
                            const isUnavailable = book.availableCopies < 1;

                            return (
                              <button
                                key={book.id}
                                type="button"
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent/8 ${
                                  isSelected ? 'bg-accent/10' : ''
                                } ${isUnavailable ? 'opacity-75' : ''}`}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => toggleBook(book)}
                              >
                                <BookThumb book={book} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-text-primary">{book.title}</span>
                                  <span className="block truncate text-xs text-text-secondary">{book.author}</span>
                                </span>
                                <Badge variant={isUnavailable ? 'destructive' : isSelected ? 'default' : selectedWouldExceedLimit ? 'destructive' : 'secondary'} className="shrink-0 text-xs">
                                  {isUnavailable ? 'No copies' : isSelected ? 'Selected' : selectedWouldExceedLimit ? 'Limit reached' : `${book.availableCopies} left`}
                                </Badge>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-hover/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Checkout summary</p>
                  <p className="mt-1 text-sm text-text-primary">
                    {selectedMember ? selectedMember.fullName : 'No member selected'} · {selectedBooks.length} {selectedBooks.length === 1 ? 'book' : 'books'}
                  </p>
                  {selectedMember && hasBorrowLimit && (
                    <p className={`mt-1 text-xs ${remainingSlots === 0 ? 'text-danger' : 'text-text-secondary'}`}>
                      {borrowCapacityLoading
                        ? 'Checking borrowing slots...'
                        : `${currentBorrowedCount} of ${maxBooks} borrowing slots used · ${remainingSlots} available`}
                    </p>
                  )}
                </div>
                {selectedMember && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <MemberAvatar name={selectedMember.fullName} className="size-7" />
                    {selectedMember.membershipNumber}
                  </div>
                )}
              </div>

              {selectedBooks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedBooks.map((book) => (
                    <Badge key={book.id} variant="secondary" className="max-w-full gap-1.5 py-1 pr-1">
                      <span className="truncate">{book.title}</span>
                      <button type="button" onClick={() => toggleBook(book)} className="rounded-full p-0.5 hover:bg-danger/10 hover:text-danger">
                        <X size={11} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleClose} className="sm:min-w-24">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending || borrowCapacityLoading || !selectedMember || selectedBooks.length === 0 || selectedBooks.length > remainingSlots} className="gap-2 sm:min-w-44">
                <CheckCircle2 size={15} />
                {mutation.isPending ? 'Processing...' : borrowCapacityLoading ? 'Checking...' : `Complete borrow${selectedBooks.length ? ` (${selectedBooks.length})` : ''}`}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function unwrapData<T>(payload: unknown): T | undefined {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data;
  }
  return payload as T | undefined;
}
