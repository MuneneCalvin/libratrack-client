import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUIStore } from '@/store/ui.store';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth.store';
import AppRoutes from '@/routes';

export default function App() {
  const { darkMode } = useUIStore();
  const { user, accessToken, setToken, clearAuth } = useAuthStore();
  const [bootstrapped, setBootstrapped] = useState(false);
  useSocket();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (user && !accessToken) {
      axios
        .post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true })
        .then(({ data }) => setToken(data.data.accessToken))
        .catch(() => clearAuth())
        .finally(() => setBootstrapped(true));
    } else {
      setBootstrapped(true);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!bootstrapped) return null;

  return <AppRoutes />;
}
