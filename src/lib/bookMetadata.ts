import type { Book } from '@/services/books.service';

const LANGUAGE_NAMES: Record<string, string> = {
  eng: 'English',
  fre: 'French',
  fra: 'French',
  spa: 'Spanish',
  ger: 'German',
  deu: 'German',
  ita: 'Italian',
  por: 'Portuguese',
  rus: 'Russian',
  ara: 'Arabic',
  chi: 'Chinese',
  zho: 'Chinese',
  jpn: 'Japanese',
  kor: 'Korean',
  hin: 'Hindi',
  lat: 'Latin',
  dut: 'Dutch',
  nld: 'Dutch',
};

export function formatLanguageCodes(codes?: string[]) {
  if (!codes?.length) return 'Not listed';
  return codes
    .slice(0, 4)
    .map((code) => LANGUAGE_NAMES[code.toLowerCase()] ?? code.toUpperCase())
    .join(', ');
}

export function formatRating(book: Book) {
  if (!book.ratingAverage || !book.ratingCount) return 'No ratings yet';
  return `${book.ratingAverage.toFixed(1)}/5 from ${formatCompactCount(book.ratingCount)} ratings`;
}

export function getPopularityCount(book: Book) {
  return (book.wantToReadCount ?? 0) + (book.currentlyReadingCount ?? 0) + (book.alreadyReadCount ?? 0);
}

export function formatPopularity(book: Book) {
  const count = getPopularityCount(book);
  return count > 0 ? `${formatCompactCount(count)} reader signals` : 'No popularity data';
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
