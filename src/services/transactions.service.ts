import { api } from './api';

export const transactionsService = {
  getAll: (params?: Record<string, unknown>) => api.get('/transactions/', { params }),
  getByMember: (memberId: number, params?: Record<string, unknown>) =>
    api.get('/transactions/', { params: { ...params, memberId } }),
  borrow: (memberId: number, bookIds: number[]) =>
    api.post('/transactions/', { memberId, bookIds }),
  return: (transactionId: number) => api.post(`/transactions/${transactionId}/return/`),
};
