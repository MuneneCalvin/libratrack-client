import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { booksService, type Book, type BookCategory } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BookForm from '@/components/books/BookForm';
import { toast } from 'sonner';

export default function BookEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: bookData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.book(Number(id)),
    queryFn: () => booksService.getById(Number(id)),
  });
  const { data: categories } = useQuery({ queryKey: QUERY_KEYS.categories, queryFn: () => booksService.getCategories() });

  const mutation = useMutation({
    mutationFn: (payload: Partial<Book>) => booksService.update(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
      toast.success('Book updated');
      navigate('/books');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      const message = e.response?.data?.message ?? 'Failed to update book';
      setError(message);
      toast.error(message);
    },
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const book = bookData?.data?.data;
  const categoryRows = (categories?.data as { data?: BookCategory[] })?.data ?? [];

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Edit Book</h1>
        <p className="text-text-secondary text-sm mt-0.5">Update the book information below</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Book Information</CardTitle>
        </CardHeader>
        <CardContent>
          <BookForm
            initialValues={book}
            categories={categoryRows}
            submitLabel="Save Changes"
            pendingLabel="Saving..."
            isPending={mutation.isPending}
            error={error}
            onCancel={() => navigate('/books')}
            onSubmit={(payload) => mutation.mutate(payload)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
