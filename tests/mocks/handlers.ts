import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('*/api/books/', () =>
    HttpResponse.json({
      status: 'success',
      data: [
        { id: 1, title: 'Clean Code', author: 'Robert Martin', isbn: '123', availableCopies: 2, totalCopies: 3, category: { id: 1, name: 'Technology' } },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
  ),
  http.post('*/api/auth/login/', () =>
    HttpResponse.json({ status: 'success', data: { accessToken: 'mock-token' } }),
  ),
  http.get('*/api/auth/me/', () =>
    HttpResponse.json({ status: 'success', data: { id: 1, email: 'admin@test.com', role: 'admin' } }),
  ),
  http.get('*/api/notifications/', () =>
    HttpResponse.json({ status: 'success', data: [] }),
  ),
  http.get('*/api/members/', () =>
    HttpResponse.json({ status: 'success', data: [{ id: 1, fullName: 'Jane Doe', membershipNumber: 'LIB001', joinedAt: new Date().toISOString(), user: { email: 'jane@test.com', isActive: true } }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
  ),
];

export const server = setupServer(...handlers);
