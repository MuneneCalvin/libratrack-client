import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { booksService, type Book } from '@/services/books.service';
import { transactionsService } from '@/services/transactions.service';
import { QUERY_KEYS } from '@/lib/constants';
import { formatLanguageCodes, formatPopularity, formatRating } from '@/lib/bookMetadata';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageBackButton from '@/components/PageBackButton';
import { MemberAvatar } from '@/components/CatalogVisuals';
import { Pencil, BookOpen, Star, Tags, Languages, Library, Image as ImageIcon, ChevronRight, History } from 'lucide-react';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.book(Number(id)),
    queryFn: () => booksService.getById(Number(id)),
  });
  const bookId = Number(id);
  const borrowerHistory = useQuery({
    queryKey: [...QUERY_KEYS.transactions, 'book-preview', bookId],
    queryFn: () => transactionsService.getAll({ bookId, limit: 5 }),
    enabled: Number.isFinite(bookId) && bookId > 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const book = ((data?.data as { data?: Book })?.data ?? data?.data) as Book | undefined;
  if (!book) return <p className="text-danger">Book not found.</p>;
  const visibleSubjects = book.subjects?.slice(0, 10) ?? [];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageBackButton label="Back to books" onClick={() => navigate('/books')} />
          <h1 className="text-2xl font-bold text-text-primary">{book.title}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{book.author}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/books/${id}/edit`)} className="gap-2">
          <Pencil size={14} /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_22rem] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Book Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-1 text-sm md:grid-cols-2">
              <Row label="ISBN" value={book.isbn} />
              <Row label="Category" value={<Badge variant="secondary">{book.categoryName}</Badge>} />
              <Row label="Publisher" value={book.publisher ?? '—'} />
              <Row label="Published Year" value={book.publishedYear ?? '—'} />
              <Row label="Languages" value={formatLanguageCodes(book.languageCodes)} />
              <Row label="Editions" value={book.editionCount ? `${book.editionCount}` : 'Not listed'} />
              <Row label="Open Library Work" value={book.openLibraryWorkKey ?? '—'} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <InfoTile icon={Star} label="Rating" value={formatRating(book)} />
            <InfoTile icon={Library} label="Popularity" value={formatPopularity(book)} />
            <InfoTile icon={Languages} label="Languages" value={formatLanguageCodes(book.languageCodes)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tags size={16} className="text-accent" /> Discovery Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">Synopsis</p>
                {book.synopsis ? (
                  <p className="text-sm leading-6 text-text-primary">{book.synopsis}</p>
                ) : (
                  <p className="text-sm text-text-secondary">No synopsis is available from Open Library for this edition.</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">Subjects</p>
                {visibleSubjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {visibleSubjects.map((subject) => (
                      <Badge key={subject} variant="secondary">{subject}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">No subjects are listed.</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <MetadataBox label="Rating average" value={book.ratingAverage ? `${book.ratingAverage.toFixed(2)} / 5` : 'Not rated'} />
                <MetadataBox label="Rating count" value={`${book.ratingCount ?? 0}`} />
                <MetadataBox label="Want to read" value={`${book.wantToReadCount ?? 0}`} />
                <MetadataBox label="Currently reading" value={`${book.currentlyReadingCount ?? 0}`} />
                <MetadataBox label="Already read" value={`${book.alreadyReadCount ?? 0}`} />
                <MetadataBox label="Edition count" value={`${book.editionCount ?? 0}`} />
              </div>
            </CardContent>
          </Card>

          <BorrowerHistoryPreview
            rows={(borrowerHistory.data?.data as { data?: BookBorrowerRow[] })?.data ?? []}
            total={(borrowerHistory.data?.data as { meta?: { total?: number } })?.meta?.total}
            isLoading={borrowerHistory.isLoading}
            onViewAll={() => navigate(`/transactions/books/${book.id}`)}
            onViewMember={(memberId) => navigate(`/transactions/members/${memberId}`)}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon size={16} className="text-accent" /> Cover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="aspect-[3/4] overflow-hidden rounded-md border border-border bg-surface-hover">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-secondary">
                    <BookOpen size={42} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen size={16} className="text-accent" /> Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-2">
                <p className={`text-4xl font-bold ${book.availableCopies === 0 ? 'text-danger' : 'text-success'}`}>
                  {book.availableCopies}
                </p>
                <p className="text-text-secondary text-xs mt-1">of {book.totalCopies} copies available</p>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${book.availableCopies === 0 ? 'bg-danger' : 'bg-success'}`}
                  style={{ width: `${(book.availableCopies / book.totalCopies) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 items-center py-2 border-b border-border last:border-0">
      <span className="text-text-secondary font-medium">{label}</span>
      <span className="text-text-primary text-right">{value}</span>
    </div>
  );
}

function MetadataBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-hover/40 px-3 py-2">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-accent/10 p-2">
          <Icon size={16} className="text-accent" />
        </div>
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="text-sm font-medium text-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BorrowerHistoryPreview({
  rows,
  total,
  isLoading,
  onViewAll,
  onViewMember,
}: {
  rows: BookBorrowerRow[];
  total?: number;
  isLoading?: boolean;
  onViewAll: () => void;
  onViewMember: (memberId: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <History size={16} className="text-accent" /> Borrower History
          </CardTitle>
          <p className="mt-1 text-sm text-text-secondary">
            {typeof total === 'number' ? `${total} recorded borrow${total === 1 ? '' : 's'} for this title.` : 'Recent borrowing activity for this title.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onViewAll} className="w-full gap-2 sm:w-auto">
          View all <ChevronRight size={14} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-surface-hover/30 p-6 text-center text-sm text-text-secondary">
            No borrowing history has been recorded for this book yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-primary hover:bg-primary">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/80">Member</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/80">Borrowed</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/80">Due / returned</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/80">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-accent/5">
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => row.memberId && onViewMember(row.memberId)}
                        disabled={!row.memberId}
                        className="group flex items-center gap-3 text-left disabled:pointer-events-none"
                      >
                        <MemberAvatar name={row.memberName} className="size-9" />
                        <span className="font-medium text-text-primary underline-offset-4 group-hover:text-accent group-hover:underline">
                          {row.memberName}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-text-secondary">{formatDate(row.borrowedAt)}</TableCell>
                    <TableCell className="text-text-secondary">
                      {row.returnedAt ? `Returned ${formatDate(row.returnedAt)}` : `Due ${formatDate(row.dueDate)}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'OVERDUE' ? 'destructive' : row.status === 'RETURNED' ? 'secondary' : 'default'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BookBorrowerRow {
  id: number;
  memberId?: number;
  memberName: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  status: string;
}
