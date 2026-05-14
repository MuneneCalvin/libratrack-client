import { api } from './api';

export const notificationsService = {
  getOwn: () => api.get('/notifications'),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  sendReminders: () => api.post('/notifications/remind'),
};
