import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from '@/lib/apiErrors';

describe('getApiErrorMessage', () => {
  it('formats max-book-limit errors for users', () => {
    const message = getApiErrorMessage(
      {
        response: {
          data: {
            message: 'Member cannot borrow more than 5 books at once',
            maxBooks: 5,
          },
        },
      },
      'Fallback error',
    );

    expect(message).toBe('Member cannot borrow more than 5. Return books first or contact librarian');
  });
});
