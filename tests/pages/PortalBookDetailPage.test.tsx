import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import PortalBookDetailPage from '@/pages/portal/PortalBookDetailPage';
import { server } from '../mocks/handlers';

describe('PortalBookDetailPage', () => {
  it('shows member-safe book details', async () => {
    server.use(
      http.get('*/api/books/5/', () => HttpResponse.json({
        status: 'success',
        data: {
          id: 5,
          title: 'Clean Code',
          author: 'Robert Martin',
          isbn: '123',
          categoryId: 1,
          categoryName: 'Technology',
          totalCopies: 5,
          availableCopies: 2,
          publisher: 'Prentice Hall',
          publishedYear: 2008,
          coverUrl: 'https://covers.example/clean-code.jpg',
          synopsis: 'A practical handbook of software craftsmanship.',
          subjects: ['software', 'programming'],
          languageCodes: ['eng'],
          editionCount: 3,
          ratingAverage: 4.5,
          ratingCount: 120,
          wantToReadCount: 10,
          currentlyReadingCount: 2,
          alreadyReadCount: 300,
        },
      })),
    );

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/portal/books/5']}>
          <Routes>
            <Route path="/portal/books/:id" element={<PortalBookDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Clean Code' })).toBeInTheDocument());
    expect(screen.getByText('A practical handbook of software craftsmanship.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });
});
