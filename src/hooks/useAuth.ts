import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  async function login(email: string, password: string) {
    const { data } = await authService.login(email, password);
    const token = data.data.accessToken;
    const meRes = await authService.me();
    const me = meRes.data.data;
    setAuth(
      { id: me.id, email: me.email, role: me.role as 'admin' | 'librarian' | 'member', memberId: me.memberId },
      token,
    );
    navigate(me.role === 'member' ? '/portal/dashboard' : '/dashboard');
  }

  async function logout() {
    await authService.logout().catch(() => {});
    clearAuth();
    navigate('/login');
  }

  return { user, isAuthenticated: !!accessToken, login, logout };
}
