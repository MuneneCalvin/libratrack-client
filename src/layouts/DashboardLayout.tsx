import { Outlet, NavLink } from 'react-router-dom';
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

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'LT';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — always deep navy */}
      <aside className={cn(
        'bg-sidebar-bg flex flex-col transition-all duration-200 flex-shrink-0',
        sidebarOpen ? 'w-56' : 'w-16'
      )}>
        {/* Brand + toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <BookOpen size={20} className="text-accent" />
              <span className="font-bold text-sidebar-fg text-lg tracking-tight">LibraTrack</span>
            </div>
          )}
          {!sidebarOpen && <BookOpen size={20} className="text-accent mx-auto" />}
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <Menu size={16} />
            </Button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === 'admin')
            .map(({ to, icon: Icon, label }) => (
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
                {sidebarOpen && <span>{label}</span>}
              </NavLink>
            ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-white/10">
          <button
            onClick={logout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-white/50 hover:text-red-400 hover:bg-white/8',
              !sidebarOpen && 'justify-center'
            )}
            aria-label="Sign out"
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-surface border-b border-accent/20 flex items-center justify-between px-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label="Toggle dark mode">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <NotificationBell />
            {/* User chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="size-8 rounded-full bg-primary dark:bg-accent/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground dark:text-accent">
                  {initials}
                </span>
              </div>
              <span className="text-sm text-text-secondary hidden sm:block">{user?.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
