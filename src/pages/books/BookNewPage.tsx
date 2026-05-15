import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { booksService } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BookNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', categoryId: '',
    totalCopies: '1', publisher: '', publishedYear: '',
  });
  const [error, setError] = useState('');

  const { data: categories } = useQuery({ queryKey: QUERY_KEYS.categories, queryFn: booksService.getCategories });

  const mutation = useMutation({
    mutationFn: () => booksService.create({
      title: form.title, author: form.author, isbn: form.isbn,
      categoryId: Number(form.categoryId), totalCopies: Number(form.totalCopies),
      publisher: form.publisher || undefined,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books }); navigate('/books'); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      setError(e.response?.data?.message ?? 'Failed to create book'),
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Add Book</h1>
        <p className="text-text-secondary text-sm mt-0.5">Fill in the details to add a new book to the catalogue</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Book Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Title <span className="text-danger">*</span></Label>
              <Input value={form.title} onChange={set('title')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Author <span className="text-danger">*</span></Label>
              <Input value={form.author} onChange={set('author')} required />
            </div>
            <div className="space-y-1.5">
              <Label>ISBN <span className="text-danger">*</span></Label>
              <Input value={form.isbn} onChange={set('isbn')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Category <span className="text-danger">*</span></Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(categories?.data as { data?: { id: number; name: string }[] })?.data?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Total Copies <span className="text-danger">*</span></Label>
              <Input type="number" min="1" value={form.totalCopies} onChange={set('totalCopies')} />
            </div>
            <div className="space-y-1.5">
              <Label>Publisher <span className="text-text-secondary text-xs">(optional)</span></Label>
              <Input value={form.publisher} onChange={set('publisher')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Published Year <span className="text-text-secondary text-xs">(optional)</span></Label>
              <Input type="number" value={form.publishedYear} onChange={set('publishedYear')} className="sm:max-w-[50%]" />
            </div>
          </div>

          {error && (
            <div className="border-l-4 border-danger bg-danger/5 px-4 py-2.5 rounded-r-md">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Book'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/books')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
