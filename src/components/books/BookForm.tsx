import { useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import type { Book, BookCategory } from '@/services/books.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, ImagePlus } from 'lucide-react';

export interface BookFormValues {
  title: string;
  author: string;
  isbn: string;
  categoryId: string;
  totalCopies: string;
  availableCopies: string;
  publisher: string;
  publishedYear: string;
  coverUrl: string;
  openLibraryWorkKey: string;
  synopsis: string;
  subjects: string;
  languageCodes: string;
  editionCount: string;
  ratingAverage: string;
  ratingCount: string;
  wantToReadCount: string;
  currentlyReadingCount: string;
  alreadyReadCount: string;
}

interface BookFormProps {
  initialValues?: Partial<Book>;
  categories: BookCategory[];
  submitLabel: string;
  pendingLabel: string;
  isPending?: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (payload: Partial<Book>) => void;
}

const emptyValues: BookFormValues = {
  title: '',
  author: '',
  isbn: '',
  categoryId: '',
  totalCopies: '1',
  availableCopies: '1',
  publisher: '',
  publishedYear: '',
  coverUrl: '',
  openLibraryWorkKey: '',
  synopsis: '',
  subjects: '',
  languageCodes: '',
  editionCount: '',
  ratingAverage: '',
  ratingCount: '',
  wantToReadCount: '',
  currentlyReadingCount: '',
  alreadyReadCount: '',
};

export default function BookForm({
  initialValues,
  categories,
  submitLabel,
  pendingLabel,
  isPending = false,
  error,
  onCancel,
  onSubmit,
}: BookFormProps) {
  const [form, setForm] = useState<BookFormValues>(() => toFormValues(initialValues));
  const [coverPreview, setCoverPreview] = useState('');
  const [coverFileName, setCoverFileName] = useState('');
  const previewUrl = coverPreview || form.coverUrl;

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === form.categoryId),
    [categories, form.categoryId],
  );

  const set = (key: keyof BookFormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const handleCoverFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCoverPreview('');
      setCoverFileName('');
      return;
    }

    setCoverFileName(file.name);
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    onSubmit(toPayload(form));
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-5">
        <section className="space-y-4 rounded-md border border-border bg-background p-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Core details</h2>
            <p className="mt-1 text-xs text-text-secondary">Catalogue identity, copy counts, and category.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="book-title" label="Title" required>
              <Input id="book-title" value={form.title} onChange={set('title')} required />
            </Field>
            <Field id="book-author" label="Author" required>
              <Input id="book-author" value={form.author} onChange={set('author')} required />
            </Field>
            <Field id="book-isbn" label="ISBN" required>
              <Input id="book-isbn" value={form.isbn} onChange={set('isbn')} required />
            </Field>
            <Field id="book-category" label="Category" required>
              <Select value={form.categoryId} onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value }))}>
                <SelectTrigger id="book-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="book-total-copies" label="Total copies" required>
              <Input id="book-total-copies" type="number" min="1" value={form.totalCopies} onChange={set('totalCopies')} />
            </Field>
            <Field id="book-available-copies" label="Available copies">
              <Input id="book-available-copies" type="number" min="0" value={form.availableCopies} onChange={set('availableCopies')} />
            </Field>
            <Field id="book-publisher" label="Publisher">
              <Input id="book-publisher" value={form.publisher} onChange={set('publisher')} />
            </Field>
            <Field id="book-published-year" label="Published year">
              <Input id="book-published-year" type="number" value={form.publishedYear} onChange={set('publishedYear')} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-md border border-border bg-background p-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Cover and description</h2>
            <p className="mt-1 text-xs text-text-secondary">Cover file is preview-only; saved record uses cover URL.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field id="book-cover-url" label="Cover URL">
              <Input id="book-cover-url" value={form.coverUrl} onChange={set('coverUrl')} placeholder="https://covers.openlibrary.org/..." />
            </Field>
            <Field id="book-cover-file" label="Cover file preview">
              <Input id="book-cover-file" type="file" accept="image/*" onChange={handleCoverFile} />
            </Field>
            <Field id="book-openlibrary-key" label="Open Library work key">
              <Input id="book-openlibrary-key" value={form.openLibraryWorkKey} onChange={set('openLibraryWorkKey')} placeholder="/works/OL..." />
            </Field>
            <Field id="book-subjects" label="Subjects / tags">
              <Input id="book-subjects" value={form.subjects} onChange={set('subjects')} placeholder="fiction, history, science" />
            </Field>
            <Field id="book-languages" label="Language codes">
              <Input id="book-languages" value={form.languageCodes} onChange={set('languageCodes')} placeholder="eng, fre, swa" />
            </Field>
            <Field id="book-edition-count" label="Edition count">
              <Input id="book-edition-count" type="number" min="0" value={form.editionCount} onChange={set('editionCount')} />
            </Field>
            <Field id="book-synopsis" label="Synopsis" className="lg:col-span-2">
              <Textarea id="book-synopsis" value={form.synopsis} onChange={set('synopsis')} rows={5} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-md border border-border bg-background p-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Ratings and popularity</h2>
            <p className="mt-1 text-xs text-text-secondary">Open Library enrichment fields used for sorting and recommendations.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Field id="book-rating-average" label="Average rating">
              <Input id="book-rating-average" type="number" min="0" max="5" step="0.1" value={form.ratingAverage} onChange={set('ratingAverage')} />
            </Field>
            <Field id="book-rating-count" label="Rating count">
              <Input id="book-rating-count" type="number" min="0" value={form.ratingCount} onChange={set('ratingCount')} />
            </Field>
            <Field id="book-want-count" label="Want to read">
              <Input id="book-want-count" type="number" min="0" value={form.wantToReadCount} onChange={set('wantToReadCount')} />
            </Field>
            <Field id="book-reading-count" label="Currently reading">
              <Input id="book-reading-count" type="number" min="0" value={form.currentlyReadingCount} onChange={set('currentlyReadingCount')} />
            </Field>
            <Field id="book-read-count" label="Already read">
              <Input id="book-read-count" type="number" min="0" value={form.alreadyReadCount} onChange={set('alreadyReadCount')} />
            </Field>
          </div>
        </section>

        {error && (
          <div className="rounded-r-md border-l-4 border-danger bg-danger/5 px-4 py-2.5">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? pendingLabel : submitLabel}
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>

      <aside className="h-fit rounded-md border border-border bg-background p-4">
        <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-accent/10">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-accent">
              <ImagePlus size={42} />
              <p className="px-4 text-center text-xs font-medium">Cover preview</p>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-1">
          <p className="line-clamp-2 text-sm font-semibold text-text-primary">{form.title || 'Untitled book'}</p>
          <p className="line-clamp-1 text-xs text-text-secondary">{form.author || 'Unknown author'}</p>
          <p className="text-xs text-text-secondary">{selectedCategory?.name ?? 'No category selected'}</p>
          {coverFileName && <p className="mt-2 truncate text-xs text-accent">{coverFileName}</p>}
          {!previewUrl && <BookOpen size={16} className="mt-2 text-text-secondary" />}
        </div>
      </aside>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-danger">*</span>}
      </Label>
      {children}
    </div>
  );
}

function toFormValues(book?: Partial<Book>): BookFormValues {
  if (!book) return emptyValues;
  return {
    title: book.title ?? '',
    author: book.author ?? '',
    isbn: book.isbn ?? '',
    categoryId: book.categoryId ? String(book.categoryId) : '',
    totalCopies: book.totalCopies != null ? String(book.totalCopies) : '1',
    availableCopies: book.availableCopies != null ? String(book.availableCopies) : '1',
    publisher: book.publisher ?? '',
    publishedYear: book.publishedYear != null ? String(book.publishedYear) : '',
    coverUrl: book.coverUrl ?? '',
    openLibraryWorkKey: book.openLibraryWorkKey ?? '',
    synopsis: book.synopsis ?? '',
    subjects: (book.subjects ?? []).join(', '),
    languageCodes: (book.languageCodes ?? []).join(', '),
    editionCount: book.editionCount != null ? String(book.editionCount) : '',
    ratingAverage: book.ratingAverage != null ? String(book.ratingAverage) : '',
    ratingCount: book.ratingCount != null ? String(book.ratingCount) : '',
    wantToReadCount: book.wantToReadCount != null ? String(book.wantToReadCount) : '',
    currentlyReadingCount: book.currentlyReadingCount != null ? String(book.currentlyReadingCount) : '',
    alreadyReadCount: book.alreadyReadCount != null ? String(book.alreadyReadCount) : '',
  };
}

function toPayload(form: BookFormValues): Partial<Book> {
  return {
    title: form.title,
    author: form.author,
    isbn: form.isbn,
    categoryId: Number(form.categoryId),
    totalCopies: Number(form.totalCopies),
    availableCopies: Number(form.availableCopies || form.totalCopies),
    publisher: optionalString(form.publisher),
    publishedYear: optionalNumber(form.publishedYear),
    coverUrl: optionalString(form.coverUrl),
    openLibraryWorkKey: optionalString(form.openLibraryWorkKey),
    synopsis: optionalString(form.synopsis),
    subjects: csv(form.subjects),
    languageCodes: csv(form.languageCodes),
    editionCount: optionalNumber(form.editionCount),
    ratingAverage: optionalNumber(form.ratingAverage),
    ratingCount: optionalNumber(form.ratingCount),
    wantToReadCount: optionalNumber(form.wantToReadCount),
    currentlyReadingCount: optionalNumber(form.currentlyReadingCount),
    alreadyReadCount: optionalNumber(form.alreadyReadCount),
  };
}

function optionalString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  return Number(value);
}

function csv(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}
