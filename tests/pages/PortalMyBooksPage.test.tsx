import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import PortalMyBooksPage from '@/pages/portal/PortalMyBooksPage';
import { useAuthStore } from '@/store/auth.store';
import { server } from '../mocks/handlers';

describe('PortalMyBooksPage', () => {
  it('groups current, due soon, fines, and returned books for a member', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    const returned = new Date();
    returned.setDate(returned.getDate() - 1);

    useAuthStore.getState().setAuth(
      { id: 2, email: 'member@test.com', role: 'member', memberId: 7 },
      'token',
    );
    server.use(
      http.get('*/api/members/7/transactions/', () => HttpResponse.json({
        status: 'success',
        data: [
          {
            id: 11,
            borrowedAt: new Date().toISOString(),
            dueDate: soon.toISOString(),
            returnedAt: null,
            status: 'ACTIVE',
            items: [{ id: 91, returnedAt: null, book: { id: 5, title: 'Clean Code', author: 'Robert Martin', coverUrl: null } }],
          },
          {
            id: 12,
            borrowedAt: new Date().toISOString(),
            dueDate: returned.toISOString(),
            returnedAt: returned.toISOString(),
            status: 'RETURNED',
            items: [{ id: 92, returnedAt: returned.toISOString(), book: { id: 6, title: 'Refactoring', author: 'Martin Fowler', coverUrl: null } }],
          },
        ],
      })),
      http.get('*/api/members/7/fines/', () => HttpResponse.json({
        status: 'success',
        data: [{ id: 1, amount: 15, reason: 'Late return', isPaid: false, isWaived: false, createdAt: new Date().toISOString() }],
      })),
    );

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PortalMyBooksPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'My Books' })).toBeInTheDocument());
    expect(screen.getAllByText('Clean Code')).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /Clean Code/i })[0]).toHaveAttribute('href', '/portal/books/5');
    expect(screen.getAllByText('Due soon').length).toBeGreaterThan(0);
    expect(screen.getByText('Refactoring')).toBeInTheDocument();
    expect(screen.getAllByText(/15\.00/).length).toBeGreaterThan(0);
  });
});
