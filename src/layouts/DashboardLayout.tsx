import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import NotificationBell from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, BookOpen, Users, ArrowLeftRight,
  CalendarCheck, AlertCircle, BarChart2, Bell, Settings, Menu, Moon, Sun, LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/books', icon: BookOpen, label: 'Books' },
  { to: '/members', icon: Users, label: 'Members' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/reservations', icon: CalendarCheck, label: 'Reservations' },
  { to: '/fines', icon: AlertCircle, label: 'Fines' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings', adminOnly: true },
];

export default function DashboardLayout() {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, darkMode, toggleDarkMode } = useUIStore();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn('bg-surface border-r border-border flex flex-col transition-all duration-200', sidebarOpen ? 'w-56' : 'w-16')}>
        <div className="h-16 flex items-center px-4 border-b border-border">
          {sidebarOpen && <span className="font-bold text-primary text-lg">LibraTrack</span>}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === 'admin')
            .map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary')
                }
              >
                <Icon size={18} />
                {sidebarOpen && <span>{label}</span>}
              </NavLink>
            ))}
        </nav>
        <div className="p-2 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-danger" onClick={logout}>
            <LogOut size={18} />
            {sidebarOpen && 'Sign Out'}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <NotificationBell />
            <span className="text-sm text-text-secondary">{user?.email}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
