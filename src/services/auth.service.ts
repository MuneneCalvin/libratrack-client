import { api } from './api';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  memberId?: number;
  mustChangePassword?: boolean;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ data: { accessToken: string } }>('/auth/login', { email, password }),
  signup: (data: { email: string; password: string; fullName: string; phone?: string; address?: string }) =>
    api.post<{ data: { accessToken: string; user: AuthUser } }>('/auth/signup', data),
  me: () =>
    api.get<{ data: AuthUser }>('/auth/me'),
  updateMe: (data: { email?: string }) =>
    api.patch<AuthUser | { data: AuthUser }>('/auth/me', data),
  logout: () => api.post('/auth/logout'),
  changePassword: (password: string) =>
    api.patch('/auth/change-password', { password }),
};
