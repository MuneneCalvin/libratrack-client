import { api } from './api';

export interface Member {
  id: number;
  fullName: string;
  phone?: string;
  address?: string;
  membershipNumber: string;
  joinedAt: string;
  user: { email: string; isActive: boolean };
}

export const membersService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<{ data: Member[]; meta: object }>('/members', { params }),
  getById: (id: number) => api.get<{ data: Member }>(`/members/${id}`),
  create: (data: { email: string; password: string; fullName: string; phone?: string; address?: string }) =>
    api.post<{ data: { member: Member } }>('/members', data),
  update: (id: number, data: Partial<Member & { isActive: boolean }>) =>
    api.patch<{ data: Member }>(`/members/${id}`, data),
  remove: (id: number) => api.delete(`/members/${id}`),
};
