import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import PortalReservationsPage from '@/pages/portal/PortalReservationsPage';
import { useAuthStore } from '@/store/auth.store';
import { server } from '../mocks/handlers';

function renderPage() {
  useAuthStore.getState().setAuth(
    { id: 2, email: 'member@test.com', role: 'member', memberId: 7 },
    'token',
  );

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <PortalReservationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PortalReservationsPage', () => {
  it('opens a wide reservation dialog without horizontal overflow', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/api/members/7/reservations/', () => HttpResponse.json({ status: 'success', data: [] })),
      http.get('*/api/books/', () => HttpResponse.json({
        status: 'success',
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      })),
    );

    renderPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'My Reservations' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'New Reservation' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('sm:max-w-3xl');
    expect(dialog).toHaveClass('overflow-x-hidden');
    expect(screen.getByRole('button', { name: 'Reserve' })).toBeInTheDocument();
  });

  it('shows ready-for-pickup reservations with pickup deadline and no cancel action', async () => {
    server.use(
      http.get('*/api/members/7/reservations/', () => HttpResponse.json({
        status: 'success',
        data: [{
          id: 9,
          bookTitle: 'Clean Code',
          bookAuthor: 'Robert Martin',
          bookCoverUrl: null,
          status: 'READY_FOR_PICKUP',
          reservedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        }],
      })),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText('Clean Code')).toBeInTheDocument());
    expect(screen.getByText('Ready for pickup')).toBeInTheDocument();
    expect(screen.getByText(/Pick up by/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument();
  });
});
