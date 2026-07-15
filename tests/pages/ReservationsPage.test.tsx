import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import ReservationsPage from '@/pages/reservations/ReservationsPage';
import { QUERY_KEYS } from '@/lib/constants';
import { server } from '../mocks/handlers';

function renderPage(queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
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

  it('searches ready pickup reservations by visible status label', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/api/reservations/', () => HttpResponse.json({
        status: 'success',
        data: [
          reservation({ bookTitle: 'Clean Code', status: 'PENDING' }),
          reservation({
            id: 2,
            memberName: 'Ready Member',
            bookTitle: 'Refactoring',
            bookAuthor: 'Martin Fowler',
            status: 'READY_FOR_PICKUP',
          }),
        ],
        meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
      })),
    );

    renderPage();

    await screen.findByText('Refactoring');
    await user.type(screen.getByPlaceholderText(/Search by book/i), 'Ready for pickup');

    await waitFor(() => expect(screen.queryByText('Clean Code')).not.toBeInTheDocument());
    expect(screen.getByText('Refactoring')).toBeInTheDocument();
  });

  it('refreshes book availability after approving a hold', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.get('*/api/reservations/', () => HttpResponse.json({
        status: 'success',
        data: [reservation()],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      })),
      http.patch('*/api/reservations/1/approve/', () => HttpResponse.json({
        status: 'success',
        data: { id: 1, status: 'READY_FOR_PICKUP' },
      })),
    );

    renderPage(queryClient);

    await user.click(await screen.findByRole('button', { name: /Approve hold/i }));
    await user.click(screen.getByRole('button', { name: /Approve hold/i }));

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.books }));
  });

  it('refreshes book availability after cancelling a ready pickup hold', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    server.use(
      http.get('*/api/reservations/', () => HttpResponse.json({
        status: 'success',
        data: [reservation({ status: 'READY_FOR_PICKUP' })],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      })),
      http.patch('*/api/reservations/1/cancel/', () => HttpResponse.json({
        status: 'success',
        data: { id: 1, status: 'CANCELLED' },
      })),
    );

    renderPage(queryClient);

    await user.click(await screen.findByRole('button', { name: /Cancel/i }));
    const dialog = screen.getByRole('dialog', { name: /Cancel reservation/i });
    const cancelButtons = within(dialog).getAllByRole('button', { name: /Cancel/i });
    await user.click(cancelButtons[cancelButtons.length - 1]);

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.books }));
  });
});
