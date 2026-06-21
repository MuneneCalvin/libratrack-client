import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { QUERY_KEYS } from '@/lib/constants';
import { useUIStore } from '@/store/ui.store';

export function useNotifications() {
  const { setNotificationCount } = useUIStore();
  return useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: async () => {
      const { data } = await notificationsService.getOwn();
      const notifications = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      const unread = notifications.filter((n: { isRead: boolean }) => !n.isRead).length;
      setNotificationCount(unread);
      return notifications;
    },
  });
}
