import { describe, expect, it } from 'vitest';
import { getBookCoverStyle } from '@/lib/bookCover';

describe('getBookCoverStyle', () => {
  it('returns a compact category label for known categories', () => {
    expect(getBookCoverStyle('Technology').label).toBe('TECH');
    expect(getBookCoverStyle('Science').label).toBe('SCI');
  });

  it('returns a stable fallback for missing categories', () => {
    expect(getBookCoverStyle(undefined).label).toBe('BOOK');
  });
});
