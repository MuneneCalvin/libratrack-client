# LibraTrack UI Overhaul — Design Spec

**Date:** 2026-05-15  
**Approach:** Token overhaul + shared component polish (Approach A)  
**Aesthetic:** Deep navy & gold — sophisticated, classy, library-themed  
**Scope:** Full overhaul of theme, shell, and shared components; pages inherit improvements automatically. Targeted fixes for layout issues on detail pages.

---

## 1. Color Token System

### Root Bug Fix
Add `--primary-foreground: 0 0% 100%` to `:root` — this variable is currently missing, causing default button text to be invisible.

### Light Mode Tokens (`index.css` `:root`)

| Token | Value | Purpose |
|---|---|---|
| `--background` | `0 0% 98%` | Clean warm white, not beige |
| `--surface` | `0 0% 100%` | Pure white cards |
| `--surface-hover` | `220 30% 97%` | Subtle navy-tinted hover |
| `--primary` | `220 60% 16%` | Deep rich navy |
| `--primary-foreground` | `0 0% 100%` | White text on navy (bug fix) |
| `--secondary` | `220 40% 30%` | Mid navy |
| `--accent` | `42 72% 52%` | Warm saturated gold |
| `--accent-soft` | `42 72% 92%` | Light gold tint for backgrounds |
| `--text-primary` | `220 50% 10%` | Near-black with navy tint |
| `--text-secondary` | `220 15% 50%` | Cool mid-grey |
| `--border` | `220 20% 88%` | Clean cool-toned border |
| `--success` | `160 84% 35%` | Green (unchanged) |
| `--warning` | `38 92% 50%` | Amber (unchanged) |
| `--danger` | `0 84% 60%` | Red (unchanged) |

### Dark Mode Tokens (`.dark`)

| Token | Value | Purpose |
|---|---|---|
| `--background` | `222 55% 8%` | Very deep navy, near-black |
| `--surface` | `220 50% 13%` | Rich dark navy (not grey) |
| `--surface-hover` | `220 45% 18%` | Slightly lighter navy |
| `--primary` | `210 40% 98%` | Near-white for text/fg |
| `--primary-foreground` | `220 60% 16%` | Navy text on light buttons |
| `--accent` | `42 80% 60%` | Brighter gold on dark bg |
| `--accent-soft` | `42 40% 25%` | Dark gold tint |
| `--text-primary` | `210 40% 98%` | Near white |
| `--text-secondary` | `220 20% 60%` | Muted light |
| `--border` | `220 35% 22%` | Visible but not harsh |

### Additional CSS Variables to Register
```css
--color-primary-foreground: hsl(var(--primary-foreground));
```
Add to the `@theme inline` block in `index.css` (Tailwind v4 source of truth). Also add `'primary-foreground': 'hsl(var(--primary-foreground))'` to `tailwind.config.ts` `theme.extend.colors` for compatibility.

### Shimmer Animation
Add a keyframe sweep animation to `index.css` for use by the skeleton component:
```css
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
```

---

## 2. Sidebar (`DashboardLayout.tsx` & `PortalLayout.tsx`)

### DashboardLayout Sidebar
- **Background**: `bg-primary` (deep navy) in both light and dark modes — sidebar is always the dark anchor
- **Brand header**: `LibraTrack` wordmark in gold (`text-accent`) with a `BookOpen` icon to its left. Height `h-16`, `px-4`
- **Nav links (inactive)**: `text-white/60` with `hover:text-white hover:bg-white/8`
- **Nav links (active)**: `text-accent font-semibold` + `bg-accent/10` + `border-l-2 border-accent` left-strip
- **Collapsed state**: icons are `text-white/60` (inactive) or `text-accent` (active); brand shows only the `BookOpen` icon in gold
- **Logout button**: `text-white/60 hover:text-red-400 hover:bg-white/8`
- **Hamburger toggle**: moved into the sidebar brand header row (right side), so the main header bar is cleaner

### PortalLayout Sidebar
- Same navy background treatment
- "Member Portal" label styled with a `Users` icon in gold

### Header Bar
- Remove hamburger from header (moved to sidebar)
- Add a thin `border-b border-accent/30` (gold tint) instead of grey border
- Replace plain email text with a user chip: circular avatar with initials (navy bg, gold text in dark mode / reversed in light) + user name/email
- Dark mode toggle: styled as a rounded pill icon button with `bg-surface-hover` background
- `NotificationBell`: unchanged, but unread badge dot uses `bg-accent` (gold)

---

## 3. Buttons (`src/components/ui/button.tsx`)

### Variant Changes

| Variant | Light Mode | Dark Mode |
|---|---|---|
| `default` | `bg-primary text-white` hover adds `shadow-md` + gold ring glow | Same |
| `outline` | `border-primary/40 text-primary` hover `bg-primary/5` | `border-accent/50 text-accent` hover `bg-accent/10` |
| `ghost` | hover `bg-primary/6 text-primary` | hover `bg-white/8 text-white` |
| `destructive` | unchanged | unchanged |

- Default size height: `h-8` → `h-9` for `default` and `lg` sizes
- Add `transition-all duration-150` to base class
- Focus visible ring changes to `ring-accent/40` (gold ring)

---

## 4. Badges (`src/components/ui/badge.tsx`)

| Variant | Style |
|---|---|
| `default` | `bg-primary text-white` (navy pill) |
| `secondary` | `bg-accent-soft text-accent` (gold tint pill) |
| `destructive` | `bg-danger/10 text-danger` (red tint) |
| `outline` | `border-border text-text-secondary` |

---

## 5. Inputs (`src/components/ui/input.tsx`)

- Focus ring: `focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent`
- Replaces the current faint default ring with a gold ring

---

## 6. StatsCard (`src/components/StatsCard.tsx`)

- Card gets `border-l-4` colored by variant: gold (default), green (success), red (danger), amber (warning)
- Remove plain `border-border` from card — let the left accent be the only border decoration
- Icon container: `rounded-full` instead of `rounded-lg`, gradient background per variant:
  - default: `bg-gradient-to-br from-accent/20 to-accent/5`
  - success: `bg-gradient-to-br from-success/20 to-success/5`
  - danger: `bg-gradient-to-br from-danger/20 to-danger/5`
  - warning: `bg-gradient-to-br from-warning/20 to-warning/5`
- Icon size: `22` → `24`
- Value: `text-2xl` → `text-3xl font-bold tracking-tight`
- Card hover: `hover:shadow-md hover:-translate-y-0.5 transition-all duration-150`

---

## 7. Dashboard Page (`src/pages/DashboardPage.tsx`)

- **Page header**: greeting line `Good morning/afternoon/evening, [firstName]` in `text-3xl font-bold` + current date in `text-text-secondary text-sm` below it. Greeting period determined by `new Date().getHours()` (morning < 12, afternoon < 18, evening ≥ 18). First name derived from the portion of `user.email` before `@` until a dedicated `fullName` field exists on the user object.
- **Stat cards**: unchanged grid layout, inherit StatsCard improvements
- **Quick Actions row**: below the stats, a row of 3 outlined action cards:
  1. Borrow a Book → `/transactions/borrow`
  2. Add Member → `/members/new`
  3. View Overdue → `/transactions?filter=overdue`
  - Each card: `border border-border rounded-xl p-5 flex items-center gap-4 hover:border-accent/50 hover:bg-accent/5 cursor-pointer transition-all`
  - Icon in a gold circle, label + short description text

---

## 8. DataTable (`src/components/DataTable.tsx`)

### Skeleton (loading state)
- Replace 5 flat `Skeleton` bars with a proper ghost table:
  - One header row: full-width shimmer bar at `h-10` with slightly darker background
  - 6 data rows: each `h-12`, divided into cells matching typical column proportions (25%, 20%, 15%, 15%, 10%, 15%) with `gap-2` between cells
  - Shimmer animation: uses the CSS `shimmer` keyframe (background sweep left-to-right) instead of `animate-pulse`
  - Wrapped in a `rounded-md border border-border` container to match the real table

### Table Styling
- `TableHeader` row: `bg-primary text-white` in light mode; `bg-surface-hover` in dark mode
- `TableHead` text: `text-white/80 font-medium text-xs uppercase tracking-wide` in light mode
- Row hover: `hover:bg-accent/5` (gold tint) instead of grey
- Row borders: `border-b border-border` only (no vertical borders)
- Striped rows: alternate `bg-surface` / `bg-background` for even/odd rows

### Empty State
- Replace plain text with: a centered `Inbox` icon (from lucide-react, `size={40}`, `text-text-secondary/40`) above `No records found.` text

### Pagination
- Prev/Next buttons: `variant="outline"` with navy/gold treatment from the updated button styles
- Page indicator: `font-semibold text-text-primary` instead of muted

---

## 9. Login Page (`src/pages/LoginPage.tsx`)

### Layout
- Two-column split on desktop (`lg:flex`), single-column stacked on mobile

### Left Panel (desktop only, `lg:w-3/5`)
- Background: `bg-primary` (deep navy)
- Content: centered vertically — gold `BookOpen` icon (`size={56}`), `LibraTrack` wordmark in `text-accent text-4xl font-bold`, tagline `Smart Library Management` in `text-white/60`
- Background texture: a subtle radial gradient overlay `radial-gradient(ellipse at 30% 50%, hsl(42 72% 52% / 8%), transparent)`

### Right Panel (`lg:w-2/5`)
- Background: `bg-background` (clean white / dark mode surface)
- Contains the form card with no border — just `shadow-lg` and `rounded-2xl`
- Form title: `Welcome back` in `text-2xl font-bold` + `Sign in to your account` subtitle
- Sign In button: `w-full h-10` (taller than normal) with the default navy variant
- Error: styled as a callout box with `border-l-4 border-danger bg-danger/5 px-4 py-2 rounded` instead of bare red text

### Mobile
- Single column: navy header bar (`bg-primary h-20`) with centered gold logo, then the form card below on background

---

## 10. Detail Page Layout Fixes

### Files affected
- `src/pages/books/BookDetailPage.tsx`
- `src/pages/books/BookEditPage.tsx`
- `src/pages/books/BookNewPage.tsx`
- `src/pages/members/MemberDetailPage.tsx`
- `src/pages/members/MemberNewPage.tsx`

### Change
- Remove `max-w-xl` constraints → replace with `max-w-4xl`
- For detail pages (BookDetail, MemberDetail): convert to a two-column layout:
  - Left column (`col-span-2`): the existing field rows card
  - Right column (`col-span-1`): a summary/actions card with the primary action button (Edit) and key status info
- For form/new pages (BookNew, BookEdit, MemberNew): single wide card, `max-w-3xl`, fields arranged in a 2-column grid where appropriate (e.g., Author + ISBN side by side)

---

## Files Changed

| File | Change |
|---|---|
| `src/index.css` | Full token overhaul, shimmer keyframe, `primary-foreground` token |
| `tailwind.config.ts` | Add `primary-foreground` color mapping |
| `src/layouts/DashboardLayout.tsx` | Navy sidebar, brand header, user chip, gold border on header |
| `src/layouts/PortalLayout.tsx` | Same navy sidebar treatment |
| `src/components/ui/button.tsx` | Fix variants, size bump, gold focus ring |
| `src/components/ui/badge.tsx` | Navy default, gold-tint secondary |
| `src/components/ui/input.tsx` | Gold focus ring |
| `src/components/ui/skeleton.tsx` | Shimmer animation class |
| `src/components/StatsCard.tsx` | Left accent border, gradient icon, larger value text, hover lift |
| `src/components/DataTable.tsx` | Ghost table skeleton, navy header, gold row hover, empty state icon, pagination styling |
| `src/pages/DashboardPage.tsx` | Greeting header, Quick Actions row |
| `src/pages/LoginPage.tsx` | Two-column split layout |
| `src/pages/books/BookDetailPage.tsx` | Remove max-w-xl, two-column layout |
| `src/pages/books/BookEditPage.tsx` | Remove max-w-xl, two-column form grid |
| `src/pages/books/BookNewPage.tsx` | Remove max-w-xl, two-column form grid |
| `src/pages/members/MemberDetailPage.tsx` | Remove max-w-xl, two-column layout |
| `src/pages/members/MemberNewPage.tsx` | Remove max-w-xl, two-column form grid |

---

## Out of Scope
- No changes to backend API calls or data fetching logic
- No new pages or routes
- No icon library changes (stays on lucide-react)
- No animation library additions — all animations via Tailwind/CSS only
