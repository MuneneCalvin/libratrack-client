import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, CalendarCheck, AlertCircle, Bell, Moon, Sun, LogOut } from 'lucide-react';

const navItems = [
  { to: '/portal/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/portal/reservations', icon: CalendarCheck, label: 'Reservations' },
  { to: '/portal/fines', icon: AlertCircle, label: 'Fines' },
  { to: '/portal/notifications', icon: Bell, label: 'Notifications' },
];

export default function PortalLayout() {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border px-6 h-16 flex items-center justify-between">
        <span className="font-bold text-primary">LibraTrack Member Portal</span>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <span className="text-sm text-text-secondary">{user?.email}</span>
          <Button variant="ghost" size="sm" className="text-danger gap-2" onClick={logout}>
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </header>
      <div className="flex">
        <aside className="w-52 border-r border-border min-h-[calc(100vh-4rem)] bg-surface py-4 px-2">
          <nav className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) =>
                cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                  isActive ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover')}>
                <Icon size={18} />{label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}
