import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { booksService } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil } from 'lucide-react';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: QUERY_KEYS.book(Number(id)), queryFn: () => booksService.getById(Number(id)) });

  if (isLoading) return <Skeleton className="h-64 w-full max-w-xl" />;
  const book = data?.data?.data;
  if (!book) return <p className="text-danger">Book not found.</p>;

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{book.title}</h1>
        <Button variant="outline" size="sm" onClick={() => navigate(`/books/${id}/edit`)} className="gap-2">
          <Pencil size={14} /> Edit
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-3 text-sm">
          <Row label="Author" value={book.author} />
          <Row label="ISBN" value={book.isbn} />
          <Row label="Category" value={<Badge variant="secondary">{book.category.name}</Badge>} />
          <Row label="Publisher" value={book.publisher ?? '—'} />
          <Row label="Published Year" value={book.publishedYear ?? '—'} />
          <Row label="Total Copies" value={book.totalCopies} />
          <Row label="Available" value={<span className={book.availableCopies === 0 ? 'text-danger font-medium' : 'text-success font-medium'}>{book.availableCopies}</span>} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
