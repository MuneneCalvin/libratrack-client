import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { booksService } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { formatLanguageCodes, formatPopularity, formatRating } from '@/lib/bookMetadata';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, BookOpen, Star, Tags, Languages, Library } from 'lucide-react';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.book(Number(id)),
    queryFn: () => booksService.getById(Number(id)),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
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

  const book = data?.data?.data;
  if (!book) return <p className="text-danger">Book not found.</p>;
  const visibleSubjects = book.subjects?.slice(0, 10) ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{book.title}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{book.author}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/books/${id}/edit`)} className="gap-2">
          <Pencil size={14} /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Book Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="ISBN" value={book.isbn} />
            <Row label="Category" value={<Badge variant="secondary">{book.categoryName}</Badge>} />
            <Row label="Publisher" value={book.publisher ?? '—'} />
            <Row label="Published Year" value={book.publishedYear ?? '—'} />
            <Row label="Languages" value={formatLanguageCodes(book.languageCodes)} />
            <Row label="Editions" value={book.editionCount ? `${book.editionCount}` : 'Not listed'} />
          </CardContent>
        </Card>

        {/* Availability card */}
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

      {(book.synopsis || visibleSubjects.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tags size={16} className="text-accent" /> Discovery Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {book.synopsis && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">Synopsis</p>
                <p className="text-sm leading-6 text-text-primary">{book.synopsis}</p>
              </div>
            )}
            {visibleSubjects.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {visibleSubjects.map((subject) => (
                    <Badge key={subject} variant="secondary">{subject}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoTile icon={Star} label="Rating" value={formatRating(book)} />
        <InfoTile icon={Library} label="Popularity" value={formatPopularity(book)} />
        <InfoTile icon={Languages} label="Languages" value={formatLanguageCodes(book.languageCodes)} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-text-secondary font-medium">{label}</span>
      <span className="text-text-primary">{value}</span>
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
