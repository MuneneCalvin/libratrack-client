import { api } from './api';

export const finesService = {
  getAll: (params?: Record<string, unknown>) => api.get('/fines', { params }),
  getByMember: (memberId: number, params?: Record<string, unknown>) =>
    api.get(`/fines/member/${memberId}`, { params }),
  getById: (id: number) => api.get(`/fines/${id}`),
  markPaid: (id: number) => api.patch(`/fines/${id}/pay`),
  waive: (id: number, note: string) => api.patch(`/fines/${id}/waive`, { note }),
};
