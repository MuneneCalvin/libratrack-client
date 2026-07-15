import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import NotificationBell from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LayoutDashboard, CalendarCheck, AlertCircle, Moon, Sun, LogOut, BookOpen, User, Menu, BookMarked } from 'lucide-react';

const navItems = [
  { to: '/portal/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/portal/books', icon: BookOpen, label: 'Browse Books' },
  { to: '/portal/my-books', icon: BookMarked, label: 'My Books' },
  { to: '/portal/reservations', icon: CalendarCheck, label: 'Reservations' },
  { to: '/portal/fines', icon: AlertCircle, label: 'Fines' },
];

export default function PortalLayout() {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, darkMode, toggleDarkMode } = useUIStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'LT';
  const displayName = user?.email?.split('@')[0] ?? 'Member';

  const renderNavLinks = (showLabels: boolean, onNavigate?: () => void) =>
    navItems.map(({ to, icon: Icon, label }) => (
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
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4" aria-label="Member mobile navigation">
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
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={cn(
        'hidden flex-shrink-0 flex-col bg-sidebar-bg transition-all duration-200 md:flex',
        sidebarOpen ? 'w-56' : 'w-16'
      )}>
        <div className="flex h-16 items-center justify-center border-b border-white/10 px-4">
          {sidebarOpen ? (
            <div className="flex w-full items-center gap-2">
              <BookOpen size={20} className="shrink-0 text-accent" />
              <span className="text-lg font-bold tracking-tight text-sidebar-fg">LibraTrack</span>
            </div>
          ) : (
            <BookOpen size={20} className="text-accent" />
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4" aria-label="Member navigation">
          {renderNavLinks(sidebarOpen)}
        </nav>

        <div className="border-t border-white/10 p-2">
          <button
            onClick={logout}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/8 hover:text-red-400',
              !sidebarOpen && 'justify-center'
            )}
            aria-label="Sign out"
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-accent/20 bg-surface px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open member navigation"
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
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 border-l border-border pl-2 focus:outline-none" aria-label="Open profile menu">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary ring-2 ring-transparent transition-all hover:ring-accent/40 dark:bg-accent/20">
                  <span className="text-xs font-bold text-primary-foreground dark:text-accent">{initials}</span>
                </div>
                <span className="hidden text-sm text-text-secondary sm:block">{displayName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <p className="font-medium text-text-primary">{displayName}</p>
                    <p className="truncate text-xs font-normal text-text-secondary">{user?.email}</p>
                    <p className="mt-0.5 text-xs font-normal text-accent">Member</p>
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

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
    </>
  );
}
