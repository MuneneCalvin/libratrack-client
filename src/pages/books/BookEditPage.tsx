import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { booksService } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', author: '', isbn: '', categoryId: '', totalCopies: '1', publisher: '', publishedYear: '' });
  const [error, setError] = useState('');

  const { data: bookData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.book(Number(id)),
    queryFn: () => booksService.getById(Number(id)),
  });
  const { data: categories } = useQuery({ queryKey: QUERY_KEYS.categories, queryFn: booksService.getCategories });

  useEffect(() => {
    const b = bookData?.data?.data;
    if (b) setForm({ title: b.title, author: b.author, isbn: b.isbn, categoryId: String(b.categoryId), totalCopies: String(b.totalCopies), publisher: b.publisher ?? '', publishedYear: b.publishedYear ? String(b.publishedYear) : '' });
  }, [bookData]);

  const mutation = useMutation({
    mutationFn: () => booksService.update(Number(id), { title: form.title, author: form.author, isbn: form.isbn, categoryId: Number(form.categoryId), totalCopies: Number(form.totalCopies), publisher: form.publisher || undefined, publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books }); navigate('/books'); },
    onError: (e: { response?: { data?: { message?: string } } }) => setError(e.response?.data?.message ?? 'Failed to update book'),
  });

  if (isLoading) return <Skeleton className="h-96 w-full max-w-xl" />;

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Edit Book</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={set('title')} /></div>
          <div className="space-y-1"><Label>Author</Label><Input value={form.author} onChange={set('author')} /></div>
          <div className="space-y-1"><Label>ISBN</Label><Input value={form.isbn} onChange={set('isbn')} /></div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(categories?.data as { data?: { id: number; name: string }[] })?.data?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Total Copies</Label><Input type="number" min="1" value={form.totalCopies} onChange={set('totalCopies')} /></div>
          <div className="space-y-1"><Label>Publisher</Label><Input value={form.publisher} onChange={set('publisher')} /></div>
          <div className="space-y-1"><Label>Published Year</Label><Input type="number" value={form.publishedYear} onChange={set('publishedYear')} /></div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save Changes'}</Button>
            <Button variant="outline" onClick={() => navigate('/books')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
