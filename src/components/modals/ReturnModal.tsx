import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '@/services/transactions.service';
import { membersService, type Member } from '@/services/members.service';
import { QUERY_KEYS } from '@/lib/constants';
import { getApiErrorMessage } from '@/lib/apiErrors';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookThumb, MemberAvatar } from '@/components/CatalogVisuals';
import { ArrowUpCircle, CheckCircle2, ChevronsUpDown, Search, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { Book } from '@/services/books.service';

interface TransactionItem {
  id: number;
  book: Book;
  returnedAt?: string | null;
  returned_at?: string | null;
}

interface Transaction {
  id: number;
  memberName: string;
  borrowedAt: string;
  dueDate: string;
  status: string;
  items: TransactionItem[];
}

interface ReturnableBook {
  itemId: number;
  transactionId: number;
  book: Book;
  dueDate: string;
  status: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReturnModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [bookDropdownOpen, setBookDropdownOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [error, setError] = useState('');

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['return-members', memberSearch],
    queryFn: () => membersService.getAll({ q: memberSearch.trim() || undefined, limit: 8 }),
    enabled: open && memberDropdownOpen,
  });
  const members = (membersData?.data as { data?: Member[] })?.data ?? [];

  const { data: txnData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['return-transactions', selectedMember?.id],
    queryFn: () => transactionsService.getAll({ memberId: selectedMember!.id, limit: 100 }),
    enabled: open && !!selectedMember,
  });
  const transactions = useMemo(
    () => (txnData?.data as { data?: Transaction[] } | undefined)?.data ?? [],
    [txnData],
  );
  const returnableBooks = useMemo(() => getReturnableBooks(transactions), [transactions]);
  const filteredBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    if (!q) return returnableBooks;
    return returnableBooks.filter((item) =>
      item.book.title.toLowerCase().includes(q)
      || item.book.author.toLowerCase().includes(q)
      || item.book.isbn?.toLowerCase().includes(q),
    );
  }, [bookSearch, returnableBooks]);
  const selectedSet = useMemo(() => new Set(selectedItemIds), [selectedItemIds]);
  const selectedBooks = useMemo(
    () => returnableBooks.filter((item) => selectedSet.has(item.itemId)),
    [returnableBooks, selectedSet],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const grouped = selectedItemIds.reduce<Record<number, number[]>>((acc, itemId) => {
        const selected = returnableBooks.find((book) => book.itemId === itemId);
        if (!selected) return acc;
        acc[selected.transactionId] = [...(acc[selected.transactionId] ?? []), itemId];
        return acc;
      }, {});

      await Promise.all(
        Object.entries(grouped).map(([transactionId, itemIds]) =>
          transactionsService.return(Number(transactionId), itemIds),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fines });
      if (selectedMember) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberTransactions(selectedMember.id) });
      }
      toast.success('Return recorded', {
        description: `${selectedItemIds.length} ${selectedItemIds.length === 1 ? 'book' : 'books'} returned for ${selectedMember?.fullName}.`,
      });
      handleClose();
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'Failed to process return. Please try again.');
      setError(message);
      toast.error(message);
    },
  });

  function handleClose() {
    setMemberSearch('');
    setBookSearch('');
    setMemberDropdownOpen(false);
    setBookDropdownOpen(false);
    setSelectedMember(null);
    setSelectedItemIds([]);
    setError('');
    onClose();
  }

  function selectMember(member: Member) {
    setSelectedMember(member);
    setMemberSearch('');
    setBookSearch('');
    setSelectedItemIds([]);
    setMemberDropdownOpen(false);
    setError('');
  }

  function toggleItem(itemId: number) {
    setError('');
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedMember) { setError('Select a member first.'); return; }
    if (selectedItemIds.length === 0) { setError('Select at least one borrowed book to return.'); return; }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <DialogContent className="overflow-visible p-0 sm:max-w-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
                <ArrowUpCircle size={20} />
              </div>
              <div>
                <DialogTitle>Return books</DialogTitle>
                <DialogDescription>Pick a member, select returned titles, and close the return.</DialogDescription>
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
                        setSelectedItemIds([]);
                        setBookSearch('');
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
                <Label className="text-sm font-semibold text-text-primary">Borrowed books</Label>
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
                      placeholder={selectedMember ? 'Search borrowed books...' : 'Select a member first'}
                      value={bookSearch}
                      disabled={!selectedMember}
                      onClick={() => {
                        if (selectedMember) setBookDropdownOpen(true);
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
                      <div className="max-h-72 overflow-y-auto p-1.5">
                        {transactionsLoading ? (
                          <p className="px-3 py-4 text-sm text-text-secondary">Loading borrowed books...</p>
                        ) : filteredBooks.length === 0 ? (
                          <p className="px-3 py-4 text-sm text-text-secondary">
                            {bookSearch.trim() ? 'No borrowed books match this search.' : 'This member has no books currently borrowed.'}
                          </p>
                        ) : (
                          filteredBooks.map((item) => {
                            const isSelected = selectedSet.has(item.itemId);
                            const isOverdue = item.status === 'OVERDUE' || new Date(item.dueDate) < new Date();

                            return (
                              <button
                                key={item.itemId}
                                type="button"
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent/8 ${
                                  isSelected ? 'bg-accent/10' : ''
                                }`}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => toggleItem(item.itemId)}
                              >
                                <BookThumb book={item.book} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-text-primary">{item.book.title}</span>
                                  <span className="block truncate text-xs text-text-secondary">
                                    {item.book.author} · Due {formatDate(item.dueDate)}
                                  </span>
                                </span>
                                <Badge variant={isSelected ? 'default' : isOverdue ? 'destructive' : 'secondary'} className="shrink-0 text-xs">
                                  {isSelected ? 'Selected' : isOverdue ? 'Overdue' : item.status}
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Return summary</p>
                  <p className="mt-1 text-sm text-text-primary">
                    {selectedMember ? selectedMember.fullName : 'No member selected'} · {selectedItemIds.length} {selectedItemIds.length === 1 ? 'book' : 'books'}
                  </p>
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
                  {selectedBooks.map((item) => (
                    <Badge key={item.itemId} variant="secondary" className="max-w-full gap-1.5 py-1 pr-1">
                      <span className="truncate">{item.book.title}</span>
                      <button type="button" onClick={() => toggleItem(item.itemId)} className="rounded-full p-0.5 hover:bg-danger/10 hover:text-danger">
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
              <Button type="submit" disabled={mutation.isPending || !selectedMember || selectedItemIds.length === 0} className="gap-2 sm:min-w-44">
                <CheckCircle2 size={15} />
                {mutation.isPending ? 'Processing...' : `Complete return${selectedItemIds.length ? ` (${selectedItemIds.length})` : ''}`}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getReturnableBooks(transactions: Transaction[]): ReturnableBook[] {
  return transactions.flatMap((transaction) =>
    transaction.items
      .filter((item) => !(item.returnedAt ?? item.returned_at) && transaction.status !== 'RETURNED')
      .map((item) => ({
        itemId: item.id,
        transactionId: transaction.id,
        book: item.book,
        dueDate: transaction.dueDate,
        status: transaction.status,
      })),
  );
}
