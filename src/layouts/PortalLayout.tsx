import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LayoutDashboard, CalendarCheck, AlertCircle, Bell, Moon, Sun, LogOut, BookOpen, User } from 'lucide-react';

const navItems = [
  { to: '/portal/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/portal/books', icon: BookOpen, label: 'Browse Books' },
  { to: '/portal/reservations', icon: CalendarCheck, label: 'Reservations' },
  { to: '/portal/fines', icon: AlertCircle, label: 'Fines' },
  { to: '/portal/notifications', icon: Bell, label: 'Notifications' },
];

export default function PortalLayout() {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const navigate = useNavigate();

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'LT';
  const displayName = user?.email?.split('@')[0] ?? 'Member';

  return (
    <>
    {user?.mustChangePassword && <ChangePasswordModal open />}
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="bg-surface border-b border-accent/20 px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-accent" />
          <span className="font-bold text-text-primary">Book Tracking System</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label="Toggle dark mode">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 pl-2 border-l border-border focus:outline-none" aria-label="Open profile menu">
              <div className="size-8 rounded-full bg-primary dark:bg-accent/20 flex items-center justify-center ring-2 ring-transparent hover:ring-accent/40 transition-all">
                <span className="text-xs font-bold text-primary-foreground dark:text-accent">{initials}</span>
              </div>
              <span className="text-sm text-text-secondary hidden sm:block">{displayName}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <p className="font-medium text-text-primary">{displayName}</p>
                  <p className="text-xs text-text-secondary font-normal truncate">{user?.email}</p>
                  <p className="text-xs text-accent font-normal mt-0.5">Member</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/portal/profile')}>
                <User size={14} className="mr-2" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500">
                <LogOut size={14} className="mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-52 bg-sidebar-bg shrink-0 py-4 px-2 flex flex-col">
          <nav className="flex-1 space-y-0.5">
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

          {/* Logout at bottom of sidebar */}
          <div className="pt-2 border-t border-white/10 mt-2">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-white/50 hover:text-red-400 hover:bg-white/8"
              aria-label="Sign out"
            >
              <LogOut size={18} className="shrink-0" />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
    </>
  );
}
