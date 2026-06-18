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
      { id: me.id, email: me.email, role: me.role as 'admin' | 'librarian' | 'member', memberId: me.memberId, mustChangePassword: me.mustChangePassword },
      token,
    );
    navigate(me.role === 'member' ? '/portal/dashboard' : '/dashboard');
  }

  async function signup(data: { email: string; password: string; fullName: string; phone?: string; address?: string }) {
    const res = await authService.signup(data);
    const token = res.data.data.accessToken;
    const me = res.data.data.user;
    setAuth(
      { id: me.id, email: me.email, role: me.role as 'admin' | 'librarian' | 'member', memberId: me.memberId, mustChangePassword: me.mustChangePassword },
      token,
    );
    navigate('/portal/dashboard');
  }

  async function logout() {
    await authService.logout().catch(() => {});
    clearAuth();
    navigate('/login');
  }

  return { user, isAuthenticated: !!accessToken, login, signup, logout };
}
