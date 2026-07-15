import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import BookNewPage from '@/pages/books/BookNewPage';
import BookEditPage from '@/pages/books/BookEditPage';
import { server } from '../mocks/handlers';

function renderWithProviders(ui: React.ReactNode, initialEntries = ['/books/new']) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('book form pages', () => {
  it('shows catalog enrichment fields when adding a book', async () => {
    server.use(
      http.get('*/api/categories/', () => HttpResponse.json({
        status: 'success',
        data: [{ id: 3, name: 'Technology' }],
      })),
    );

    renderWithProviders(<BookNewPage />);

    expect(await screen.findByLabelText('Cover URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Cover file preview')).toBeInTheDocument();
    expect(screen.getByLabelText('Synopsis')).toBeInTheDocument();
    expect(screen.getByLabelText('Subjects / tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Language codes')).toBeInTheDocument();
    expect(screen.getByLabelText('Average rating')).toBeInTheDocument();
  });

  it('prefills catalog enrichment fields when editing a book', async () => {
    server.use(
      http.get('*/api/categories/', () => HttpResponse.json({
        status: 'success',
        data: [{ id: 3, name: 'Technology' }],
      })),
      http.get('*/api/books/42/', () => HttpResponse.json({
        status: 'success',
        data: {
          id: 42,
          title: 'Domain-Driven Design',
          author: 'Eric Evans',
          isbn: '9780321125217',
          categoryId: 3,
          categoryName: 'Technology',
          totalCopies: 5,
          availableCopies: 4,
          publisher: 'Addison-Wesley',
          publishedYear: 2003,
          coverUrl: 'https://covers.openlibrary.org/b/id/123-L.jpg',
          synopsis: 'Tackles complex software models.',
          subjects: ['software architecture', 'design'],
          languageCodes: ['eng'],
          editionCount: 8,
          ratingAverage: 4.2,
          ratingCount: 120,
          wantToReadCount: 50,
          currentlyReadingCount: 12,
          alreadyReadCount: 400,
        },
      })),
    );

    renderWithProviders(
      <Routes>
        <Route path="/books/:id/edit" element={<BookEditPage />} />
      </Routes>,
      ['/books/42/edit'],
    );

    await waitFor(() => expect(screen.getByDisplayValue('Domain-Driven Design')).toBeInTheDocument());
    expect(screen.getByDisplayValue('https://covers.openlibrary.org/b/id/123-L.jpg')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tackles complex software models.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('software architecture, design')).toBeInTheDocument();
    expect(screen.getByDisplayValue('eng')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4.2')).toBeInTheDocument();
  });
});
