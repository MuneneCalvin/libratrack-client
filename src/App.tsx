import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';
import { useSocket } from '@/hooks/useSocket';
import AppRoutes from '@/routes';

export default function App() {
  const { darkMode } = useUIStore();
  useSocket();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return <AppRoutes />;
}
