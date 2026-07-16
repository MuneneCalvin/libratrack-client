import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { booksService, type Book } from '@/services/books.service';
import { reservationsService } from '@/services/reservations.service';
import { QUERY_KEYS } from '@/lib/constants';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { getBookCoverStyle } from '@/lib/bookCover';
import { formatLanguageCodes, formatPopularity, formatRating } from '@/lib/bookMetadata';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Search, BookOpen, CalendarCheck, Hash, Building2, Calendar, Languages,
  Library, Star, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';

function BookCover({ book, compact = false }: { book: Book; compact?: boolean }) {
  const cover = getBookCoverStyle(book.categoryName);

  if (book.coverUrl) {
    return (
      <div className={compact ? 'h-24 overflow-hidden rounded-lg' : 'h-36 overflow-hidden'}>
        <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${compact ? 'h-24 rounded-lg' : 'h-36'} ${cover.className} relative overflow-hidden shrink-0 p-4 text-white`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-white/30" />
      <div className="absolute -right-6 -top-8 size-24 rounded-full border border-white/20" />
      <div className="absolute bottom-3 left-4 right-4">
        <p className="text-[0.65rem] font-bold tracking-[0.16em] text-white/70">{cover.label}</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-tight">{book.title}</p>
      </div>
      <BookOpen size={compact ? 28 : 34} className="absolute right-4 bottom-4 text-white/25" />
    </div>
  );
}

export default function PortalBooksPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('rating');
  const [limit, setLimit] = useState(20);
  const [confirmBook, setConfirmBook] = useState<Book | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.books, 'portal', search, category, sort, limit, page],
    queryFn: () => booksService.getAll({
      search: search || undefined,
      category: category || undefined,
      sort: sort || undefined,
      page,
      limit,
    }),
  });
  const { data: categoriesData } = useQuery({
    queryKey: [...QUERY_KEYS.categories, 'with-books'],
    queryFn: () => booksService.getCategories({ withBooks: true, limit: 100 }),
  });

  const reserveMutation = useMutation({
    mutationFn: (bookId: number) => reservationsService.create(memberId, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberReservations(memberId) });
      toast.success('Reservation created', {
        description: confirmBook ? `${confirmBook.title} has been added to your reservations.` : undefined,
      });
      setConfirmBook(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to reserve book'));
    },
  });

  const books = (data?.data as { data?: Book[] })?.data ?? [];
  const categories = categoriesData?.data?.data ?? [];
  const meta = (data?.data as { meta?: { totalPages?: number; total?: number } })?.meta;
  const totalBooks = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  const showingStart = totalBooks === 0 ? 0 : (page - 1) * limit + 1;
  const showingEnd = totalBooks === 0 ? 0 : Math.min(page * limit, totalBooks);

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
              <BookCover book={confirmBook} compact />

              <div className="space-y-2 text-sm">
                <h3 className="font-semibold text-text-primary text-base leading-snug">{confirmBook.title}</h3>
                <p className="text-text-secondary">{confirmBook.author}</p>
                {confirmBook.synopsis && (
                  <p className="text-text-secondary leading-5 line-clamp-4">{confirmBook.synopsis}</p>
                )}
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
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                    <Languages size={11} /> {formatLanguageCodes(confirmBook.languageCodes)}
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                    <Library size={11} /> {confirmBook.editionCount || 0} editions
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                    <Star size={11} /> {formatRating(confirmBook)}
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
                  {reserveMutation.isPending ? 'Reserving...' : 'Confirm Reservation'}
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

      {/* Search and filters */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(16rem,1fr)_13rem_13rem] gap-3 rounded-md border border-border bg-surface p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <Input
            className="pl-9"
            placeholder="Search by title, author, or ISBN…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={category || 'ALL'} onValueChange={(value) => { setCategory(value === 'ALL' ? '' : value); setPage(1); }}>
          <SelectTrigger className="w-full" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}{typeof cat.bookCount === 'number' ? ` (${cat.bookCount})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort || 'NEWEST'} onValueChange={(value) => { setSort(value === 'NEWEST' ? '' : value); setPage(1); }}>
          <SelectTrigger className="w-full" aria-label="Sort books">
            <SelectValue placeholder="Sort books" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest rated</SelectItem>
            <SelectItem value="most_read">Most read</SelectItem>
            <SelectItem value="popular">Most popular</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="NEWEST">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {meta?.total != null && (
        <p className="text-xs text-text-secondary">Showing {books.length} of {meta.total} matching books.</p>
      )}

      {isLoading && <p className="text-text-secondary">Loading books…</p>}

      {!isLoading && books.length === 0 && (
        <p className="text-text-secondary">No books found.</p>
      )}

      {/* Book grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
        {books.map((book) => (
          <Card key={book.id} className="flex flex-col overflow-hidden hover:border-accent/40 transition-colors">
            <Link
              to={`/portal/books/${book.id}`}
              className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label={`View details for ${book.title}`}
            >
              <BookCover book={book} />
              <CardContent className="flex flex-1 flex-col p-4 pb-2 gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-text-primary text-sm leading-snug line-clamp-2 underline-offset-4 group-hover/card:text-accent group-hover/card:underline">{book.title}</p>
                  <p className="text-xs text-text-secondary mt-1">{book.author}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {book.categoryName}{book.publishedYear ? ` · ${book.publishedYear}` : ''}
                  </p>
                  {book.synopsis && (
                    <p className="text-xs text-text-secondary leading-5 mt-2 line-clamp-3">{book.synopsis}</p>
                  )}
                  {book.subjects && book.subjects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {book.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject} variant="outline" className="text-[0.65rem]">{subject}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[0.7rem] text-text-secondary">
                  <span className="flex items-center gap-1"><Star size={11} /> {book.ratingAverage ? `${book.ratingAverage.toFixed(1)}/5` : 'No rating'}</span>
                  <span className="flex items-center gap-1"><Library size={11} /> {book.editionCount || 0} editions</span>
                  <span className="col-span-2 truncate">{formatPopularity(book)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant={book.availableCopies > 0 ? 'secondary' : 'destructive'} className="text-xs">
                    {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Unavailable'}
                  </Badge>
                </div>
              </CardContent>
            </Link>
            <CardContent className="p-4 pt-0">
              <Button
                size="sm"
                className="w-full gap-1.5"
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
      {meta && (
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Page {page} of {totalPages}</p>
              <p className="text-xs text-text-secondary">Showing {showingStart}-{showingEnd} of {totalBooks} books</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {getPageItems(page, totalPages).map((item, index) => (
                item === '...' ? (
                  <span key={`${item}-${index}`} className="px-1 text-sm text-text-secondary">...</span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? 'default' : 'outline'}
                    size="icon-sm"
                    onClick={() => setPage(item)}
                    aria-label={`Go to page ${item}`}
                  >
                    {item}
                  </Button>
                )
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
            <Select value={String(limit)} onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}>
              <SelectTrigger className="w-40" aria-label="Books per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="20">20 books / page</SelectItem>
                <SelectItem value="40">40 books / page</SelectItem>
                <SelectItem value="60">60 books / page</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page">
              <ChevronsLeft size={16} />
            </Button>
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page">
              <ChevronRight size={16} />
            </Button>
            <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(totalPages)} aria-label="Last page">
              <ChevronsRight size={16} />
            </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPageItems(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const items: Array<number | '...'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) items.push('...');
  for (let current = start; current <= end; current += 1) items.push(current);
  if (end < totalPages - 1) items.push('...');
  items.push(totalPages);
  return items;
}
