import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { booksService, type Book } from '@/services/books.service';
import { reservationsService } from '@/services/reservations.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Search, BookOpen, CalendarCheck, Hash, Building2, Calendar } from 'lucide-react';

export default function PortalBooksPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmBook, setConfirmBook] = useState<Book | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.books, 'portal', search, page],
    queryFn: () => booksService.getAll({ search: search || undefined, page, limit: 12 }),
  });

  const reserveMutation = useMutation({
    mutationFn: (bookId: number) => reservationsService.create(memberId, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberReservations(memberId) });
      setConfirmBook(null);
    },
    onError: () => {},
  });

  const books = (data?.data as { data?: Book[] })?.data ?? [];
  const meta = (data?.data as { meta?: { totalPages?: number; total?: number } })?.meta;

  return (
    <div className="space-y-5">
      {/* Reserve confirmation modal */}
      <Dialog open={!!confirmBook} onOpenChange={(o) => { if (!o) setConfirmBook(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-accent/10">
                <CalendarCheck size={20} className="text-accent" />
              </div>
              <DialogTitle>Reserve Book</DialogTitle>
            </div>
            <DialogDescription>Confirm your reservation for the following book.</DialogDescription>
          </DialogHeader>

          {confirmBook && (
            <div className="space-y-4 py-2">
              {/* Book cover placeholder */}
              <div className="h-24 rounded-lg bg-gradient-to-br from-sidebar-bg/80 to-sidebar-bg flex items-center justify-center">
                <BookOpen size={36} className="text-accent/50" />
              </div>

              <div className="space-y-2 text-sm">
                <h3 className="font-semibold text-text-primary text-base leading-snug">{confirmBook.title}</h3>
                <p className="text-text-secondary">{confirmBook.author}</p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                    <Hash size={11} /> {confirmBook.isbn}
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                    <Building2 size={11} /> {confirmBook.publisher || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                    <Calendar size={11} /> {confirmBook.publishedYear || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Badge variant={confirmBook.availableCopies > 0 ? 'secondary' : 'destructive'} className="text-xs">
                      {confirmBook.availableCopies} available
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmBook(null)}>Cancel</Button>
                <Button
                  onClick={() => reserveMutation.mutate(confirmBook.id)}
                  disabled={reserveMutation.isPending || confirmBook.availableCopies === 0}
                  className="gap-1.5"
                >
                  <CalendarCheck size={14} />
                  {reserveMutation.isPending ? 'Reserving…' : 'Confirm Reserve'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Browse Books</h1>
        <p className="text-text-secondary text-sm mt-1">Browse the library collection and reserve books</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input
          className="pl-9"
          placeholder="Search by title, author, or ISBN…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading && <p className="text-text-secondary">Loading books…</p>}

      {!isLoading && books.length === 0 && (
        <p className="text-text-secondary">No books found.</p>
      )}

      {/* Book grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {books.map((book) => (
          <Card key={book.id} className="flex flex-col overflow-hidden hover:border-accent/40 transition-colors">
            {/* Cover placeholder */}
            <div className="h-36 bg-gradient-to-br from-sidebar-bg/80 to-sidebar-bg flex items-center justify-center shrink-0">
              <BookOpen size={40} className="text-accent/50" />
            </div>
            <CardContent className="flex flex-col flex-1 p-4 gap-2">
              <div className="flex-1">
                <p className="font-semibold text-text-primary text-sm leading-snug line-clamp-2">{book.title}</p>
                <p className="text-xs text-text-secondary mt-1">{book.author}</p>
                <p className="text-xs text-text-secondary mt-0.5">{book.categoryName}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant={book.availableCopies > 0 ? 'secondary' : 'destructive'} className="text-xs">
                  {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Unavailable'}
                </Badge>
              </div>
              <Button
                size="sm"
                className="w-full gap-1.5 mt-1"
                disabled={book.availableCopies === 0}
                onClick={() => setConfirmBook(book)}
              >
                <CalendarCheck size={14} />
                Reserve
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-text-secondary">Page {page} of {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
