import { api } from './api';

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  categoryId: number;
  totalCopies: number;
  availableCopies: number;
  publisher?: string;
  publishedYear?: number;
  coverUrl?: string;
  category: { id: number; name: string };
}

export const booksService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<{ data: Book[]; meta: { page: number; limit: number; total: number; totalPages: number } }>('/books', { params }),
  getById: (id: number) => api.get<{ data: Book }>(`/books/${id}`),
  create: (data: Omit<Book, 'id' | 'availableCopies' | 'category'>) =>
    api.post<{ data: Book }>('/books', data),
  update: (id: number, data: Partial<Book>) => api.patch<{ data: Book }>(`/books/${id}`, data),
  remove: (id: number) => api.delete(`/books/${id}`),
  getCategories: () => api.get<{ data: { id: number; name: string }[] }>('/categories'),
};
