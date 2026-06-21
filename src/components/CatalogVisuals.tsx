import { BookOpen, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Book } from '@/services/books.service';

function getInitials(name?: string) {
  if (!name) return 'LT';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function BookThumb({ book, className }: { book?: Partial<Book>; className?: string }) {
  return (
    <div className={cn('grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-accent/10 text-accent shadow-sm', className)}>
      {book?.coverUrl ? (
        <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <BookOpen size={17} />
      )}
    </div>
  );
}

export function MemberAvatar({ name, className }: { name?: string; className?: string }) {
  return (
    <div className={cn('grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm ring-2 ring-accent/15 dark:bg-accent/20 dark:text-accent', className)}>
      {getInitials(name)}
    </div>
  );
}

export function RatingPill({ rating, count }: { rating?: number | null; count?: number }) {
  if (!rating) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-hover px-2.5 py-1 text-xs font-medium text-text-secondary">
        <Star size={12} /> Unrated
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-text-primary">
      <Star size={12} className="fill-accent text-accent" />
      {rating.toFixed(1)}
      {count ? <span className="font-normal text-text-secondary">({count})</span> : null}
    </span>
  );
}
