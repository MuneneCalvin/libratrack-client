import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { booksService, type Book } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function BooksPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.books, page, q],
    queryFn: () => booksService.getAll({ page, limit: 20, q: q || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: booksService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books }),
  });

  const columns = [
    { key: 'title', header: 'Title', render: (b: Book) => <span className="font-medium">{b.title}</span> },
    { key: 'author', header: 'Author', render: (b: Book) => b.author },
    { key: 'isbn', header: 'ISBN', render: (b: Book) => <span className="text-text-secondary text-sm">{b.isbn}</span> },
    { key: 'category', header: 'Category', render: (b: Book) => <Badge variant="secondary">{b.categoryName}</Badge> },
    { key: 'copies', header: 'Available', render: (b: Book) => (
      <span className={b.availableCopies === 0 ? 'text-danger' : 'text-success'}>
        {b.availableCopies}/{b.totalCopies}
      </span>
    )},
    { key: 'actions', header: '', render: (b: Book) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="icon" aria-label="View book" onClick={() => navigate(`/books/${b.id}`)}>
          <Eye size={15} />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Edit book" onClick={() => navigate(`/books/${b.id}/edit`)}>
          <Pencil size={15} />
        </Button>
        {user?.role === 'admin' && (
          <Button variant="ghost" size="icon" className="text-danger" onClick={() => { if (confirm('Delete this book?')) deleteMutation.mutate(b.id); }}>
            <Trash2 size={15} />
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Books</h1>
        <Button onClick={() => navigate('/books/new')} className="gap-2">
          <Plus size={16} /> Add Book
        </Button>
      </div>
      <Input placeholder="Search by title, author, ISBN…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-sm" />
      <DataTable
        columns={columns}
        data={(data?.data as { data?: Book[] })?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={(data?.data as { meta?: { totalPages?: number } })?.meta?.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
