import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { booksService, type Book } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Pencil, Trash2, BookOpen, Layers3, Star } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { BookThumb, RatingPill } from '@/components/CatalogVisuals';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TableActionButton, TableActionGroup } from '@/components/TableActions';

export default function BooksPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.books, page, q, category, sort],
    queryFn: () => booksService.getAll({
      page,
      limit: 20,
      q: q || undefined,
      category: category || undefined,
      sort: sort || undefined,
    }),
  });
  const { data: categoriesData } = useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: booksService.getCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: booksService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
      setBookToDelete(null);
      toast.success('Book deleted');
    },
    onError: () => {
      toast.error('Failed to delete book');
    },
  });

  const columns = [
    { key: 'title', header: 'Title', sortValue: (b: Book) => b.title, className: 'min-w-[20rem] max-w-[26rem]', render: (b: Book) => (
      <div className="flex items-center gap-3">
        <BookThumb book={b} />
        <div className="min-w-0">
          <span className="line-clamp-2 font-medium">{b.title}</span>
          {b.subjects && b.subjects.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {b.subjects.slice(0, 2).map((subject) => (
                <Badge key={subject} variant="outline" className="text-[0.65rem]">{subject}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    ) },
    {
      key: 'author',
      header: 'Author',
      sortValue: (b: Book) => b.author,
      className: 'max-w-[14rem]',
      headerClassName: 'w-[14rem]',
      render: (b: Book) => <span className="block truncate" title={b.author}>{b.author}</span>,
    },
    { key: 'publishedYear', header: 'Year', sortValue: (b: Book) => b.publishedYear ?? 0, render: (b: Book) => <span className="text-text-secondary text-sm">{b.publishedYear || 'N/A'}</span> },
    { key: 'isbn', header: 'ISBN', sortValue: (b: Book) => b.isbn, render: (b: Book) => <span className="text-text-secondary text-sm">{b.isbn}</span> },
    { key: 'category', header: 'Category', sortValue: (b: Book) => b.categoryName, render: (b: Book) => <Badge variant="secondary">{b.categoryName}</Badge> },
    { key: 'rating', header: 'Rating', sortValue: (b: Book) => b.ratingAverage ?? 0, render: (b: Book) => <RatingPill rating={b.ratingAverage} count={b.ratingCount} /> },
    { key: 'editions', header: 'Editions', sortValue: (b: Book) => b.editionCount ?? 0, render: (b: Book) => <span className="text-text-secondary text-sm">{b.editionCount || 0}</span> },
    { key: 'copies', header: 'Available', sortValue: (b: Book) => b.availableCopies, render: (b: Book) => (
      <span className={b.availableCopies === 0 ? 'text-danger' : 'text-success'}>
        {b.availableCopies}/{b.totalCopies}
      </span>
    )},
    { key: 'actions', header: '', render: (b: Book) => (
      <TableActionGroup>
        <TableActionButton label="View" icon={Eye} tone="neutral" iconOnly onClick={() => navigate(`/books/${b.id}`)} />
        <TableActionButton label="Edit" icon={Pencil} tone="accent" iconOnly onClick={() => navigate(`/books/${b.id}/edit`)} />
        {user?.role === 'admin' && (
          <TableActionButton label="Delete" icon={Trash2} tone="danger" iconOnly onClick={() => setBookToDelete(b)} />
        )}
      </TableActionGroup>
    )},
  ];
  const books = (data?.data as { data?: Book[] })?.data ?? [];
  const meta = (data?.data as { meta?: { totalPages?: number; total?: number } })?.meta;
  const categories = categoriesData?.data?.data ?? [];
  const visibleCopies = books.reduce((sum, book) => sum + book.availableCopies, 0);
  const ratedBooks = books.filter((book) => book.ratingAverage);

  return (
    <>
    <ConfirmDialog
      open={!!bookToDelete}
      title="Delete book?"
      description={bookToDelete ? `This permanently removes "${bookToDelete.title}" from the catalogue. This action cannot be undone.` : ''}
      confirmLabel="Delete book"
      tone="danger"
      isPending={deleteMutation.isPending}
      onOpenChange={(open) => !open && setBookToDelete(null)}
      onConfirm={() => bookToDelete && deleteMutation.mutate(bookToDelete.id)}
    />
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Books</h1>
          <p className="mt-1 text-sm text-text-secondary">Search, audit, and manage the full library catalog.</p>
        </div>
        <Button onClick={() => navigate('/books/new')} className="w-full gap-2 sm:w-auto">
          <Plus size={16} /> Add Book
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={BookOpen} label="Matching titles" value={meta?.total ?? books.length} />
        <MetricCard icon={Layers3} label="Visible available copies" value={visibleCopies} />
        <MetricCard icon={Star} label="Rated in current view" value={ratedBooks.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(16rem,1fr)_14rem_14rem] gap-3 rounded-md border border-border bg-surface p-3">
        <Input
          placeholder="Search by title, author, ISBN…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="w-full"
        />
        <Select value={category || 'ALL'} onValueChange={(value) => { setCategory(value === 'ALL' ? '' : value); setPage(1); }}>
          <SelectTrigger className="w-full" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((cat) => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort || 'NEWEST'} onValueChange={(value) => { setSort(value === 'NEWEST' ? '' : value); setPage(1); }}>
          <SelectTrigger className="w-full" aria-label="Sort books">
            <SelectValue placeholder="Newest first" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NEWEST">Newest first</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="rating">Highest rating</SelectItem>
            <SelectItem value="most_read">Most read</SelectItem>
            <SelectItem value="popular">Most popular</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={books}
        isLoading={isLoading}
        page={page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
      />
    </div>
    </>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-accent/10 p-2">
          <Icon size={18} className="text-accent" />
        </div>
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="text-xl font-bold text-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
