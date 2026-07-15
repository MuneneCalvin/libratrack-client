import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { booksService, type Book } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { formatLanguageCodes, formatPopularity, formatRating } from '@/lib/bookMetadata';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageBackButton from '@/components/PageBackButton';
import { BookOpen, Calendar, Hash, Languages, Library, Signal, Star, Tags } from 'lucide-react';

export default function PortalBookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bookId = Number(id);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.book(bookId),
    queryFn: () => booksService.getById(bookId),
    enabled: Number.isFinite(bookId) && bookId > 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-52 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  const book = ((data?.data as { data?: Book })?.data ?? data?.data) as Book | undefined;
  if (!book) return <p className="text-danger">Book not found.</p>;

  const subjects = book.subjects?.slice(0, 12) ?? [];
  const availabilityPercent = book.totalCopies > 0
    ? Math.min(100, Math.max(0, (book.availableCopies / book.totalCopies) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <PageBackButton label="Back to My Books" onClick={() => navigate('/portal/my-books')} />
        <div className="grid gap-5 overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{book.categoryName}</Badge>
              <Badge variant={book.availableCopies > 0 ? 'default' : 'destructive'}>
                {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Unavailable'}
              </Badge>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">{book.title}</h1>
              <p className="mt-1 text-sm text-text-secondary">{book.author || 'Unknown author'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoTile icon={Star} label="Rating" value={formatRating(book)} />
              <InfoTile icon={Library} label="Editions" value={book.editionCount ? `${book.editionCount}` : 'Not listed'} />
              <InfoTile icon={Languages} label="Languages" value={formatLanguageCodes(book.languageCodes)} />
              <InfoTile icon={Signal} label="Popularity" value={formatPopularity(book)} />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-surface-hover">
            <div className="aspect-[3/4]">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-text-secondary">
                  <BookOpen size={46} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen size={16} className="text-accent" /> Synopsis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-text-primary">
                {book.synopsis || 'No synopsis is available for this book yet.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tags size={16} className="text-accent" /> Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => <Badge key={subject} variant="secondary">{subject}</Badge>)}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No subjects are listed for this book.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Book Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <FactRow icon={Hash} label="ISBN" value={book.isbn || 'Not listed'} />
              <FactRow icon={Calendar} label="Published" value={book.publishedYear ? `${book.publishedYear}` : 'Not listed'} />
              <FactRow icon={Library} label="Publisher" value={book.publisher || 'Not listed'} />
              <FactRow icon={Languages} label="Languages" value={formatLanguageCodes(book.languageCodes)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-4xl font-bold text-text-primary">{book.availableCopies}</p>
                <p className="text-xs text-text-secondary">of {book.totalCopies} copies available</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-success" style={{ width: `${availabilityPercent}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/70 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        <Icon size={14} className="text-accent" /> {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function FactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-hover/40 p-3">
      <Icon size={15} className="mt-0.5 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="truncate font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}
