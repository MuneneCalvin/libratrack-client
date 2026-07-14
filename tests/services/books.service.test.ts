import { describe, expect, it, vi, beforeEach } from 'vitest';
import { api } from '@/services/api';
import { booksService } from '@/services/books.service';

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('booksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends available copies equal to total copies when creating a book', () => {
    booksService.create({
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt, David Thomas',
      isbn: '9780201616224',
      categoryId: 3,
      totalCopies: 50,
    });

    expect(api.post).toHaveBeenCalledWith('/books/', expect.objectContaining({
      totalCopies: 50,
      availableCopies: 50,
    }));
  });
});
