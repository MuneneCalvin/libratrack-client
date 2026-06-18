# LibraTrack Real Product UI Design

## Objective

Move LibraTrack from a clean prototype interface to a polished, real-product SaaS experience while preserving the existing routes, features, roles, and backend contracts.

The target product style is a professional operations dashboard for libraries: calm, structured, data-first, and efficient for repeated daily use by staff, with a simpler but related member portal.

## Product Positioning

LibraTrack should feel like a library operations system that an institution could realistically adopt:

- Staff need fast access to books, members, borrow/return workflows, overdue items, fines, reservations, and reports.
- Members need a lightweight portal for searching books, managing reservations, viewing fines, and reading notifications.
- Admins and librarians need confidence that data is accurate, actions are clear, and risky states are visible.

The design should not read as a marketing landing page, academic archive, or generic admin template. It should be practical SaaS with subtle catalog and circulation-system cues.

## Visual Direction

### Palette

Use a restrained product palette with strong contrast and clear semantic states:

- `Ink Navy` `#101827`: primary navigation, main text emphasis, brand anchor.
- `Ledger Gray` `#F5F7FA`: app background and quiet page surfaces.
- `Paper White` `#FFFFFF`: cards, tables, forms, dialogs.
- `Catalog Gold` `#B7791F`: controlled accent for active nav, primary highlights, and key calls to action.
- `Success Green` `#15803D`: available, paid, active, completed states.
- `Risk Red` `#DC2626`: overdue, unpaid, blocked, destructive states.
- `Notice Amber` `#D97706`: warning, pending, expiring states.

The palette should avoid heavy gradients and decorative color fields. Accent color should be used sparingly so overdue/fine states can command attention.

### Typography

Use a professional sans-serif system with tighter hierarchy:

- Page titles: 24-30px, semibold, tight line-height.
- Section headings: 14-16px, semibold, sentence case unless table labels require uppercase.
- Body/table text: 13-14px, optimized for scan density.
- Metadata labels: 11-12px, medium, muted color.

Do not scale font sizes with viewport width. Avoid oversized hero-style text inside dashboards, cards, tables, and member portal pages.

### Shape And Surface

- Use 6-8px border radius for cards, tables, menus, and dialogs.
- Reduce nested cards. Page sections should feel like structured workspace bands, not stacks of decorative panels.
- Prefer borders, spacing, and background contrast over heavy shadows.
- Keep hover states subtle and stable; hover must not shift layout.

## Layout Strategy

### Staff/Admin Shell

The staff shell remains sidebar-based but should become more product-like:

- Sidebar width should support scanning without dominating the page.
- Active nav should be clear through color, left marker, and text weight.
- Header should show page context, global search where useful, notification access, dark-mode toggle, and account menu.
- Main content should use a consistent max-width only where needed; data-heavy pages should be allowed to use available width.

The staff experience should prioritize operational urgency:

- Overdue items.
- Pending reservations.
- Active borrows due soon.
- Unpaid fines.
- Low inventory or unavailable books.

### Member Portal Shell

The member portal should be visually related but lighter:

- Top navigation/header can remain simpler than staff.
- The sidebar should emphasize member tasks: browse books, reservations, fines, notifications, profile.
- Member pages should reduce admin density and use friendlier empty states.

The member portal should feel like a self-service account area, not a second admin system.

## Page-Level Design

### Login And Signup

Login and signup should feel like a polished product entry point:

- Keep split-screen desktop layout.
- Replace decorative book-spine shapes with a stronger product panel: brand mark, short value statement, and a compact operational preview or system status strip.
- Use the same visual language on login and signup for consistency.
- Make member signup clearly distinct from staff login without creating a separate brand.
- Improve form feedback with inline validation, clear error copy, and stable button loading states.

### Dashboard

The staff dashboard should answer: "What needs attention today?"

Recommended structure:

1. Compact page header with greeting, date, role, and primary action.
2. Priority strip for overdue, due today, pending reservations, and unpaid fines.
3. KPI cards for inventory and activity, with reduced card height and clearer labels.
4. Work queue section for recent overdue or pending actions.
5. Quick actions as compact command buttons, not large decorative cards.

### Books

The books area should feel like a searchable catalog:

- Strong search and filter bar.
- Status chips for availability.
- Compact metadata treatment: author, ISBN, category, shelf/location if present, available copies.
- Detail page should prioritize availability, active borrows, reservation status, and edit actions.

### Members

Member management should highlight account state:

- Active/inactive status should be visible in tables and detail pages.
- Deactivate/reactivate actions should be clearly labeled and visually separated from routine edits.
- Member detail should show borrowing history, fines, reservations, and contact information in a practical hierarchy.

### Transactions

Borrow and return flows should be treated as core operational tasks:

- Forms should feel like guided workflows with clear book/member selection states.
- Return flow should highlight overdue state, fine calculation, and confirmation before completion.
- Transaction list should prioritize status, due date, member, book count, and staff action.

### Reports

Reports should feel presentation-ready:

- Add clearer filter controls and export placement.
- Use chart cards with concise titles and supporting totals.
- Include inventory, transaction, overdue, and fine summaries.
- Keep charts readable and not overly decorative.

### Tables

Tables are the core UI surface and should receive the strongest polish:

- Compact, consistent row height.
- Sticky or visually distinct headers where useful.
- Clear empty state with a specific next action.
- Status chips with semantic color and consistent labels.
- Row actions should be predictable and aligned.
- Mobile should avoid cramped full tables; use responsive row cards or horizontal scroll only where necessary.

### Forms And Modals

- Use consistent label, helper text, error, and disabled styles.
- Primary actions should use specific verbs: "Create member", "Save book", "Record borrow", "Complete return".
- Destructive actions require clear confirmation language.
- Dialogs should be focused and should not contain unnecessary cards.

## Component Architecture

Preserve existing component boundaries but improve shared primitives first:

- `src/index.css`: product tokens, semantic colors, typography defaults.
- `src/layouts/DashboardLayout.tsx`: staff shell, sidebar, header, page context.
- `src/layouts/PortalLayout.tsx`: member shell.
- `src/components/StatsCard.tsx`: compact KPI card treatment.
- `src/components/DataTable.tsx`: table density, loading, empty, pagination polish.
- `src/components/ui/*`: button, input, badge, card, table, dialog consistency.
- Page components should then consume the improved primitives with minimal bespoke styling.

Avoid large rewrites of service, state, or route logic. This is a visual and interaction redesign, not a contract change.

## Data Flow

No backend contract changes are required.

Existing React Query calls, auth state, route protection, and service modules should remain intact. UI changes should wrap or re-present existing data without changing request/response shapes.

Member signup remains:

- Public `/signup`.
- Creates active member account.
- Logs member into `/portal/dashboard`.
- Admin/librarian can still add members manually.
- Deactivation blocks login/API access through the existing active-state behavior.

## Error, Empty, And Loading States

Real-product polish requires consistent states:

- Loading: skeletons should match final layout dimensions.
- Empty: explain the state and provide a relevant action when possible.
- Errors: use plain operational language and, where useful, a retry action.
- Disabled: explain or visually clarify why an action is not available.

Examples:

- Books empty: "No books added yet" with "Add book".
- Reservations empty for member: "You have no reservations" with "Browse books".
- Reports unavailable: "Report data could not be loaded" with "Retry".

## Accessibility And Responsiveness

The redesign should preserve and improve:

- Keyboard focus visibility.
- Sufficient contrast for text and status chips.
- Non-overlapping text on mobile.
- Stable dimensions for tables, cards, buttons, and toolbars.
- Proper labels for icon-only buttons.
- Usable mobile navigation for both staff and member layouts.

## Testing And Verification

Implementation should be verified with:

- `npm run lint`
- `npm test`
- `npm run build`
- Browser smoke checks for:
  - Login.
  - Signup.
  - Staff dashboard.
  - Books list/detail.
  - Members list/detail.
  - Transactions.
  - Reports.
  - Member portal dashboard.
  - Member portal books/reservations/fines.
- Desktop and mobile screenshots for the main shells and auth pages.
- Check for console errors and horizontal mobile overflow.

## Non-Goals

- Do not change backend API contracts.
- Do not prioritize physical shelf/location tracking beyond presenting existing data cleanly.
- Do not add a marketing landing page.
- Do not add a new design framework.
- Do not replace the existing routing model.
- Do not introduce decorative imagery that distracts from daily operations.

## Acceptance Criteria

The redesign is acceptable when:

- The app looks like a credible SaaS product rather than a student prototype.
- Staff can immediately see urgent operational work.
- Tables, forms, dialogs, and dashboards share one visual system.
- Member self-service feels simple and trustworthy.
- Login/signup feel polished and consistent with the product.
- Existing tests, build, and core smoke flows continue to pass.
