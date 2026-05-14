import { api } from './api';

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ data: { accessToken: string } }>('/auth/login', { email, password }),
  me: () =>
    api.get<{ data: { id: number; email: string; role: string; memberId?: number } }>('/auth/me'),
  logout: () => api.post('/auth/logout'),
};
