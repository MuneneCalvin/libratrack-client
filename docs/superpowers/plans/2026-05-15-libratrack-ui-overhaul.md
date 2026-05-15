# LibraTrack UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the LibraTrack frontend from a flat, beige, broken-button app into a polished deep-navy-and-gold library management system.

**Architecture:** Token-first approach — update CSS custom properties in `index.css` so the palette change cascades through all components automatically. Then polish each shared component (layout, cards, table, skeleton) and fix page-level layout constraints. No new dependencies needed.

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui (base-ui primitives), lucide-react, Vite, Vitest

---

## File Map

| File | What changes |
|---|---|
| `src/index.css` | New navy/gold palette tokens, `--primary-foreground`, sidebar tokens, shimmer keyframe, `.shimmer` utility class |
| `tailwind.config.ts` | Add `primary-foreground` and `sidebar-bg`/`sidebar-fg` color mappings |
| `src/components/ui/skeleton.tsx` | Replace `animate-pulse` with `.shimmer` |
| `src/components/ui/button.tsx` | Fix default variant hover, fix outline/ghost variants for both modes, bump h-8→h-9 |
| `src/components/ui/badge.tsx` | `secondary` → gold-tint, `default` already uses `bg-primary text-primary-foreground` (works once token added) |
| `src/layouts/DashboardLayout.tsx` | Navy sidebar (`bg-sidebar-bg`), gold active nav, brand with BookOpen icon, user chip in header, gold header border |
| `src/layouts/PortalLayout.tsx` | Same navy sidebar treatment |
| `src/components/StatsCard.tsx` | Left accent border, gradient icon circle, `text-3xl` value, hover lift |
| `src/components/DataTable.tsx` | Ghost table skeleton (6 rows in table container), navy table header, gold row hover, empty state icon, pagination style |
| `tests/components/DataTable.test.tsx` | Update skeleton count expectation from 5 → 6 |
| `src/pages/DashboardPage.tsx` | Greeting header + Quick Actions row |
| `src/pages/LoginPage.tsx` | Two-column split (navy brand panel left, form right) |
| `src/pages/books/BookDetailPage.tsx` | `max-w-xl` → `max-w-4xl`, two-column layout |
| `src/pages/books/BookEditPage.tsx` | `max-w-xl` → `max-w-3xl`, two-column field grid |
| `src/pages/books/BookNewPage.tsx` | `max-w-xl` → `max-w-3xl`, two-column field grid |
| `src/pages/members/MemberDetailPage.tsx` | `max-w-2xl` → `max-w-4xl`, full-width layout |
| `src/pages/members/MemberNewPage.tsx` | `max-w-xl` → `max-w-3xl`, two-column field grid |

---

## Task 1: Color Token System

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.ts`

This is the foundation. All other tasks depend on this being correct.

- [ ] **Step 1: Replace `src/index.css` entirely**

```css
@import "tailwindcss";

@theme inline {
  --color-background: hsl(var(--background));
  --color-surface: hsl(var(--surface));
  --color-surface-hover: hsl(var(--surface-hover));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-accent: hsl(var(--accent));
  --color-accent-soft: hsl(var(--accent-soft));
  --color-text-primary: hsl(var(--text-primary));
  --color-text-secondary: hsl(var(--text-secondary));
  --color-border: hsl(var(--border));
  --color-success: hsl(var(--success));
  --color-warning: hsl(var(--warning));
  --color-danger: hsl(var(--danger));
  --color-sidebar-bg: hsl(var(--sidebar-bg));
  --color-sidebar-fg: hsl(var(--sidebar-fg));
  /* shadcn tokens */
  --color-card: hsl(var(--surface));
  --color-card-foreground: hsl(var(--text-primary));
  --color-popover: hsl(var(--surface));
  --color-popover-foreground: hsl(var(--text-primary));
  --color-muted: hsl(220 14% 96%);
  --color-muted-foreground: hsl(var(--text-secondary));
  --color-input: hsl(var(--border));
  --color-ring: hsl(var(--accent));
  --color-destructive: hsl(var(--danger));
  --color-foreground: hsl(var(--text-primary));
}

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

@layer utilities {
  .shimmer {
    background: linear-gradient(
      90deg,
      hsl(var(--border)) 25%,
      hsl(var(--surface-hover)) 50%,
      hsl(var(--border)) 75%
    );
    background-size: 400px 100%;
    animation: shimmer 1.5s infinite linear;
  }
}

@layer base {
  :root {
    --background: 0 0% 98%;
    --surface: 0 0% 100%;
    --surface-hover: 220 30% 97%;
    --primary: 220 60% 16%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 40% 30%;
    --accent: 42 72% 52%;
    --accent-soft: 42 72% 92%;
    --text-primary: 220 50% 10%;
    --text-secondary: 220 15% 50%;
    --border: 220 20% 88%;
    --success: 160 84% 35%;
    --warning: 38 92% 50%;
    --danger: 0 84% 60%;
    --sidebar-bg: 220 60% 16%;
    --sidebar-fg: 0 0% 100%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222 55% 8%;
    --surface: 220 50% 13%;
    --surface-hover: 220 45% 18%;
    --primary: 210 40% 98%;
    --primary-foreground: 220 60% 16%;
    --secondary: 220 20% 65%;
    --accent: 42 80% 60%;
    --accent-soft: 42 40% 25%;
    --text-primary: 210 40% 98%;
    --text-secondary: 220 20% 60%;
    --border: 220 35% 22%;
    --success: 160 84% 39%;
    --warning: 43 96% 56%;
    --danger: 0 91% 71%;
    --sidebar-bg: 222 55% 9%;
    --sidebar-fg: 0 0% 100%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-text-primary;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

- [ ] **Step 2: Update `tailwind.config.ts` to add new color mappings**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        surface: 'hsl(var(--surface))',
        'surface-hover': 'hsl(var(--surface-hover))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        accent: 'hsl(var(--accent))',
        'accent-soft': 'hsl(var(--accent-soft))',
        'text-primary': 'hsl(var(--text-primary))',
        'text-secondary': 'hsl(var(--text-secondary))',
        border: 'hsl(var(--border))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--danger))',
        'sidebar-bg': 'hsl(var(--sidebar-bg))',
        'sidebar-fg': 'hsl(var(--sidebar-fg))',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Start the dev server and verify the background is clean white (not beige)**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client" && npm run dev
```

Open http://localhost:5173. The login page background should now be near-white (`#FAFAFA`) instead of the old warm beige. The app should load without console errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/index.css tailwind.config.ts
git commit -m "feat: overhaul color token system with deep navy & gold palette"
```

---

## Task 2: Skeleton Component

**Files:**
- Modify: `src/components/ui/skeleton.tsx`

Replace the flat `animate-pulse` with the sweep shimmer animation defined in Task 1.

- [ ] **Step 1: Update `src/components/ui/skeleton.tsx`**

```tsx
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md shimmer", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

- [ ] **Step 2: Verify in browser**

Any page that shows a loading state (e.g., navigate to `/books` before data loads) should now show a left-to-right sweeping shimmer instead of a pulsing grey blob.

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/components/ui/skeleton.tsx
git commit -m "feat: replace animate-pulse with sweep shimmer on Skeleton component"
```

---

## Task 3: Button Component

**Files:**
- Modify: `src/components/ui/button.tsx`

Fix invisible button text (missing `primary-foreground` token now added in Task 1). Fix hover states for all variants. Bump default height slightly.

- [ ] **Step 1: Replace `src/components/ui/button.tsx`**

```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md",
        outline:
          "border-border bg-background text-text-primary hover:bg-surface-hover dark:border-accent/50 dark:text-accent dark:hover:bg-accent/10 aria-expanded:bg-surface-hover dark:aria-expanded:bg-accent/10",
        secondary:
          "bg-secondary text-primary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-primary/8 hover:text-primary dark:hover:bg-white/8 dark:hover:text-white aria-expanded:bg-primary/8 dark:aria-expanded:bg-white/8",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

- [ ] **Step 2: Verify in browser**

Navigate to `/books`. The "Add Book" button should now show **white text on a deep navy background**. Hover should darken slightly. The outline "Cancel" buttons on form pages should have a visible navy border and text.

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/components/ui/button.tsx
git commit -m "feat: fix invisible button text, update variant hover states"
```

---

## Task 4: Badge Component

**Files:**
- Modify: `src/components/ui/badge.tsx`

The `default` badge already uses `bg-primary text-primary-foreground` — it now works correctly after Task 1. The `secondary` badge needs to switch from dark grey to gold-tint.

- [ ] **Step 1: Update badge variants in `src/components/ui/badge.tsx`**

Replace only the `variants` object inside `badgeVariants`:

```tsx
variants: {
  variant: {
    default:
      "bg-primary text-primary-foreground",
    secondary:
      "bg-accent-soft text-accent border-transparent",
    destructive:
      "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40",
    outline:
      "border-border text-text-secondary",
    ghost:
      "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
    link: "text-primary underline-offset-4 hover:underline",
  },
},
```

- [ ] **Step 2: Verify in browser**

Navigate to `/books`. Category badges should show as **gold-tinted pills** (warm gold background, dark gold text). The Active/Inactive status badges on `/members` should show: Active = navy pill with white text, Inactive = gold-tint pill (the secondary variant).

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/components/ui/badge.tsx
git commit -m "feat: update badge variants — default navy, secondary gold-tint"
```

---

## Task 5: Dashboard Layout (Sidebar + Header)

**Files:**
- Modify: `src/layouts/DashboardLayout.tsx`

Replace the flat white sidebar with a deep navy sidebar. Add gold active indicator, brand with icon, user chip in header.

- [ ] **Step 1: Replace `src/layouts/DashboardLayout.tsx`**

```tsx
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
          >
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
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
```

- [ ] **Step 2: Verify in browser**

After logging in you should see:
- Deep navy sidebar (not white)
- Gold `LibraTrack` wordmark with book icon in the sidebar header
- Active nav link has a gold left-strip + gold text + subtle gold tint background
- Header has a thin gold bottom border
- User chip (circle with initials) appears next to the email
- Hamburger toggle still works

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/layouts/DashboardLayout.tsx
git commit -m "feat: redesign sidebar to deep navy with gold active nav and user chip in header"
```

---

## Task 6: Portal Layout

**Files:**
- Modify: `src/layouts/PortalLayout.tsx`

Apply the same navy sidebar treatment to the member portal.

- [ ] **Step 1: Replace `src/layouts/PortalLayout.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify in browser**

Log in as a member (role = `member`). Portal layout should show the same deep navy sidebar as the admin/librarian layout. Header has gold border accent. User chip visible.

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/layouts/PortalLayout.tsx
git commit -m "feat: apply navy sidebar and gold accent to portal layout"
```

---

## Task 7: StatsCard Component

**Files:**
- Modify: `src/components/StatsCard.tsx`

Left accent border, gradient icon circle, larger value text, hover lift effect.

- [ ] **Step 1: Replace `src/components/StatsCard.tsx`**

```tsx
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

const variantConfig = {
  default: {
    text: 'text-accent',
    border: 'border-l-accent',
    iconBg: 'bg-gradient-to-br from-accent/20 to-accent/5',
  },
  success: {
    text: 'text-success',
    border: 'border-l-success',
    iconBg: 'bg-gradient-to-br from-success/20 to-success/5',
  },
  warning: {
    text: 'text-warning',
    border: 'border-l-warning',
    iconBg: 'bg-gradient-to-br from-warning/20 to-warning/5',
  },
  danger: {
    text: 'text-danger',
    border: 'border-l-danger',
    iconBg: 'bg-gradient-to-br from-danger/20 to-danger/5',
  },
};

export default function StatsCard({ title, value, icon: Icon, variant = 'default', subtitle }: Props) {
  const cfg = variantConfig[variant];

  return (
    <Card className={cn(
      'bg-surface border-l-4 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5',
      cfg.border
    )}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('p-3 rounded-full shrink-0', cfg.iconBg, cfg.text)}>
          <Icon size={24} />
        </div>
        <div className="min-w-0">
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/dashboard`. Stat cards should now have:
- A colored left border strip (gold, green, red depending on variant)
- A circular gradient icon background
- Larger, bolder numbers
- Subtle lift on hover

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/components/StatsCard.tsx
git commit -m "feat: redesign StatsCard with accent border, gradient icon, hover lift"
```

---

## Task 8: DataTable Component

**Files:**
- Modify: `src/components/DataTable.tsx`
- Modify: `tests/components/DataTable.test.tsx`

Update the skeleton to a ghost-table structure (6 rows in a bordered container with a header bar). Add navy table header, gold row hover, empty state icon, and pagination styling. Update the test to match the new skeleton count.

- [ ] **Step 1: Update the test first — change skeleton count expectation**

In `tests/components/DataTable.test.tsx`, update the skeleton test:

```tsx
it('shows loading skeletons when isLoading', () => {
  const { container } = render(<DataTable columns={columns} data={[]} isLoading />);
  expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(6);
});
```

- [ ] **Step 2: Run the test to confirm it now fails**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client" && npm test
```

Expected: 1 failing test — `shows loading skeletons when isLoading` — "expected 5 to be 6".

- [ ] **Step 3: Replace `src/components/DataTable.tsx`**

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  page = 1,
  totalPages = 1,
  onPageChange,
  emptyMessage = 'No records found.',
}: Props<T>) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-border overflow-hidden">
        {/* Ghost header */}
        <div className="h-10 bg-primary/8 dark:bg-surface-hover border-b border-border" />
        {/* Ghost rows — one Skeleton per row so the test count stays at 6 */}
        <div className="divide-y divide-border bg-surface">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary dark:bg-surface-hover dark:hover:bg-surface-hover border-b border-white/10 dark:border-border">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="text-white/80 dark:text-text-secondary font-medium text-xs uppercase tracking-wide"
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="py-12">
                  <div className="flex flex-col items-center gap-2 text-text-secondary">
                    <Inbox size={36} className="text-text-secondary/40" />
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={i}
                  className="hover:bg-accent/5 border-b border-border last:border-0 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>{col.render(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold text-text-primary">
            Page {page} <span className="font-normal text-text-secondary">of {totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run all tests — expect all passing**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client" && npm test
```

Expected output: all 4 tests pass.

```
✓ renders column headers
✓ renders rows
✓ shows empty message when no data
✓ shows loading skeletons when isLoading
```

- [ ] **Step 5: Verify in browser**

Navigate to `/books`. While loading you should see a bordered ghost table with a faint navy header bar and 6 shimmer rows inside. Once loaded: the table header is deep navy with white column labels, rows have gold-tinted hover, empty state shows a centred icon + text. Pagination buttons use the updated outline style.

- [ ] **Step 6: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/components/DataTable.tsx tests/components/DataTable.test.tsx
git commit -m "feat: redesign DataTable with ghost skeleton, navy header, gold hover, icon empty state"
```

---

## Task 9: Dashboard Page

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

Add a personalised greeting header and a Quick Actions row below the stat cards.

- [ ] **Step 1: Replace `src/pages/DashboardPage.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '@/services/reports.service';
import { QUERY_KEYS } from '@/lib/constants';
import StatsCard from '@/components/StatsCard';
import { useAuthStore } from '@/store/auth.store';
import { BookOpen, Users, ArrowLeftRight, AlertCircle } from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

const quickActions = [
  { label: 'Borrow a Book', description: 'Record a new borrow transaction', icon: ArrowLeftRight, to: '/transactions/borrow' },
  { label: 'Add Member', description: 'Register a new library member', icon: Users, to: '/members/new' },
  { label: 'View Overdue', description: 'See all overdue transactions', icon: AlertCircle, to: '/transactions' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: borrowing } = useQuery({ queryKey: QUERY_KEYS.reports.borrowing, queryFn: () => reportsService.getBorrowing() });
  const { data: inventory } = useQuery({ queryKey: QUERY_KEYS.reports.inventory, queryFn: () => reportsService.getInventory() });
  const { data: members } = useQuery({ queryKey: QUERY_KEYS.reports.members, queryFn: () => reportsService.getMembers() });

  const b = (borrowing?.data as { data?: { active: number; overdue: number } })?.data;
  const inv = (inventory?.data as { data?: { total?: { _sum?: { totalCopies?: number } } } })?.data;
  const mem = (members?.data as { data?: { total?: number } })?.data;

  const firstName = user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="space-y-8">
      {/* Greeting header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-text-secondary text-sm mt-1">{formatToday()}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Borrows" value={b?.active ?? '—'} icon={ArrowLeftRight} variant="default" />
        <StatsCard title="Overdue" value={b?.overdue ?? '—'} icon={AlertCircle} variant="danger" />
        <StatsCard title="Total Books" value={inv?.total?._sum?.totalCopies ?? '—'} icon={BookOpen} variant="success" />
        <StatsCard title="Members" value={mem?.total ?? '—'} icon={Users} variant="default" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map(({ label, description, icon: Icon, to }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex items-center gap-4 p-5 rounded-xl border border-border bg-surface text-left transition-all duration-150 hover:border-accent/50 hover:bg-accent/5 hover:shadow-sm group"
            >
              <div className="p-3 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-accent shrink-0 group-hover:from-accent/30 group-hover:to-accent/10 transition-all">
                <Icon size={22} />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">{label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/dashboard`. You should see:
- A large personalised greeting ("Good morning, admin" or similar)
- Today's date below in muted text
- The 4 stat cards with the new StatsCard styling
- A "Quick Actions" section with 3 clickable cards below the stats

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/pages/DashboardPage.tsx
git commit -m "feat: add greeting header and quick actions to dashboard"
```

---

## Task 10: Login Page

**Files:**
- Modify: `src/pages/LoginPage.tsx`

Two-column split: navy brand panel on left (desktop), clean white form on right.

- [ ] **Step 1: Replace `src/pages/LoginPage.tsx`**

```tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — navy brand (desktop only) */}
      <div
        className="hidden lg:flex lg:w-3/5 flex-col items-center justify-center bg-sidebar-bg relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 50%, hsl(42 72% 52% / 0.08), transparent 70%)',
        }}
      >
        {/* Decorative faint book spines */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-sm bg-white/3"
              style={{
                width: `${12 + i * 4}px`,
                height: `${80 + i * 20}px`,
                left: `${10 + i * 15}%`,
                bottom: `${10 + (i % 3) * 8}%`,
                transform: `rotate(${-3 + i * 1.5}deg)`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4 text-center px-12">
          <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
            <BookOpen size={48} className="text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">LibraTrack</h1>
          <p className="text-white/50 text-lg">Smart Library Management</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <BookOpen size={24} className="text-accent" />
          <span className="text-xl font-bold text-text-primary">LibraTrack</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
            <p className="text-text-secondary text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="border-l-4 border-danger bg-danger/5 px-4 py-2.5 rounded-r-md">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Log out and visit the login page. On a wide screen (≥ 1024px) you should see:
- Left 60%: deep navy panel with gold `LibraTrack` wordmark, book icon, and faint decorative book shapes
- Right 40%: clean white background with "Welcome back" heading, email/password form
- Error state (type wrong password): red left-border callout box instead of bare red text

On mobile (< 1024px): single column, small logo above the form.

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/pages/LoginPage.tsx
git commit -m "feat: redesign login page with two-column navy/white split layout"
```

---

## Task 11: Book Detail Page Layout

**Files:**
- Modify: `src/pages/books/BookDetailPage.tsx`

Remove `max-w-xl` pin. Use `max-w-4xl` with a two-column card layout.

- [ ] **Step 1: Replace `src/pages/books/BookDetailPage.tsx`**

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { booksService } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, BookOpen } from 'lucide-react';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.book(Number(id)),
    queryFn: () => booksService.getById(Number(id)),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const book = data?.data?.data;
  if (!book) return <p className="text-danger">Book not found.</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{book.title}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{book.author}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/books/${id}/edit`)} className="gap-2">
          <Pencil size={14} /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Book Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="ISBN" value={book.isbn} />
            <Row label="Category" value={<Badge variant="secondary">{book.category.name}</Badge>} />
            <Row label="Publisher" value={book.publisher ?? '—'} />
            <Row label="Published Year" value={book.publishedYear ?? '—'} />
          </CardContent>
        </Card>

        {/* Availability card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen size={16} className="text-accent" /> Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-2">
              <p className={`text-4xl font-bold ${book.availableCopies === 0 ? 'text-danger' : 'text-success'}`}>
                {book.availableCopies}
              </p>
              <p className="text-text-secondary text-xs mt-1">of {book.totalCopies} copies available</p>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${book.availableCopies === 0 ? 'bg-danger' : 'bg-success'}`}
                style={{ width: `${(book.availableCopies / book.totalCopies) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-text-secondary font-medium">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to any book detail page (e.g., click a book from `/books`). The layout should span most of the page width — detail fields on the left 2/3, availability panel with a progress bar on the right 1/3.

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/pages/books/BookDetailPage.tsx
git commit -m "feat: expand BookDetailPage to full width two-column layout"
```

---

## Task 12: Book Edit Page Layout

**Files:**
- Modify: `src/pages/books/BookEditPage.tsx`

Remove `max-w-xl`. Use `max-w-3xl` with a two-column field grid.

- [ ] **Step 1: Replace `src/pages/books/BookEditPage.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { booksService } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', categoryId: '',
    totalCopies: '1', publisher: '', publishedYear: '',
  });
  const [error, setError] = useState('');

  const { data: bookData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.book(Number(id)),
    queryFn: () => booksService.getById(Number(id)),
  });
  const { data: categories } = useQuery({ queryKey: QUERY_KEYS.categories, queryFn: booksService.getCategories });

  useEffect(() => {
    const b = bookData?.data?.data;
    if (b) setForm({
      title: b.title, author: b.author, isbn: b.isbn,
      categoryId: String(b.categoryId), totalCopies: String(b.totalCopies),
      publisher: b.publisher ?? '', publishedYear: b.publishedYear ? String(b.publishedYear) : '',
    });
  }, [bookData]);

  const mutation = useMutation({
    mutationFn: () => booksService.update(Number(id), {
      title: form.title, author: form.author, isbn: form.isbn,
      categoryId: Number(form.categoryId), totalCopies: Number(form.totalCopies),
      publisher: form.publisher || undefined,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books }); navigate('/books'); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      setError(e.response?.data?.message ?? 'Failed to update book'),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Edit Book</h1>
        <p className="text-text-secondary text-sm mt-0.5">Update the book information below</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Book Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={set('title')} />
            </div>
            <div className="space-y-1.5">
              <Label>Author</Label>
              <Input value={form.author} onChange={set('author')} />
            </div>
            <div className="space-y-1.5">
              <Label>ISBN</Label>
              <Input value={form.isbn} onChange={set('isbn')} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(categories?.data as { data?: { id: number; name: string }[] })?.data?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Total Copies</Label>
              <Input type="number" min="1" value={form.totalCopies} onChange={set('totalCopies')} />
            </div>
            <div className="space-y-1.5">
              <Label>Publisher</Label>
              <Input value={form.publisher} onChange={set('publisher')} />
            </div>
            <div className="space-y-1.5">
              <Label>Published Year</Label>
              <Input type="number" value={form.publishedYear} onChange={set('publishedYear')} />
            </div>
          </div>

          {error && (
            <div className="border-l-4 border-danger bg-danger/5 px-4 py-2.5 rounded-r-md">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/books')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to any book edit page. Form fields should now be arranged in a 2-column grid on desktop, using most of the page width rather than a narrow 40% strip.

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/pages/books/BookEditPage.tsx
git commit -m "feat: expand BookEditPage to max-w-3xl with two-column field grid"
```

---

## Task 13: Book New Page Layout

**Files:**
- Modify: `src/pages/books/BookNewPage.tsx`

Same treatment as BookEditPage — `max-w-3xl`, two-column field grid.

- [ ] **Step 1: Replace `src/pages/books/BookNewPage.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { booksService } from '@/services/books.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BookNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', categoryId: '',
    totalCopies: '1', publisher: '', publishedYear: '',
  });
  const [error, setError] = useState('');

  const { data: categories } = useQuery({ queryKey: QUERY_KEYS.categories, queryFn: booksService.getCategories });

  const mutation = useMutation({
    mutationFn: () => booksService.create({
      title: form.title, author: form.author, isbn: form.isbn,
      categoryId: Number(form.categoryId), totalCopies: Number(form.totalCopies),
      publisher: form.publisher || undefined,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books }); navigate('/books'); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      setError(e.response?.data?.message ?? 'Failed to create book'),
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Add Book</h1>
        <p className="text-text-secondary text-sm mt-0.5">Fill in the details to add a new book to the catalogue</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Book Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Title <span className="text-danger">*</span></Label>
              <Input value={form.title} onChange={set('title')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Author <span className="text-danger">*</span></Label>
              <Input value={form.author} onChange={set('author')} required />
            </div>
            <div className="space-y-1.5">
              <Label>ISBN <span className="text-danger">*</span></Label>
              <Input value={form.isbn} onChange={set('isbn')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Category <span className="text-danger">*</span></Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(categories?.data as { data?: { id: number; name: string }[] })?.data?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Total Copies <span className="text-danger">*</span></Label>
              <Input type="number" min="1" value={form.totalCopies} onChange={set('totalCopies')} />
            </div>
            <div className="space-y-1.5">
              <Label>Publisher <span className="text-text-secondary text-xs">(optional)</span></Label>
              <Input value={form.publisher} onChange={set('publisher')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Published Year <span className="text-text-secondary text-xs">(optional)</span></Label>
              <Input type="number" value={form.publishedYear} onChange={set('publishedYear')} className="sm:max-w-[50%]" />
            </div>
          </div>

          {error && (
            <div className="border-l-4 border-danger bg-danger/5 px-4 py-2.5 rounded-r-md">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Book'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/books')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/books/new`. Fields should be in a clean 2-column grid, full page width.

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/pages/books/BookNewPage.tsx
git commit -m "feat: expand BookNewPage to max-w-3xl with two-column field grid"
```

---

## Task 14: Member Detail Page Layout

**Files:**
- Modify: `src/pages/members/MemberDetailPage.tsx`

Remove `max-w-2xl` constraint — let the layout use the full available width.

- [ ] **Step 1: Replace `src/pages/members/MemberDetailPage.tsx`**

```tsx
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '@/services/members.service';
import { transactionsService } from '@/services/transactions.service';
import { finesService } from '@/services/fines.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const memberId = Number(id);
  const queryClient = useQueryClient();

  const { data: memberData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.member(memberId),
    queryFn: () => membersService.getById(memberId),
  });
  const { data: txData } = useQuery({
    queryKey: QUERY_KEYS.memberTransactions(memberId),
    queryFn: () => transactionsService.getByMember(memberId),
  });
  const { data: finesData } = useQuery({
    queryKey: QUERY_KEYS.memberFines(memberId),
    queryFn: () => finesService.getByMember(memberId),
  });

  const toggleActive = useMutation({
    mutationFn: () => membersService.update(memberId, { isActive: !member?.user.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.member(memberId) }),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const member = memberData?.data?.data;
  if (!member) return <p className="text-danger">Member not found.</p>;

  const transactions = (txData?.data as { data?: unknown[] })?.data ?? [];
  const fines = (finesData?.data as { data?: unknown[] })?.data ?? [];
  const outstandingFines = (fines as { isPaid: boolean; isWaived: boolean; amount: number }[])
    .filter((f) => !f.isPaid && !f.isWaived)
    .reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{member.fullName}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{member.membershipNumber}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleActive.mutate()}
          disabled={toggleActive.isPending}
        >
          {member.user.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Member Information
              <Badge variant={member.user.isActive ? 'default' : 'secondary'}>
                {member.user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 text-sm">
            {[
              ['Email', member.user.email],
              ['Phone', member.phone ?? '—'],
              ['Address', member.address ?? '—'],
              ['Joined', formatDate(member.joinedAt)],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                <span className="text-text-secondary font-medium">{label}</span>
                <span className="text-text-primary">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary font-medium">Total Borrows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-text-primary">{transactions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary font-medium">Outstanding Fines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${outstandingFines > 0 ? 'text-danger' : 'text-success'}`}>
                {formatCurrency(outstandingFines)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to any member detail page. The layout should use the full `max-w-4xl` width — member info on the left, stats cards on the right.

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/pages/members/MemberDetailPage.tsx
git commit -m "feat: expand MemberDetailPage to full-width two-column layout"
```

---

## Task 15: Member New Page Layout

**Files:**
- Modify: `src/pages/members/MemberNewPage.tsx`

Remove `max-w-xl`. Use `max-w-3xl` with a two-column field grid.

- [ ] **Step 1: Replace `src/pages/members/MemberNewPage.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '@/services/members.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MemberNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => membersService.create({
      email: form.email, password: form.password, fullName: form.fullName,
      phone: form.phone || undefined, address: form.address || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members }); navigate('/members'); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      setError(e.response?.data?.message ?? 'Failed to create member'),
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Add Member</h1>
        <p className="text-text-secondary text-sm mt-0.5">Register a new library member account</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Member Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full Name <span className="text-danger">*</span></Label>
              <Input value={form.fullName} onChange={set('fullName')} required className="sm:max-w-[50%]" />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-danger">*</span></Label>
              <Input type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Password <span className="text-danger">*</span></Label>
              <Input type="password" value={form.password} onChange={set('password')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone <span className="text-text-secondary text-xs">(optional)</span></Label>
              <Input value={form.phone} onChange={set('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label>Address <span className="text-text-secondary text-xs">(optional)</span></Label>
              <Input value={form.address} onChange={set('address')} />
            </div>
          </div>

          {error && (
            <div className="border-l-4 border-danger bg-danger/5 px-4 py-2.5 rounded-r-md">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Create Member'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/members')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Run all tests to confirm nothing broken**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client" && npm test
```

Expected: all 4 tests pass.

- [ ] **Step 3: Verify in browser**

Navigate to `/members/new`. Fields are in a 2-column grid across full page width.

- [ ] **Step 4: Commit**

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
git add src/pages/members/MemberNewPage.tsx
git commit -m "feat: expand MemberNewPage to max-w-3xl with two-column field grid"
```

---

## Final Verification Checklist

After all 15 tasks are complete, do a final walkthrough:

- [ ] Log out → Login page shows two-column navy/white split
- [ ] Log in → Sidebar is deep navy with gold active link and BookOpen brand icon
- [ ] Header has gold bottom border + user chip (initials circle)
- [ ] Dashboard shows greeting + date, redesigned stat cards with left color borders, quick actions row
- [ ] `/books` → Table header is navy with white labels, rows have gold hover, buttons are visible navy
- [ ] `/books` (while loading) → Shimmer sweep animation, ghost table container
- [ ] `/books/:id` → Full-width two-column layout, progress bar for availability
- [ ] `/books/new` and `/books/:id/edit` → 2-column field grid, full width
- [ ] `/members/:id` → Full-width two-column layout
- [ ] `/members/new` → 2-column field grid
- [ ] Category badges → gold-tint pill
- [ ] Active/Inactive badges → navy / gold-tint
- [ ] Dark mode toggle works → background goes very deep navy, sidebar goes near-black
- [ ] All tests pass: `npm test`
- [ ] TypeScript check passes: `npm run typecheck`
