import { api } from './api';

export const reservationsService = {
  getAll: (params?: Record<string, unknown>) => api.get('/reservations', { params }),
  getByMember: (memberId: number, params?: Record<string, unknown>) =>
    api.get(`/reservations/member/${memberId}`, { params }),
  create: (memberId: number, bookId: number) => api.post('/reservations', { memberId, bookId }),
  cancel: (id: number) => api.patch(`/reservations/${id}/cancel`),
};
