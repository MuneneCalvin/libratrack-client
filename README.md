# LibraTrack - Frontend

LibraTrack is a browser-based library management interface for administrators,
librarians, and members. The frontend is built with React, TypeScript, Vite, and
Tailwind CSS, and consumes the PHP REST API from the server repository.

The app is intended to demonstrate the full library workflow: managing a catalog,
tracking copies, registering members, borrowing and returning books, reservations,
fines, notifications, reports, and member self-service.

---

## Core Features

- Role-aware dashboards for admin, librarian, and member users.
- Public member sign-up plus staff-created member accounts.
- Book catalog browsing with covers, synopsis, subjects, languages, ratings,
  popularity data, category filters, sorting, and pagination.
- Admin/librarian book management with copy availability tracking.
- Member management with profile details, borrowing history, reservations, fines,
  revoke/restore access, and admin-only member deletion.
- Borrow and return modals with searchable member and book pickers, multi-book
  selection, and borrowing limit checks.
- Reservation, transaction, fine, and member tables with search, filters, sorting,
  and action feedback.
- Notifications from the top navigation bell.
- Reports dashboard with inventory, borrowing, fines, member, and popular-book
  insights.
- Toasts and confirmation dialogs for user actions.
- Responsive layouts for desktop, tablet, and mobile screens.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| UI primitives | Base UI + local UI components |
| Data fetching | TanStack Query v5 |
| Global state | Zustand v5 |
| HTTP client | Axios |
| Routing | React Router DOM v7 |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | Sonner |
| Testing | Vitest + React Testing Library |

---

## Prerequisites

- Node.js 20 or later.
- npm 10 or later.
- The LibraTrack PHP backend installed, migrated, seeded, and running at
  `http://localhost:8000`.

The backend README covers Composer install, `.env` setup, MySQL migrations,
seed data, and the optional Open Library catalog import.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` if your backend is not running on the default local URL:

```env
VITE_API_URL=http://localhost:8000/api
```

The PHP backend must allow the Vite origin in its backend `.env`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

If Vite starts on another port, add that origin to the backend CORS list.

### 3. Start the backend

From the PHP server repository:

```bash
php -S localhost:8000 -t public
```

Keep this terminal open.

### 4. Start the frontend

```bash
npm run dev
```

The app will be available at:

```text
http://localhost:5173
```

---

## Demo Credentials

These credentials are created by the backend seed command:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@libratrack.com` | `Admin@1234` |
| Librarian | `librarian@libratrack.com` | `Librarian@1234` |
| Member | `alice@libratrack.com` | `Member@1234` |
| Member | `bob@libratrack.com` | `Member@1234` |

Members can also self-register from `/signup`.

---

## User Roles

| Role | Main responsibilities |
|---|---|
| Admin | System oversight, settings, reports, books, members, transactions, fines, reservations, member deletion |
| Librarian | Day-to-day library operations: catalog, members, borrow/return, reservations, fines, reports, revoke/restore access |
| Member | Browse books, reserve books, view reservations, fines, notifications, and update their profile/password |

Admin and librarian screens share operational tools, but admin has the higher
system authority. Member users are routed to the member portal.

---

## Main Workflows

### Catalog

- Staff can create, edit, delete, search, filter, sort, and inspect books.
- Members can browse the Open Library-backed catalog, filter by dynamic
  categories, sort by popularity/rating, and reserve available books.
- Book detail pages show metadata such as cover, synopsis, subjects, languages,
  editions, ratings, popularity, and previous borrowing history.

### Members

- Staff can add members manually.
- Public users can sign up as members.
- Admin/librarian can revoke or restore member access.
- Admin can permanently delete a member.
- Users can update account details and reset/update passwords.

### Borrowing and Returns

- Borrowing starts by selecting a member, then searching/selecting available
  books.
- The UI checks the member's borrowing capacity before allowing checkout.
- Returns start by selecting a member, then choosing the currently borrowed books
  to return.
- Partial returns are supported when a transaction has multiple books.

### Reports

- Reports include inventory, borrowing, fines, members, and popular books.
- CSV export is available for supported reports.

---

## Open Library Catalog

The frontend does not call Open Library directly. Books are imported into the
backend database with:

```bash
php scripts/import_openlibrary_books.php --limit=500 --copies=50 --skip-work-details --timeout=60 --retries=6 --page-size=25
```

On Windows, if PHP/OpenSSL cannot verify Open Library SSL certificates, use the
prototype fallback:

```bash
php scripts/import_openlibrary_books.php --limit=500 --copies=50 --skip-work-details --timeout=60 --retries=6 --page-size=25 --insecure
```

After import, the frontend reads the catalog from the normal `/api/books/`
endpoint. Imported records include cover URLs, synopsis text when available,
subjects/tags, language codes, edition counts, ratings, and reading-list
popularity counts.

The app can run while the import is still running. The catalog grows as imported
records are inserted into MySQL.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build production assets into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run lint` | Lint source and test files |
| `npm test` | Run unit tests once |
| `npm run coverage` | Run tests with coverage output |

---

## Project Structure

```text
src/
├── components/          Reusable UI, tables, dialogs, modals, charts
├── hooks/               Auth and notification hooks
├── layouts/             Staff dashboard shell and member portal shell
├── lib/                 Utilities, constants, book metadata helpers
├── pages/               Login, signup, role pages, and resource pages
├── routes/              Route definitions and role guards
├── services/            API clients for each backend resource
└── store/               Zustand auth/UI stores
```

Important page groups:

| Path group | Purpose |
|---|---|
| `src/pages/books/` | Staff catalog management and book details |
| `src/pages/members/` | Member list, member detail, add member |
| `src/pages/transactions/` | Transactions table, borrow/return flows, scoped history |
| `src/pages/reservations/` | Staff reservation table and actions |
| `src/pages/fines/` | Fine list, filters, pay/waive actions |
| `src/pages/reports/` | Charts, metrics, CSV exports |
| `src/pages/portal/` | Member dashboard, browse books, reservations, fines, profile |

---

## API Response Shape

The backend wraps responses in a consistent envelope:

```json
{ "status": "success", "data": { "...": "..." } }
```

Paginated lists include metadata:

```json
{
  "status": "success",
  "data": [],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

Errors use:

```json
{ "status": "error", "message": "Human-readable description" }
```

Some validation errors can include extra metadata, for example borrowing limit
responses can include `activeBorrowCount`, `maxBooks`, and `remainingSlots`.

---

## Authentication Flow

1. Login or member sign-up calls the backend auth endpoint.
2. The server returns a short-lived JWT access token and sets an HttpOnly
   `refreshToken` cookie.
3. The access token is stored in Zustand memory. The user profile is persisted in
   `localStorage` under `libratrack-auth`.
4. Axios attaches the access token to API requests.
5. On `401`, Axios calls `/auth/refresh` and retries the original request.
6. Staff-created members can be forced to change their password before using the
   app.

---

## Building for Production

```bash
npm run build
```

The output is written to `dist/`. In production, serve the static files with a
web server and proxy `/api` requests to the PHP backend.

The repository includes a `Dockerfile` and `nginx.conf` for container-based
static hosting.

---

## Running Tests

```bash
npm test
npm run coverage
```

Tests live under `tests/` and use `jsdom` with React Testing Library.

---

## Local Sharing With a Temporary Tunnel

For prototype testing without deployment, run the backend locally, run the
frontend locally, then tunnel the frontend URL with a tool such as ngrok. When
using a single public frontend URL, make sure API requests are proxied to the
local backend or set `VITE_API_URL` to a reachable backend URL.

Keep the terminal sessions running while testers use the link. The temporary URL
stops working when the tunnel process or local machine stops.

Typical local share order:

```bash
# terminal 1, backend repo
php -S localhost:8000 -t public

# terminal 2, frontend repo
npm run dev

# terminal 3
ngrok http http://127.0.0.1:5173
```
