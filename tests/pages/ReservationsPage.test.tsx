import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import ReservationsPage from '@/pages/reservations/ReservationsPage';
import { server } from '../mocks/handlers';

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <ReservationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function reservation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    memberId: 7,
    memberName: 'Jane Member',
    bookId: 5,
    bookTitle: 'Clean Code',
    bookAuthor: 'Robert Martin',
    bookCoverUrl: null,
    reservedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    status: 'PENDING',
    ...overrides,
  };
}

describe('ReservationsPage pickup flow', () => {
  it('shows approve hold for pending and issue book for ready pickup', async () => {
    server.use(
      http.get('*/api/reservations/', () => HttpResponse.json({
        status: 'success',
        data: [
          reservation(),
          reservation({
            id: 2,
            memberId: 8,
            memberName: 'Ready Member',
            bookId: 6,
            bookTitle: 'Refactoring',
            bookAuthor: 'Martin Fowler',
            status: 'READY_FOR_PICKUP',
          }),
        ],
        meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
      })),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText('Clean Code')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Approve hold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Issue book/i })).toBeInTheDocument();
    expect(screen.getAllByText('Ready for pickup').length).toBeGreaterThan(0);
  });

  it('calls approve endpoint from approve hold action', async () => {
    const user = userEvent.setup();
    let approved = false;
    server.use(
      http.get('*/api/reservations/', () => HttpResponse.json({
        status: 'success',
        data: [reservation()],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      })),
      http.patch('*/api/reservations/1/approve/', () => {
        approved = true;
        return HttpResponse.json({ status: 'success', data: { id: 1, status: 'READY_FOR_PICKUP' } });
      }),
    );

    renderPage();

    await user.click(await screen.findByRole('button', { name: /Approve hold/i }));
    await user.click(screen.getByRole('button', { name: /Approve hold/i }));

    await waitFor(() => expect(approved).toBe(true));
  });

  it('calls issue endpoint from issue book action', async () => {
    const user = userEvent.setup();
    let issued = false;
    server.use(
      http.get('*/api/reservations/', () => HttpResponse.json({
        status: 'success',
        data: [reservation({ status: 'READY_FOR_PICKUP' })],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      })),
      http.patch('*/api/reservations/1/issue/', () => {
        issued = true;
        return HttpResponse.json({ status: 'success', data: { id: 1, status: 'BORROWED' } });
      }),
    );

    renderPage();

    await user.click(await screen.findByRole('button', { name: /Issue book/i }));
    await user.click(screen.getByRole('button', { name: /Issue book/i }));

    await waitFor(() => expect(issued).toBe(true));
  });
});
