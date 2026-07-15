import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { booksService, type BookCategory } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BookForm from '@/components/books/BookForm';
import { toast } from 'sonner';

export default function BookNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: categories } = useQuery({ queryKey: QUERY_KEYS.categories, queryFn: () => booksService.getCategories() });

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof booksService.create>[0]) => booksService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
      toast.success('Book created');
      navigate('/books');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      const message = e.response?.data?.message ?? 'Failed to create book';
      setError(message);
      toast.error(message);
    },
  });
  const categoryRows = (categories?.data as { data?: BookCategory[] })?.data ?? [];

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Add Book</h1>
        <p className="text-text-secondary text-sm mt-0.5">Fill in the details to add a new book to the catalogue</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Book Information</CardTitle>
        </CardHeader>
        <CardContent>
          <BookForm
            categories={categoryRows}
            submitLabel="Save Book"
            pendingLabel="Saving..."
            isPending={mutation.isPending}
            error={error}
            onCancel={() => navigate('/books')}
            onSubmit={(payload) => mutation.mutate(payload as Parameters<typeof booksService.create>[0])}
          />
        </CardContent>
      </Card>
    </div>
  );
}
