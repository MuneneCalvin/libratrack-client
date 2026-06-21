import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationsService } from '@/services/notifications.service';
import { useNotifications } from '@/hooks/useNotifications';
import { useUIStore } from '@/store/ui.store';
import { QUERY_KEYS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationBell() {
  const { notificationCount } = useUIStore();
  const { data: notifications = [], isLoading } = useNotifications();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const markRead = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
      toast.success('Notification marked as read');
    },
    onError: () => {
      toast.error('Failed to update notification');
    },
  });
  const markAllRead = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to update notifications');
    },
  });

  const pending = (notifications as NotificationItem[]).filter((n) => !n.isRead).slice(0, 6);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative inline-flex size-9 items-center justify-center rounded-md text-text-primary transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/40"
        aria-label="Open pending notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/5">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-semibold text-text-primary">Pending notifications</p>
              <p className="text-xs text-text-secondary font-normal">{notificationCount} unread</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => markAllRead.mutate()}
              disabled={notificationCount === 0 || markAllRead.isPending}
            >
              <CheckCheck size={14} /> Mark all
            </Button>
          </div>
          <div className="h-px bg-border" />
          {isLoading && <p className="px-4 py-6 text-sm text-text-secondary">Loading notifications...</p>}
          {!isLoading && pending.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              <Bell size={28} className="mx-auto mb-2 opacity-40" />
              No pending notifications.
            </div>
          )}
          {!isLoading && pending.map((n) => (
            <div key={n.id} className="border-b border-border px-4 py-3 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-text-primary">{n.title}</p>
                    <Badge variant="secondary" className="text-[0.65rem]">New</Badge>
                  </div>
                  <p className="line-clamp-2 text-xs text-text-secondary">{n.message}</p>
                  <p className="text-[0.68rem] text-text-secondary">{formatDate(n.createdAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0"
                  onClick={() => markRead.mutate(n.id)}
                >
                  Read
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
