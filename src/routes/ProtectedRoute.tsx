import { useAuthStore } from '@/store/auth.store';
import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  roles?: ('admin' | 'librarian' | 'member')[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, accessToken } = useAuthStore();
  if (!accessToken || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
