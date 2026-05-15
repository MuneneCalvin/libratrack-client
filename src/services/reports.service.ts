import { api } from './api';

export const reportsService = {
  getSummary: () => api.get<{
    totalBooks: number; totalMembers: number;
    activeBorrows: number; overdueCount: number; unpaidFinesTotal: number;
  }>('/reports/summary/'),
  getInventory: () => api.get('/reports/inventory/'),
  getBorrowing: () => api.get('/reports/borrowing/'),
  getOverdue: () => api.get('/reports/overdue/'),
  getFines: () => api.get('/reports/fines/'),
  getMembers: () => api.get('/reports/members/'),
  getPopularBooks: () => api.get('/reports/popular-books/'),
  export: (type: 'csv' | 'pdf', report: string) =>
    api.post('/reports/export', { type, report }, { responseType: 'blob' }),
};
