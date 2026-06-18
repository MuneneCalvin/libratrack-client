interface BookCoverStyle {
  className: string;
  label: string;
}

const baseCoverClass = 'bg-gradient-to-br';

const categoryStyles: Array<{ match: string[]; label: string; className: string }> = [
  {
    match: ['technology', 'computer', 'programming', 'software'],
    label: 'TECH',
    className: 'from-slate-900 via-cyan-900 to-amber-500',
  },
  {
    match: ['science', 'biology', 'chemistry', 'physics'],
    label: 'SCI',
    className: 'from-emerald-900 via-teal-800 to-lime-500',
  },
  {
    match: ['history', 'culture', 'geography'],
    label: 'HIST',
    className: 'from-stone-900 via-red-900 to-amber-600',
  },
  {
    match: ['business', 'economics', 'finance', 'management'],
    label: 'BIZ',
    className: 'from-zinc-900 via-blue-900 to-emerald-500',
  },
  {
    match: ['fiction', 'literature', 'novel', 'story'],
    label: 'FIC',
    className: 'from-violet-950 via-rose-900 to-orange-400',
  },
  {
    match: ['education', 'reference', 'textbook'],
    label: 'REF',
    className: 'from-indigo-950 via-sky-900 to-yellow-400',
  },
];

export function getBookCoverStyle(categoryName?: string): BookCoverStyle {
  const normalized = categoryName?.trim().toLowerCase();

  if (!normalized) {
    return {
      label: 'BOOK',
      className: `${baseCoverClass} from-sidebar-bg via-slate-800 to-accent`,
    };
  }

  const style = categoryStyles.find(({ match }) =>
    match.some((keyword) => normalized.includes(keyword)),
  );

  if (style) {
    return {
      label: style.label,
      className: `${baseCoverClass} ${style.className}`,
    };
  }

  return {
    label: normalized.slice(0, 4).toUpperCase(),
    className: `${baseCoverClass} from-slate-800 via-slate-700 to-accent`,
  };
}
