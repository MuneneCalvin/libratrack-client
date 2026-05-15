import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, CalendarCheck, AlertCircle, Bell, Moon, Sun, LogOut, BookOpen } from 'lucide-react';

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

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'LT';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="bg-surface border-b border-accent/20 px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-accent" />
          <span className="font-bold text-text-primary">LibraTrack <span className="text-text-secondary font-normal">Member Portal</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="size-8 rounded-full bg-primary dark:bg-accent/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground dark:text-accent">{initials}</span>
            </div>
            <span className="text-sm text-text-secondary hidden sm:block">{user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-danger gap-2" onClick={logout}>
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-52 bg-sidebar-bg flex-shrink-0 py-4 px-2">
          <nav className="space-y-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-accent/15 text-accent font-semibold border-l-2 border-accent -ml-px pl-[calc(0.75rem-1px)]'
                      : 'text-white/60 hover:text-white hover:bg-white/8'
                  )
                }
              >
                <Icon size={18} className="shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
