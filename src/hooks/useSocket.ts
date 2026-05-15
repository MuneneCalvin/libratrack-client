import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, user } = useAuthStore();
  const { incrementNotificationCount } = useUIStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken || !user) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: accessToken },
      reconnection: false,
    });
    socket.on('connect_error', () => { /* server does not support socket.io */ });
    socketRef.current = socket;

    socket.on('notification:new', (notification) => {
      incrementNotificationCount();
      queryClient.setQueryData(QUERY_KEYS.notifications, (old: unknown[] = []) => [notification, ...old]);
    });
    socket.on('transaction:overdue', () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
    });
    socket.on('book:returned', () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
    });
    socket.on('reservation:expired', () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [accessToken, user]);

  return socketRef;
}
