import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationsService } from '@/services/notifications.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/store/ui.store';
import { formatDate } from '@/lib/utils';
import { Bell, Send } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const { setNotificationCount } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const readMutation = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
      setNotificationCount(0);
    },
  });

  const remindMutation = useMutation({ mutationFn: notificationsService.sendReminders });

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
        {(user?.role === 'admin' || user?.role === 'librarian') && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => remindMutation.mutate()} disabled={remindMutation.isPending}>
            <Send size={14} /> {remindMutation.isPending ? 'Sending…' : 'Send Overdue Reminders'}
          </Button>
        )}
      </div>

      {isLoading && <p className="text-text-secondary">Loading…</p>}

      {notifications.length === 0 && !isLoading && (
        <div className="text-center py-16 text-text-secondary">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p>No notifications yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {(notifications as { id: number; title: string; message: string; type: string; isRead: boolean; createdAt: string }[]).map((n) => (
          <Card key={n.id} className={n.isRead ? 'opacity-60' : 'border-accent/40'}>
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{n.title}</p>
                  {!n.isRead && <Badge variant="default" className="text-xs px-1.5 py-0">New</Badge>}
                </div>
                <p className="text-text-secondary text-sm">{n.message}</p>
                <p className="text-xs text-text-secondary">{formatDate(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <Button variant="ghost" size="sm" onClick={() => readMutation.mutate(n.id)}>Mark read</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
