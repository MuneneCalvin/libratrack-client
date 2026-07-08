import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import NotificationBell from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, BookOpen, Users, ArrowLeftRight,
  CalendarCheck, AlertCircle, BarChart2, Settings, Menu, Moon, Sun, LogOut, User,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'librarian'] },
  { to: '/books', icon: BookOpen, label: 'Books', roles: ['admin', 'librarian'] },
  { to: '/members', icon: Users, label: 'Members', roles: ['admin', 'librarian'] },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions', roles: ['librarian'] },
  { to: '/reservations', icon: CalendarCheck, label: 'Reservations', roles: ['librarian'] },
  { to: '/fines', icon: AlertCircle, label: 'Fines', roles: ['librarian'] },
  { to: '/reports', icon: BarChart2, label: 'Reports', roles: ['admin'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
];

export default function DashboardLayout() {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, darkMode, toggleDarkMode } = useUIStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'LT';
  const displayName = user?.email?.split('@')[0] ?? 'User';
  const roleLabel = user?.role === 'admin' ? 'Platform Admin' : user?.role === 'librarian' ? 'Library Operations' : 'Staff';
  const visibleNavItems = navItems.filter((item) => item.roles.includes(user?.role ?? 'librarian'));

  const renderNavLinks = (showLabels: boolean, onNavigate?: () => void) =>
    visibleNavItems.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
            !showLabels && 'justify-center',
            isActive
              ? 'bg-accent/15 text-accent font-semibold border-l-2 border-accent -ml-px pl-[calc(0.75rem-1px)]'
              : 'text-white/60 hover:text-white hover:bg-white/8'
          )
        }
      >
        <Icon size={18} className="shrink-0" />
        {showLabels && <span>{label}</span>}
      </NavLink>
    ));

  const signOut = () => {
    setMobileNavOpen(false);
    logout();
  };

  return (
    <>
    {user?.mustChangePassword && <ChangePasswordModal open />}
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent
        side="left"
        className="w-[18rem] max-w-[86vw] gap-0 border-white/10 bg-sidebar-bg p-0 text-sidebar-fg"
      >
        <SheetHeader className="h-16 justify-center border-b border-white/10 px-4 py-0">
          <SheetTitle className="flex items-center gap-2 text-sidebar-fg">
            <BookOpen size={20} className="text-accent" />
            LibraTrack
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4" aria-label="Staff mobile navigation">
          {renderNavLinks(true, () => setMobileNavOpen(false))}
        </nav>
        <div className="border-t border-white/10 p-2">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-white/50 hover:text-red-400 hover:bg-white/8"
            aria-label="Sign out"
          >
            <LogOut size={18} className="shrink-0" />
            Sign Out
          </button>
        </div>
      </SheetContent>
    </Sheet>
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'hidden md:flex bg-sidebar-bg flex-col transition-all duration-200 flex-shrink-0',
        sidebarOpen ? 'w-56' : 'w-16'
      )}>
        {/* Brand */}
        <div className="h-16 flex items-center justify-center px-4 border-b border-white/10">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 w-full">
              <BookOpen size={20} className="text-accent shrink-0" />
              <span className="font-bold text-sidebar-fg text-lg tracking-tight">LibraTrack</span>
            </div>
          ) : (
            <BookOpen size={20} className="text-accent" />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto" aria-label="Staff navigation">
          {renderNavLinks(sidebarOpen)}
        </nav>

        {/* Logout at bottom */}
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
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open staff navigation"
          >
            <Menu size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label="Toggle dark mode">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <NotificationBell />
            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 pl-2 border-l border-border focus:outline-none" aria-label="Open profile menu">
                <div className="size-8 rounded-full bg-primary dark:bg-accent/20 flex items-center justify-center ring-2 ring-transparent hover:ring-accent/40 transition-all">
                  <span className="text-xs font-bold text-primary-foreground dark:text-accent">
                    {initials}
                  </span>
                </div>
                <span className="text-sm text-text-secondary hidden sm:block">{displayName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <p className="font-medium text-text-primary">{displayName}</p>
                    <p className="text-xs text-text-secondary font-normal truncate">{user?.email}</p>
                    <p className="text-xs text-accent font-normal mt-0.5">{roleLabel}</p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
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

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
    </>
  );
}
