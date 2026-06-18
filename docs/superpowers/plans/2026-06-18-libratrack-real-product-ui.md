# LibraTrack Real Product UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the existing LibraTrack frontend into a polished, professional SaaS-style library operations product without changing routes, features, or backend API contracts.

**Architecture:** Keep the current React/Vite route structure, service layer, React Query data flow, and UI primitive stack. Improve shared tokens and primitives first, then apply them to the staff shell, member shell, auth pages, dashboards, tables, forms, reports, and member portal screens.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, Base UI/shadcn-style primitives, Lucide icons, Recharts, Vitest, Testing Library, MSW.

## Global Constraints

- Do not change backend API contracts.
- Do not prioritize physical shelf/location tracking beyond presenting existing data cleanly.
- Do not add a marketing landing page.
- Do not add a new design framework.
- Do not replace the existing routing model.
- Do not introduce decorative imagery that distracts from daily operations.
- Use `Ink Navy #101827`, `Ledger Gray #F5F7FA`, `Paper White #FFFFFF`, `Catalog Gold #B7791F`, `Success Green #15803D`, `Risk Red #DC2626`, and `Notice Amber #D97706` as the product palette.
- Preserve public `/signup`, member redirect to `/portal/dashboard`, staff add-member flow, and deactivate/reactivate behavior.
- Verify with `npm run lint`, `npm test`, `npm run build`, and browser smoke screenshots on desktop and mobile.

---

## File Structure

- Modify `src/index.css`: global product color tokens, base typography, focus, app background, and reusable utility classes.
- Modify `src/components/ui/button.tsx`: tighten button radius, product hover/focus, danger/outline behavior.
- Modify `src/components/ui/badge.tsx`: add semantic status variants through class usage and keep existing variant API stable.
- Modify `src/components/ui/card.tsx`: flatter product surfaces with less shadow and consistent radius.
- Modify `src/components/ui/input.tsx`, `src/components/ui/select.tsx`, `src/components/ui/table.tsx`: denser form/table product styling.
- Create `src/components/EmptyState.tsx`: shared guided empty state with optional action.
- Create `src/components/StatusChip.tsx`: shared semantic chip for active/inactive/available/unavailable/overdue/pending/paid/unpaid/returned.
- Create `src/components/PageHeader.tsx`: reusable page title, description, eyebrow, and action row.
- Create `src/components/AuthProductPanel.tsx`: shared login/signup brand panel.
- Modify `src/components/DataTable.tsx`: professional table density, empty action support, stable loading skeletons, pagination polish.
- Modify `src/components/StatsCard.tsx`: compact KPI cards for operational dashboards.
- Modify `src/layouts/DashboardLayout.tsx`: staff SaaS shell, sidebar/header polish, page workspace density.
- Modify `src/layouts/PortalLayout.tsx`: lighter member shell using the same product language.
- Modify `src/pages/LoginPage.tsx`, `src/pages/SignupPage.tsx`: polished product entry screens.
- Modify `src/pages/DashboardPage.tsx`: operational dashboard focused on urgent work.
- Modify `src/pages/books/BooksPage.tsx`, `src/pages/books/BookDetailPage.tsx`: catalog-style metadata and actions.
- Modify `src/pages/members/MembersPage.tsx`, `src/pages/members/MemberDetailPage.tsx`: account state, borrowing/fine/reservation hierarchy.
- Modify `src/pages/transactions/TransactionsPage.tsx`, `src/features/transactions/BorrowForm.tsx`, `src/features/transactions/ReturnForm.tsx`: core circulation workflow polish.
- Modify `src/pages/reports/ReportsPage.tsx`, `src/components/ReportChart.tsx`: report dashboard polish and empty states.
- Modify `src/pages/portal/PortalDashboardPage.tsx`, `src/pages/portal/PortalBooksPage.tsx`, `src/pages/portal/PortalReservationsPage.tsx`, `src/pages/portal/PortalFinesPage.tsx`, `src/pages/portal/PortalNotificationsPage.tsx`: member self-service polish.
- Add or update focused tests under `tests/components`, `tests/layouts`, and `tests/pages`.

---

### Task 1: Product Tokens And Shared UI Helpers

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/table.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/StatusChip.tsx`
- Create: `tests/components/ProductUi.test.tsx`

**Interfaces:**
- Produces: `EmptyState({ icon, title, description, action }: EmptyStateProps): JSX.Element`
- Produces: `StatusChip({ status, children, className }: StatusChipProps): JSX.Element`
- Consumes: existing `Button`, `Badge`, Lucide icons, and `cn()`.

- [ ] **Step 1: Write failing tests for shared helpers**

Create `tests/components/ProductUi.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BookOpen } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import StatusChip from '@/components/StatusChip';

describe('product UI helpers', () => {
  it('renders an empty state with an optional action', () => {
    render(
      <EmptyState
        icon={BookOpen}
        title="No books added yet"
        description="Add the first title to start building the catalog."
        action={<button type="button">Add book</button>}
      />,
    );

    expect(screen.getByText('No books added yet')).toBeInTheDocument();
    expect(screen.getByText('Add the first title to start building the catalog.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add book' })).toBeInTheDocument();
  });

  it('renders semantic status chip labels', () => {
    render(
      <>
        <StatusChip status="overdue" />
        <StatusChip status="active" />
        <StatusChip status="unavailable">No copies</StatusChip>
      </>,
    );

    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('No copies')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- tests/components/ProductUi.test.tsx`

Expected: FAIL because `EmptyState` and `StatusChip` do not exist.

- [ ] **Step 3: Implement `EmptyState`**

Create `src/components/EmptyState.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center', className)}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon size={20} aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Implement `StatusChip`**

Create `src/components/StatusChip.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusKind =
  | 'active'
  | 'inactive'
  | 'available'
  | 'unavailable'
  | 'overdue'
  | 'pending'
  | 'paid'
  | 'unpaid'
  | 'returned'
  | 'warning'
  | 'neutral';

interface StatusChipProps {
  status: StatusKind | string;
  children?: ReactNode;
  className?: string;
}

const labels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  available: 'Available',
  unavailable: 'Unavailable',
  overdue: 'Overdue',
  pending: 'Pending',
  paid: 'Paid',
  unpaid: 'Unpaid',
  returned: 'Returned',
  warning: 'Warning',
  neutral: 'Neutral',
};

const classes: Record<string, string> = {
  active: 'border-success/20 bg-success/10 text-success',
  available: 'border-success/20 bg-success/10 text-success',
  paid: 'border-success/20 bg-success/10 text-success',
  inactive: 'border-border bg-muted text-text-secondary',
  returned: 'border-border bg-muted text-text-secondary',
  unavailable: 'border-danger/20 bg-danger/10 text-danger',
  overdue: 'border-danger/20 bg-danger/10 text-danger',
  unpaid: 'border-danger/20 bg-danger/10 text-danger',
  pending: 'border-warning/25 bg-warning/10 text-warning',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  neutral: 'border-border bg-surface-hover text-text-secondary',
};

export default function StatusChip({ status, children, className }: StatusChipProps) {
  const key = String(status).toLowerCase();

  return (
    <Badge variant="outline" className={cn('h-6 rounded-md px-2 text-[0.72rem] font-semibold capitalize', classes[key] ?? classes.neutral, className)}>
      {children ?? labels[key] ?? String(status)}
    </Badge>
  );
}
```

- [ ] **Step 5: Update product tokens and primitive density**

Modify `src/index.css` root tokens to use the approved palette. Keep Tailwind variable names stable:

```css
:root {
  --background: 210 33% 97%;
  --surface: 0 0% 100%;
  --surface-hover: 210 25% 95%;
  --primary: 218 42% 11%;
  --primary-foreground: 0 0% 100%;
  --secondary: 218 22% 28%;
  --accent: 35 73% 42%;
  --accent-soft: 38 66% 92%;
  --text-primary: 218 42% 11%;
  --text-secondary: 217 14% 43%;
  --border: 214 22% 88%;
  --success: 142 72% 29%;
  --warning: 32 95% 44%;
  --danger: 0 72% 51%;
  --sidebar-bg: 218 42% 11%;
  --sidebar-fg: 0 0% 100%;
  --radius: 0.5rem;
}
```

Add base typography and focus polish:

```css
body {
  @apply bg-background text-text-primary antialiased;
  font-feature-settings: "rlig" 1, "calt" 1;
}

:focus-visible {
  outline: 2px solid hsl(var(--accent));
  outline-offset: 2px;
}
```

Update `Button`, `Card`, `Input`, and `Table` classes so controls are denser, flatter, and stable. Preserve exported component names and props.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- tests/components/ProductUi.test.tsx tests/components/DataTable.test.tsx tests/components/ReportChart.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/index.css src/components/ui/button.tsx src/components/ui/badge.tsx src/components/ui/card.tsx src/components/ui/input.tsx src/components/ui/table.tsx src/components/EmptyState.tsx src/components/StatusChip.tsx tests/components/ProductUi.test.tsx
git commit -m "feat: add real product UI primitives"
```

---

### Task 2: Staff And Member Product Shells

**Files:**
- Create: `src/components/PageHeader.tsx`
- Modify: `src/layouts/DashboardLayout.tsx`
- Modify: `src/layouts/PortalLayout.tsx`
- Modify: `tests/layouts/ResponsiveNavigation.test.tsx`

**Interfaces:**
- Produces: `PageHeader({ eyebrow, title, description, actions, meta }: PageHeaderProps): JSX.Element`
- Preserves: mobile buttons named `Open staff navigation` and `Open member navigation`.
- Preserves: desktop and mobile routes for staff and member navigation.

- [ ] **Step 1: Add `PageHeader` tests to the existing layout test file**

Append to `tests/layouts/ResponsiveNavigation.test.tsx`:

```tsx
import PageHeader from '@/components/PageHeader';

it('renders a dense product page header with actions', () => {
  render(
    <PageHeader
      eyebrow="Catalog"
      title="Books"
      description="Search and manage the library collection."
      actions={<button type="button">Add book</button>}
    />,
  );

  expect(screen.getByText('Catalog')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Books' })).toBeInTheDocument();
  expect(screen.getByText('Search and manage the library collection.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add book' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the layout test and verify it fails**

Run: `npm test -- tests/layouts/ResponsiveNavigation.test.tsx`

Expected: FAIL because `PageHeader` does not exist.

- [ ] **Step 3: Implement `PageHeader`**

Create `src/components/PageHeader.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-[1.7rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-text-secondary">{description}</p>}
        {meta && <div className="mt-2 text-xs text-text-secondary">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Redesign `DashboardLayout` shell**

Modify `src/layouts/DashboardLayout.tsx`:

- Keep `navItems` and role filtering.
- Change sidebar to a flatter product sidebar with `w-60` expanded and `w-[4.25rem]` collapsed.
- Keep `Open staff navigation` mobile button.
- Make the header use `bg-surface/95`, border, compact spacing, and a small workspace label.
- Keep dark-mode toggle, notifications, profile menu, logout, and `mustChangePassword`.
- Keep `main` as `flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6`.

Use this active nav class pattern:

```tsx
isActive
  ? 'bg-white/10 text-white font-semibold shadow-inner ring-1 ring-white/10'
  : 'text-white/62 hover:bg-white/8 hover:text-white'
```

- [ ] **Step 5: Redesign `PortalLayout` shell**

Modify `src/layouts/PortalLayout.tsx`:

- Keep `Open member navigation` mobile button.
- Use the same brand treatment as staff, but keep member navigation lighter.
- Keep member routes unchanged.
- Keep profile dropdown and logout behavior.
- Use `main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 min-w-0"`.

- [ ] **Step 6: Run layout tests**

Run: `npm test -- tests/layouts/ResponsiveNavigation.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/PageHeader.tsx src/layouts/DashboardLayout.tsx src/layouts/PortalLayout.tsx tests/layouts/ResponsiveNavigation.test.tsx
git commit -m "feat: polish product navigation shells"
```

---

### Task 3: Auth Entry Experience

**Files:**
- Create: `src/components/AuthProductPanel.tsx`
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/SignupPage.tsx`
- Modify: `tests/pages/LoginPage.test.tsx`
- Modify: `tests/pages/SignupPage.test.tsx`

**Interfaces:**
- Produces: `AuthProductPanel({ mode }: { mode: 'login' | 'signup' }): JSX.Element`
- Preserves: login submit behavior and member signup submit behavior.
- Preserves: `/signup` link text `Create member account` and `/login` link text `Sign in`.

- [ ] **Step 1: Add auth panel tests**

Append to `tests/pages/LoginPage.test.tsx`:

```tsx
it('shows the product operations panel', () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

  expect(screen.getByText('Library operations, organized')).toBeInTheDocument();
  expect(screen.getByText('Catalog')).toBeInTheDocument();
  expect(screen.getByText('Circulation')).toBeInTheDocument();
});
```

Append to `tests/pages/SignupPage.test.tsx`:

```tsx
it('positions signup as member self-service', () => {
  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole('heading', { name: 'Create member account' })).toBeInTheDocument();
  expect(screen.getByText('Member self-service')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run auth tests and verify they fail**

Run: `npm test -- tests/pages/LoginPage.test.tsx tests/pages/SignupPage.test.tsx`

Expected: FAIL because the new product panel copy is not present.

- [ ] **Step 3: Implement `AuthProductPanel`**

Create `src/components/AuthProductPanel.tsx`:

```tsx
import { BookOpen, BarChart3, ArrowLeftRight, ShieldCheck } from 'lucide-react';

interface AuthProductPanelProps {
  mode: 'login' | 'signup';
}

const rows = [
  { label: 'Catalog', value: 'Books and availability', icon: BookOpen },
  { label: 'Circulation', value: 'Borrowing and returns', icon: ArrowLeftRight },
  { label: 'Reports', value: 'Inventory and transactions', icon: BarChart3 },
];

export default function AuthProductPanel({ mode }: AuthProductPanelProps) {
  return (
    <aside className="hidden min-h-screen flex-1 bg-sidebar-bg px-12 py-10 text-white lg:flex">
      <div className="mx-auto flex w-full max-w-xl flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-white">
            <BookOpen size={21} aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">LibraTrack</p>
            <p className="text-xs text-white/55">{mode === 'signup' ? 'Member self-service' : 'Library operations'}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Library operations, organized</p>
            <h1 className="mt-3 max-w-lg text-4xl font-semibold tracking-tight text-white">
              {mode === 'signup' ? 'Reserve, track, and manage your library account.' : 'Run catalog, circulation, and reports from one workspace.'}
            </h1>
          </div>

          <div className="grid gap-3">
            {rows.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-white/8 text-accent">
                  <Icon size={17} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-white/55">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/55">
          <ShieldCheck size={15} className="text-accent" aria-hidden="true" />
          Centralized records with controlled staff and member access.
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Update login and signup pages**

Modify `LoginPage` and `SignupPage`:

- Replace the existing left decorative panel with `<AuthProductPanel mode="login" />` or `<AuthProductPanel mode="signup" />`.
- Keep existing form state and submit logic.
- Use `min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_0.95fr]`.
- Use `Card` only if it frames the form itself; do not put cards inside cards.
- Change button copy to sentence case: `Sign in`, `Create account`.
- Keep accessible labels and existing links.

- [ ] **Step 5: Run auth tests**

Run: `npm test -- tests/pages/LoginPage.test.tsx tests/pages/SignupPage.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/AuthProductPanel.tsx src/pages/LoginPage.tsx src/pages/SignupPage.tsx tests/pages/LoginPage.test.tsx tests/pages/SignupPage.test.tsx
git commit -m "feat: redesign auth entry experience"
```

---

### Task 4: Operational Staff Dashboard

**Files:**
- Modify: `src/components/StatsCard.tsx`
- Modify: `src/pages/DashboardPage.tsx`
- Create: `tests/pages/DashboardPage.test.tsx`
- Modify: `tests/mocks/handlers.ts`

**Interfaces:**
- Preserves: `StatsCard` props `title`, `value`, `icon`, `variant`, `subtitle`.
- Produces: dashboard visible text `What needs attention today`.
- Consumes: existing `reportsService.getSummary()` and `transactionsService.getAll({ status: 'OVERDUE', limit: 5 })`.

- [ ] **Step 1: Add dashboard MSW handlers**

Extend `tests/mocks/handlers.ts` with:

```ts
http.get('/api/reports/summary', () =>
  HttpResponse.json({
    status: 'success',
    data: {
      activeBorrows: 12,
      overdueCount: 3,
      totalBooks: 240,
      totalMembers: 84,
      pendingReservations: 5,
      unpaidFinesTotal: '1500.00',
    },
  }),
),
http.get('/api/transactions', () =>
  HttpResponse.json({
    status: 'success',
    data: [
      {
        id: 1,
        memberName: 'Jane Doe',
        dueDate: new Date().toISOString(),
        items: [{ book: { title: 'Clean Code' } }],
      },
    ],
    meta: { page: 1, limit: 5, total: 1, totalPages: 1 },
  }),
),
```

- [ ] **Step 2: Write dashboard test**

Create `tests/pages/DashboardPage.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DashboardPage from '@/pages/DashboardPage';
import { useAuthStore } from '@/store/auth.store';

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.getState().setAuth(
    { id: 1, email: 'librarian@test.com', role: 'librarian' },
    'token',
  );

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  it('prioritizes operational work', async () => {
    renderDashboard();

    expect(await screen.findByText('What needs attention today')).toBeInTheDocument();
    expect(await screen.findByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Record borrow')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run dashboard test and verify it fails**

Run: `npm test -- tests/pages/DashboardPage.test.tsx`

Expected: FAIL because the current dashboard does not render the new operational heading or command labels.

- [ ] **Step 4: Redesign `StatsCard`**

Modify `src/components/StatsCard.tsx`:

- Keep props unchanged.
- Use flatter surface: `rounded-lg border border-border bg-surface`.
- Remove gradient icon backgrounds.
- Use compact labels and stable value sizing.
- Keep `variant` mapped to semantic text/accent border classes.

The rendered value section should keep this shape:

```tsx
<p className="text-[0.72rem] font-semibold uppercase tracking-wide text-text-secondary">{title}</p>
<p className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{displayValue}</p>
```

- [ ] **Step 5: Redesign `DashboardPage`**

Modify `src/pages/DashboardPage.tsx`:

- Use `PageHeader` with title `What needs attention today`.
- Replace large greeting-first hierarchy with compact meta.
- Add a priority strip for overdue, pending reservations, unpaid fines, and active borrows.
- Keep quick actions but label them `Record borrow`, `Add member`, and `Review overdue`.
- Use `StatusChip` for overdue labels.
- Use `EmptyState` when no overdue transactions exist.

- [ ] **Step 6: Run dashboard test**

Run: `npm test -- tests/pages/DashboardPage.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/StatsCard.tsx src/pages/DashboardPage.tsx tests/pages/DashboardPage.test.tsx tests/mocks/handlers.ts
git commit -m "feat: redesign staff operations dashboard"
```

---

### Task 5: Data Tables, Catalog, Members, And Transactions

**Files:**
- Modify: `src/components/DataTable.tsx`
- Modify: `tests/components/DataTable.test.tsx`
- Modify: `src/pages/books/BooksPage.tsx`
- Modify: `src/pages/books/BookDetailPage.tsx`
- Modify: `src/pages/members/MembersPage.tsx`
- Modify: `src/pages/members/MemberDetailPage.tsx`
- Modify: `src/pages/transactions/TransactionsPage.tsx`
- Modify: `src/features/transactions/BorrowForm.tsx`
- Modify: `src/features/transactions/ReturnForm.tsx`

**Interfaces:**
- Extends: `DataTable` accepts optional `emptyTitle?: string`, `emptyDescription?: string`, and `emptyAction?: React.ReactNode`.
- Preserves: existing `DataTable` props and default behavior.
- Consumes: `PageHeader`, `StatusChip`, `EmptyState`.

- [ ] **Step 1: Extend `DataTable` tests**

Modify `tests/components/DataTable.test.tsx` by adding:

```tsx
it('shows a guided empty action when provided', () => {
  render(
    <DataTable
      columns={columns}
      data={[]}
      emptyTitle="No books added yet"
      emptyDescription="Add the first title to start building the catalog."
      emptyAction={<button type="button">Add book</button>}
    />,
  );

  expect(screen.getByText('No books added yet')).toBeInTheDocument();
  expect(screen.getByText('Add the first title to start building the catalog.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add book' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run table tests and verify they fail**

Run: `npm test -- tests/components/DataTable.test.tsx`

Expected: FAIL because `DataTable` does not accept the guided empty-state props.

- [ ] **Step 3: Implement `DataTable` polish**

Modify `src/components/DataTable.tsx`:

- Add props `emptyTitle`, `emptyDescription`, and `emptyAction`.
- Replace the current table empty cell content with `EmptyState`.
- Keep existing `emptyMessage` fallback by mapping it to `emptyTitle`.
- Tighten loading rows to match final row height.
- Use `text-[0.72rem] uppercase tracking-wide` for headers.
- Keep pagination API unchanged.

The new prop additions should be:

```tsx
emptyTitle?: string;
emptyDescription?: string;
emptyAction?: React.ReactNode;
```

- [ ] **Step 4: Update Books page**

Modify `src/pages/books/BooksPage.tsx`:

- Use `PageHeader` with title `Books` and description `Search, review, and maintain the library catalog.`
- Use a toolbar row with search input and add button.
- Replace availability text with `StatusChip`.
- Use empty props:

```tsx
emptyTitle="No books added yet"
emptyDescription="Add the first title to start building the catalog."
emptyAction={<Button onClick={() => navigate('/books/new')}>Add book</Button>}
```

- [ ] **Step 5: Update Members page**

Modify `src/pages/members/MembersPage.tsx`:

- Use `PageHeader` with title `Members` and description `Manage member accounts, access, and borrowing records.`
- Use `StatusChip status={m.isActive ? 'active' : 'inactive'}`.
- Keep staff add-member modal behavior.
- Keep admin-only delete behavior.
- Add action aria labels for view/delete buttons if missing.

- [ ] **Step 6: Update Transactions page and forms**

Modify `src/pages/transactions/TransactionsPage.tsx`:

- Use `PageHeader` with title `Transactions` and description `Track borrowing, returns, due dates, and fines.`
- Use a compact toolbar with status filter, `Record borrow`, and `Complete return`.
- Use `StatusChip` for `ACTIVE`, `RETURNED`, and `OVERDUE`.
- Use stronger due-date formatting for overdue rows.

Modify `src/features/transactions/BorrowForm.tsx` and `src/features/transactions/ReturnForm.tsx`:

- Keep existing submit behavior.
- Improve section spacing and labels.
- Use specific verbs: `Record borrow` and `Complete return`.
- Highlight overdue/fine summary with `StatusChip` and semantic color classes.

- [ ] **Step 7: Update detail pages**

Modify `src/pages/books/BookDetailPage.tsx` and `src/pages/members/MemberDetailPage.tsx`:

- Use `PageHeader` for title/actions.
- Use `StatusChip` for availability and account state.
- Present metadata in compact label/value grids.
- Keep existing edit, delete, activate/deactivate, and navigation behavior.

- [ ] **Step 8: Run focused tests**

Run: `npm test -- tests/components/DataTable.test.tsx tests/components/ProductUi.test.tsx`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/DataTable.tsx tests/components/DataTable.test.tsx src/pages/books/BooksPage.tsx src/pages/books/BookDetailPage.tsx src/pages/members/MembersPage.tsx src/pages/members/MemberDetailPage.tsx src/pages/transactions/TransactionsPage.tsx src/features/transactions/BorrowForm.tsx src/features/transactions/ReturnForm.tsx
git commit -m "feat: polish catalog member and circulation pages"
```

---

### Task 6: Reports And Member Portal Polish

**Files:**
- Modify: `src/pages/reports/ReportsPage.tsx`
- Modify: `src/components/ReportChart.tsx`
- Modify: `tests/components/ReportChart.test.tsx`
- Modify: `src/pages/portal/PortalDashboardPage.tsx`
- Modify: `src/pages/portal/PortalBooksPage.tsx`
- Modify: `src/pages/portal/PortalReservationsPage.tsx`
- Modify: `src/pages/portal/PortalFinesPage.tsx`
- Modify: `src/pages/portal/PortalNotificationsPage.tsx`

**Interfaces:**
- Preserves: `ReportChart` props `type`, `data`, and `height`.
- Consumes: `PageHeader`, `StatusChip`, `EmptyState`, `StatsCard`.
- Preserves: member book reservation modal and mutation behavior.

- [ ] **Step 1: Strengthen report chart tests**

Modify `tests/components/ReportChart.test.tsx`:

```tsx
it('keeps chart containers accessible when report data exists', () => {
  render(<ReportChart type="bar" data={[{ name: 'Active', value: 4 }]} />);

  expect(screen.queryByText('No report data yet')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run report chart tests**

Run: `npm test -- tests/components/ReportChart.test.tsx`

Expected: PASS before and after the visual changes.

- [ ] **Step 3: Polish reports page**

Modify `src/pages/reports/ReportsPage.tsx`:

- Use `PageHeader` with title `Reports` and description `Review inventory, circulation, overdue, and fine trends.`
- Group export buttons in chart headers.
- Use compact report cards with consistent header spacing.
- Add `EmptyState` where chart datasets are empty.
- Keep admin-only popular books behavior.

- [ ] **Step 4: Polish `ReportChart`**

Modify `src/components/ReportChart.tsx`:

- Preserve existing chart rendering.
- Keep the existing `No report data yet` empty state.
- Use `EmptyState` for empty datasets.
- Adjust margins and height to fit report cards.
- Keep Recharts responsive behavior.

- [ ] **Step 5: Polish member dashboard**

Modify `src/pages/portal/PortalDashboardPage.tsx`:

- Use `PageHeader` with a member-friendly title.
- Keep active borrow, pending reservation, and fine queries unchanged.
- Use compact `StatsCard` cards.
- Use `StatusChip` for overdue and pending states.
- Use `EmptyState` for no borrowed books and no reservations.

- [ ] **Step 6: Polish member book browsing**

Modify `src/pages/portal/PortalBooksPage.tsx`:

- Use `PageHeader` and a stronger search toolbar.
- Keep `BookCover`, reservation dialog, and mutation behavior.
- Reduce card decoration and make availability/action hierarchy clearer.
- Use `StatusChip` for available/unavailable states.
- Use `EmptyState` for no matching books.

- [ ] **Step 7: Polish member reservations/fines/notifications**

Modify:

- `src/pages/portal/PortalReservationsPage.tsx`: use `PageHeader`, `StatusChip`, and guided empty state with `Browse books`.
- `src/pages/portal/PortalFinesPage.tsx`: use `PageHeader`, amount emphasis, paid/unpaid chips, and clear no-fines empty state.
- `src/pages/portal/PortalNotificationsPage.tsx`: use `PageHeader`, read/unread visual states, and clear no-notifications empty state.

- [ ] **Step 8: Run focused tests**

Run: `npm test -- tests/components/ReportChart.test.tsx tests/components/ProductUi.test.tsx`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/pages/reports/ReportsPage.tsx src/components/ReportChart.tsx tests/components/ReportChart.test.tsx src/pages/portal/PortalDashboardPage.tsx src/pages/portal/PortalBooksPage.tsx src/pages/portal/PortalReservationsPage.tsx src/pages/portal/PortalFinesPage.tsx src/pages/portal/PortalNotificationsPage.tsx
git commit -m "feat: polish reports and member portal"
```

---

### Task 7: Full Verification And Browser Review

**Files:**
- No code files expected unless verification exposes layout bugs.

**Interfaces:**
- Verifies: routes, UI stability, mobile overflow, console errors, and production build.

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: exit 0 with no ESLint errors.

- [ ] **Step 2: Run tests**

Run: `npm test`

Expected: all test files pass.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite build exit 0. Existing large chunk warning is acceptable if no new build failure appears.

- [ ] **Step 4: Start local app for browser verification**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite serves the app on an available local port.

- [ ] **Step 5: Capture desktop and mobile smoke screenshots**

Use the in-app browser if available. If it is unavailable, use the existing local Chrome/Playwright fallback. Check these paths:

- `/login`
- `/signup`
- `/dashboard`
- `/books`
- `/members`
- `/transactions`
- `/reports`
- `/portal/dashboard`
- `/portal/books`
- `/portal/reservations`
- `/portal/fines`

Expected:

- No page-level console errors.
- No horizontal overflow at mobile width.
- Sidebar/header controls are reachable.
- Tables and cards do not overlap text.
- Auth pages have consistent product panel/form treatment.
- Staff dashboard foregrounds urgent operational work.
- Member portal is lighter and self-service oriented.

- [ ] **Step 6: Fix verification bugs if found**

If screenshots or console output reveal problems, make only targeted fixes in the affected file and rerun:

```bash
npm run lint
npm test
npm run build
```

- [ ] **Step 7: Commit final verification fixes**

If code changed during verification:

```bash
git add <changed-files>
git commit -m "fix: resolve real product UI verification issues"
```

If no code changed, do not create an empty commit.
