import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUIStore } from '@/store/ui.store';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth.store';
import AppRoutes from '@/routes';

export default function App() {
  const { darkMode } = useUIStore();
  const { user, accessToken, setToken, clearAuth } = useAuthStore();
  // Start bootstrapped if no refresh is needed; set to true after async refresh completes
  const [bootstrapped, setBootstrapped] = useState(() => !(user && !accessToken));
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
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!bootstrapped) return null;

  return <AppRoutes />;
}
