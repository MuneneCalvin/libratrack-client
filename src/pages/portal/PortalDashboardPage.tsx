import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { transactionsService } from '@/services/transactions.service';
import { finesService } from '@/services/fines.service';
import { reservationsService } from '@/services/reservations.service';
import { membersService } from '@/services/members.service';
import { booksService, type Book } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { getBookCoverStyle } from '@/lib/bookCover';
import { formatRating } from '@/lib/bookMetadata';
import StatsCard from '@/components/StatsCard';
import { BookThumb } from '@/components/CatalogVisuals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, CalendarCheck, AlertCircle, BookOpen, Sparkles, ChevronLeft, ChevronRight, Calendar, Tag } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function getVisibleBooks(books: Book[], start: number) {
  if (books.length === 0) return [];
  const visibleCount = Math.min(4, books.length);
  return Array.from({ length: visibleCount }, (_, index) => books[(start + index) % books.length]);
}

function RecommendedBookSlide({
  book,
  index,
  onReserve,
  isReserving,
}: {
  book: Book;
  index: number;
  onReserve: (book: Book) => void;
  isReserving: boolean;
}) {
  const cover = getBookCoverStyle(book.categoryName);
  const responsiveVisibility = index === 0
    ? ''
    : index === 1
      ? 'hidden md:block'
      : index === 2
        ? 'hidden lg:block'
        : 'hidden 2xl:block';

  return (
    <div className={`${responsiveVisibility} group relative min-h-[24rem] overflow-hidden rounded-md border border-border bg-surface-hover text-white shadow-sm`}>
      {book.coverUrl ? (
        <img src={book.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className={`${cover.className} absolute inset-0`}>
          <div className="absolute inset-x-0 top-0 h-1.5 bg-white/35" />
          <div className="absolute -right-12 -top-12 size-40 rounded-full border border-white/20" />
          <BookOpen size={64} className="absolute right-5 top-5 text-white/20" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/10" />
      <div className="relative flex min-h-[24rem] flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          <Badge className="bg-white/90 text-slate-950 hover:bg-white">{book.availableCopies} available</Badge>
          <span className="rounded-full bg-black/35 px-2 py-1 text-xs font-semibold backdrop-blur">
            {formatRating(book)}
          </span>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/80">
              <span className="inline-flex items-center gap-1"><Calendar size={12} /> {book.publishedYear || 'Year N/A'}</span>
              <span className="inline-flex items-center gap-1"><Tag size={12} /> {book.categoryName}</span>
            </div>
            <h2 className="line-clamp-3 text-2xl font-bold leading-tight tracking-tight">{book.title}</h2>
            <p className="line-clamp-1 text-sm font-medium text-white/80">{book.author}</p>
          </div>

          {book.synopsis && (
            <p className="line-clamp-2 text-xs leading-5 text-white/75">{book.synopsis}</p>
          )}

          <Button
            className="w-full gap-2 bg-white text-slate-950 hover:bg-white/90"
            disabled={book.availableCopies === 0 || isReserving}
            onClick={() => onReserve(book)}
          >
            <CalendarCheck size={15} />
            {isReserving ? 'Reserving...' : 'Reserve'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DashboardTransaction {
  id: number;
  dueDate: string;
  returnedAt?: string | null;
  status: string;
  items: {
    id?: number;
    returnedAt?: string | null;
    book: {
      id?: number;
      title: string;
      author?: string;
      coverUrl?: string | null;
    };
  }[];
}

export default function PortalDashboardPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;
  const queryClient = useQueryClient();
  const [activeSlide, setActiveSlide] = useState(0);

  const { data: memberData } = useQuery({
    queryKey: QUERY_KEYS.member(memberId),
    queryFn: () => membersService.getById(memberId),
    enabled: !!user?.memberId,
  });
  const { data: txData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.memberTransactions(memberId),
    queryFn: () => transactionsService.getByMember(memberId),
    enabled: !!user?.memberId,
  });
  const { data: finesData } = useQuery({
    queryKey: QUERY_KEYS.memberFines(memberId),
    queryFn: () => finesService.getByMember(memberId, { isPaid: 'false' }),
    enabled: !!user?.memberId,
  });
  const { data: resData } = useQuery({
    queryKey: QUERY_KEYS.memberReservations(memberId),
    queryFn: () => reservationsService.getByMember(memberId),
    enabled: !!user?.memberId,
  });
  const { data: recommendedData } = useQuery({
    queryKey: [...QUERY_KEYS.books, 'member-recommended'],
    queryFn: () => booksService.getAll({ sort: 'rating', limit: 8, available: 'true' }),
  });

  const member = (memberData?.data as { data?: { fullName?: string } })?.data;
  const transactions = (txData?.data as { data?: DashboardTransaction[] })?.data ?? [];
  const activeTx = transactions
    .filter((transaction) => ['ACTIVE', 'OVERDUE'].includes(transaction.status) && transaction.items.some((item) => !item.returnedAt))
    .slice(0, 5);
  const unpaidFines = (finesData?.data as { data?: { id: number; amount: number; reason: string }[] })?.data ?? [];
  const reservations = (resData?.data as { data?: { id: number; bookTitle: string; bookAuthor?: string; bookCoverUrl?: string | null; expiresAt: string; status: string }[] })?.data ?? [];
  const pendingRes = reservations.filter((reservation) => reservation.status === 'PENDING');
  const readyPickup = reservations.filter((reservation) => reservation.status === 'READY_FOR_PICKUP');
  const recommended = (recommendedData?.data as { data?: Book[] })?.data ?? [];
  const totalFines = unpaidFines.reduce((s, f) => s + Number(f.amount), 0);
  const visibleRecommendations = getVisibleBooks(recommended, activeSlide);

  const reserveMutation = useMutation({
    mutationFn: (book: Book) => reservationsService.create(memberId, book.id),
    onSuccess: (_, book) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.memberReservations(memberId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
      toast.success('Reservation created', {
        description: `${book.title} has been added to your reservations.`,
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to reserve book'));
    },
  });

  useEffect(() => {
    if (recommended.length <= 1) return;
    const prefersReducedMotion = typeof window !== 'undefined'
      && 'matchMedia' in window
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveSlide((slide) => (slide + 1) % recommended.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [recommended.length]);

  if (!user?.memberId) return <p className="text-text-secondary">Not available.</p>;
  if (isLoading) return <p className="text-text-secondary">Loading…</p>;

  const displayName = member?.fullName ?? user?.email?.split('@')[0] ?? 'there';
  const overdueItems = activeTx.filter((t) => new Date(t.dueDate) < new Date());

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
          {getGreeting()}, {displayName}!
        </h1>
        <p className="text-text-secondary text-sm mt-1">{formatToday()}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Active Borrows" value={activeTx.length} icon={ArrowLeftRight} />
        <StatsCard title="Pending Reservations" value={pendingRes.length} icon={CalendarCheck} />
        <StatsCard title="Outstanding Fines" value={formatCurrency(totalFines)} icon={AlertCircle} variant={totalFines > 0 ? 'danger' : 'default'} />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles size={16} className="text-accent" /> Recommended Books
          </CardTitle>
          <p className="text-xs text-text-secondary">Highly rated books currently available to reserve.</p>
        </CardHeader>
        <CardContent className="p-0">
          {visibleRecommendations.length > 0 ? (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {visibleRecommendations.map((book, index) => (
                  <RecommendedBookSlide
                    key={`${book.id}-${index}`}
                    book={book}
                    index={index}
                    isReserving={reserveMutation.isPending}
                    onReserve={(selectedBook) => reserveMutation.mutate(selectedBook)}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {recommended.map((book, index) => (
                    <button
                      key={book.id}
                      type="button"
                      className={`h-2 rounded-full transition-all ${index === activeSlide % recommended.length ? 'w-7 bg-accent' : 'w-2 bg-border hover:bg-accent/50'}`}
                      aria-label={`Show recommendation ${index + 1}`}
                      onClick={() => setActiveSlide(index)}
                    />
                  ))}
                </div>
                {recommended.length > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Previous recommendation"
                      onClick={() => setActiveSlide((slide) => (slide - 1 + recommended.length) % recommended.length)}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Next recommendation"
                      onClick={() => setActiveSlide((slide) => (slide + 1) % recommended.length)}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-10 text-sm text-text-secondary">No recommendations available yet.</div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr_1fr_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck size={16} /> Ready for pickup
            </CardTitle>
          </CardHeader>
          <CardContent>
            {readyPickup.length === 0 ? (
              <p className="text-text-secondary text-sm py-2">No books waiting for pickup.</p>
            ) : (
              <div className="divide-y divide-border">
                {readyPickup.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <BookThumb
                        book={{ title: reservation.bookTitle, author: reservation.bookAuthor, coverUrl: reservation.bookCoverUrl ?? undefined }}
                        className="size-11 rounded-md"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text-primary">{reservation.bookTitle}</p>
                        <p className="truncate text-xs text-text-secondary">{reservation.bookAuthor ?? 'Unknown author'}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-accent">Pick up by {formatDate(reservation.expiresAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Currently Borrowed */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen size={16} /> Currently Borrowed</CardTitle></CardHeader>
          <CardContent>
            {activeTx.length === 0 ? (
              <p className="text-text-secondary text-sm py-2">No books currently borrowed.</p>
            ) : (
              <div className="divide-y divide-border">
                {activeTx.map((t) => {
                  const isOverdue = new Date(t.dueDate) < new Date();
                  const activeItems = t.items.filter((item) => !item.returnedAt);
                  return (
                    <div key={t.id} className="flex flex-col gap-3 py-3 text-sm sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        {activeItems.map((item, index) => (
                          <div key={item.id ?? `${t.id}-${index}`} className="flex min-w-0 items-center gap-3">
                            <BookThumb book={item.book} className="size-11 rounded-md" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-text-primary">{item.book.title}</p>
                              <p className="truncate text-xs text-text-secondary">{item.book.author ?? 'Unknown author'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={isOverdue ? 'text-danger font-medium' : 'text-text-secondary'}>
                          {isOverdue ? 'Overdue' : 'Due'} {formatDate(t.dueDate)}
                        </span>
                        {isOverdue && <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reservations */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarCheck size={16} /> Pending Reservations</CardTitle></CardHeader>
          <CardContent>
            {pendingRes.length === 0 ? (
              <p className="text-text-secondary text-sm py-2">No pending reservations.</p>
            ) : (
              <div className="divide-y divide-border">
                {pendingRes.map((r) => (
                  <div key={r.id} className="py-2.5 flex justify-between items-center text-sm">
                    <span className="text-text-primary">{r.bookTitle}</span>
                    <span className="text-text-secondary text-xs shrink-0">Expires {formatDate(r.expiresAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle size={16} /> Fine Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {unpaidFines.length === 0 ? (
              <p className="text-text-secondary text-sm py-2">No unpaid fines.</p>
            ) : (
              unpaidFines.slice(0, 4).map((fine) => (
                <div key={fine.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                  <span className="text-text-primary">{fine.reason}</span>
                  <span className="font-semibold text-danger">{formatCurrency(Number(fine.amount))}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue alert */}
      {overdueItems.length > 0 && (
        <Card className="border-danger/40 bg-danger/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-danger shrink-0" />
            <p className="text-sm text-danger font-medium">
              You have {overdueItems.length} overdue book{overdueItems.length > 1 ? 's' : ''}. Please return them to avoid additional fines.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
