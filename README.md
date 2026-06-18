# Book Tracking System — Frontend

A full-featured, browser-based interface for the Book Tracking System. Built with React 19 and TypeScript, it provides role-scoped dashboards for administrators, librarians, and library members.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| UI primitives | @base-ui/react |
| Data fetching | @tanstack/react-query v5 |
| Global state | Zustand v5 |
| HTTP client | Axios |
| Routing | React Router DOM v7 |
| Charts | Recharts |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |

---

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- The backend server running (see `../libratrack-new-server/README.md`)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example environment file and update it to point at your running backend:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Type-check and compile production bundle to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run TypeScript compiler without emitting files |
| `npm run lint` | Lint source and test files with ESLint |
| `npm test` | Run unit tests with Vitest |
| `npm run coverage` | Run tests and generate a coverage report |

---

## Project Structure

```
src/
├── components/
│   ├── modals/          # AddMemberModal, BorrowModal, ReturnModal,
│   │                    #   ChangePasswordModal
│   └── ui/              # Reusable primitives (Button, Input, Dialog, …)
├── hooks/               # useAuth
├── layouts/
│   ├── DashboardLayout  # Admin / librarian shell (collapsible sidebar)
│   └── PortalLayout     # Member portal shell
├── lib/                 # Utility functions, route constants
├── pages/
│   ├── portal/          # Member-facing pages
│   ├── books/           # Book catalogue management
│   ├── members/         # Member management
│   ├── transactions/    # Borrow / return records
│   ├── reservations/    # Reservation management (card view)
│   ├── fines/           # Fine tracking (KES)
│   ├── reports/         # Statistics and charts
│   ├── settings/        # Library configuration
│   ├── profile/         # Staff profile page
│   └── notifications/   # In-app notifications
├── routes/              # Route definitions and role guards
├── services/            # API service modules (one per resource)
└── store/               # Zustand stores: auth.store, ui.store
```

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access — all pages, Settings, member deletion |
| **Librarian** | Books, Members (view/add), Transactions, Reservations, Fines, Reports |
| **Member** | Member Portal — dashboard, browse books, reservations, fines, notifications |

---

## Authentication Flow

1. User submits email and password on the Login page.
2. The server returns a short-lived JWT access token (15 min) and sets an HttpOnly `refreshToken` cookie.
3. The access token is stored in Zustand memory; the user profile is persisted to `localStorage` (`libratrack-auth`) so it survives page refresh.
4. An Axios request interceptor silently calls `POST /api/auth/refresh` when a 401 response is received, then retries the original request.
5. New members created by an administrator are flagged `mustChangePassword = true`. A blocking modal forces a password change before any content is accessible.

---

## API Response Format

Every response from the backend is wrapped in a consistent envelope:

```json
// Single object
{ "status": "success", "data": { ... } }

// List with pagination
{ "status": "success", "data": [...], "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 } }

// Error
{ "status": "error", "message": "Human-readable description" }
```

When reading data inside components, access the inner payload with:

```ts
const item  = (response?.data as { data?: T })?.data;
const items = (response?.data as { data?: T[] })?.data ?? [];
```

---

## Building for Production

```bash
npm run build
```

The compiled output lands in `dist/` as a static site. Serve it with any web server (nginx, Caddy, etc.) and proxy `/api` requests to the Django backend.

An `nginx.conf` and `Dockerfile` are included at the repository root for containerised deployments.

---

## Running Tests

```bash
npm test            # run all unit tests
npm run coverage    # run tests with coverage report
```

Tests live under `tests/` and use `jsdom` as the simulated DOM, with `msw` for HTTP mocking.
