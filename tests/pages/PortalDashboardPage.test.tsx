import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import PortalDashboardPage from '@/pages/portal/PortalDashboardPage';
import { useAuthStore } from '@/store/auth.store';
import { server } from '../mocks/handlers';

describe('PortalDashboardPage', () => {
  it('shows borrowed book cover images in currently borrowed section', async () => {
    const due = new Date();
    due.setDate(due.getDate() + 7);

    useAuthStore.getState().setAuth(
      { id: 2, email: 'member@test.com', role: 'member', memberId: 7 },
      'token',
    );
    server.use(
      http.get('*/api/members/7/', () => HttpResponse.json({ status: 'success', data: { id: 7, fullName: 'Test Member' } })),
      http.get('*/api/members/7/transactions/', () => HttpResponse.json({
        status: 'success',
        data: [{
          id: 11,
          dueDate: due.toISOString(),
          returnedAt: null,
          status: 'ACTIVE',
          items: [{
            id: 91,
            returnedAt: null,
            book: {
              id: 5,
              title: 'Clean Code',
              author: 'Robert Martin',
              coverUrl: 'https://covers.example/clean-code.jpg',
            },
          }],
        }],
      })),
      http.get('*/api/members/7/fines/', () => HttpResponse.json({ status: 'success', data: [] })),
      http.get('*/api/members/7/reservations/', () => HttpResponse.json({ status: 'success', data: [] })),
      http.get('*/api/books/', () => HttpResponse.json({ status: 'success', data: [], meta: { page: 1, limit: 8, total: 0, totalPages: 1 } })),
    );

    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PortalDashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Clean Code')).toBeInTheDocument());
    expect(container.querySelector('img[src="https://covers.example/clean-code.jpg"]')).toBeInTheDocument();
  });

  it('shows ready pickup reservations separately from borrowed books', async () => {
    useAuthStore.getState().setAuth(
      { id: 2, email: 'member@test.com', role: 'member', memberId: 7 },
      'token',
    );
    server.use(
      http.get('*/api/members/7/', () => HttpResponse.json({ status: 'success', data: { id: 7, fullName: 'Test Member' } })),
      http.get('*/api/members/7/transactions/', () => HttpResponse.json({ status: 'success', data: [] })),
      http.get('*/api/members/7/fines/', () => HttpResponse.json({ status: 'success', data: [] })),
      http.get('*/api/members/7/reservations/', () => HttpResponse.json({
        status: 'success',
        data: [{
          id: 20,
          bookTitle: 'Clean Code',
          bookAuthor: 'Robert Martin',
          bookCoverUrl: 'https://covers.example/clean-code.jpg',
          status: 'READY_FOR_PICKUP',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        }],
      })),
      http.get('*/api/books/', () => HttpResponse.json({ status: 'success', data: [], meta: { page: 1, limit: 8, total: 0, totalPages: 1 } })),
    );

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PortalDashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Ready for pickup')).toBeInTheDocument());
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText(/Pick up by/i)).toBeInTheDocument();
  });
});
