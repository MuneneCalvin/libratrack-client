# Reservation Pickup Flow Design

## Objective

Separate reservation approval from borrowing so LibraTrack matches real library workflow:

1. Member reserves a book.
2. Librarian approves the reservation and holds one copy.
3. Member has a configured pickup window to collect the book.
4. Librarian issues the held book only when the member arrives.
5. Expired pickup holds release the copy automatically.

## Current Behavior

The current PHP backend endpoint `PATCH /api/reservations/{id}/fulfill/` immediately creates a borrow transaction and decrements available copies. This makes approval and borrowing the same action, so members can appear to have borrowed books before pickup.

## Target Lifecycle

Reservation statuses shown to users:

| Backend status | UI label | Meaning |
| --- | --- | --- |
| `PENDING` | Pending | Member requested the book; no copy is held yet. |
| `READY_FOR_PICKUP` | Ready for pickup | Librarian approved the request; one copy is held and unavailable to others. |
| `BORROWED` | Borrowed | Member picked up the book; librarian issued it as an active borrow. |
| `EXPIRED` | Expired | Pickup deadline passed; hold cancelled and copy released. |
| `CANCELLED` | Cancelled | Member or staff cancelled the request. |

The existing `Reservation Expiry` setting controls the pickup window. When staff approves a hold, `expires_at` is reset to `now + reservationExpiryDays`.

## Backend Design

### Database

Update reservation status support to include:

- `READY_FOR_PICKUP`
- `BORROWED`

The existing `expires_at` column remains the pickup deadline for approved holds. No separate pickup setting is added.

### API

Add clear endpoints:

- `PATCH /api/reservations/{id}/approve/`
  - Staff only.
  - Allowed only when status is `PENDING`.
  - Validates book still has at least one available copy.
  - Decrements `available_copies` by one.
  - Sets status to `READY_FOR_PICKUP`.
  - Sets `expires_at` to `now + reservationExpiryDays`.

- `PATCH /api/reservations/{id}/issue/`
  - Staff only.
  - Allowed only when status is `READY_FOR_PICKUP`.
  - Runs expiry check first.
  - If expired, sets status to `EXPIRED`, releases copy, and returns validation error.
  - Enforces member max-books limit.
  - Creates borrow transaction for reserved book.
  - Sets reservation status to `BORROWED`.
  - Does not decrement available copies again because approval already held the copy.

- `PATCH /api/reservations/{id}/cancel/`
  - Member can cancel own `PENDING` reservation.
  - Staff can cancel `PENDING` or `READY_FOR_PICKUP`.
  - If cancelling `READY_FOR_PICKUP`, releases held copy.

Keep old `fulfill` route only as compatibility alias to `issue` if needed by tests or older clients. Frontend should stop calling it.

### Expiry Behavior

Auto-expire approved holds without librarian action.

Expiry check runs:

- before listing all reservations,
- before listing member reservations,
- before showing one reservation,
- before issuing a held reservation.

Expiry applies only to `READY_FOR_PICKUP` reservations where `expires_at < now`. For each expired hold:

- status becomes `EXPIRED`,
- held copy is released by incrementing `available_copies` by one,
- reservation is no longer issuable.

This is enough for the prototype. A scheduled cron can be added later without changing user flow.

### Availability Rules

- Creating a `PENDING` reservation does not change copy availability.
- Approving a reservation holds one copy and reduces availability.
- Issuing a held reservation creates the borrow transaction but does not reduce availability again.
- Returning the borrow releases the copy through existing return logic.
- Expiring/cancelling a held reservation releases the held copy.

### Error Handling

Expected errors:

- approving unavailable book: `Book is not available for pickup hold`
- approving non-pending reservation: `Reservation is not pending`
- issuing non-ready reservation: `Reservation is not ready for pickup`
- issuing expired hold: `Pickup window has expired for this reservation`
- max-book limit: existing structured `maxBooks` payload remains so frontend can show:
  `Member cannot borrow more than {limit}. Return books first or contact librarian`

## Frontend Design

### Staff Reservations Page

Update actions:

- `Pending`: show `Approve hold` and `Cancel`.
- `Ready for pickup`: show `Issue book` and `Cancel`.
- `Borrowed`, `Expired`, `Cancelled`: no primary action.

Update confirmation modals:

- Approve hold modal explains copy will be held until pickup deadline.
- Issue book modal explains this creates active borrow and counts against member limit.
- Cancel modal says whether held copy will be released.

Update metrics:

- Pending
- Ready for pickup
- Borrowed
- Closed (`Expired` + `Cancelled`)

### Member Reservations Page

Show clear status labels:

- `Pending approval`
- `Ready for pickup - pick up by {date}`
- `Borrowed`
- `Expired`
- `Cancelled`

Member can cancel only `Pending` reservations. Ready-for-pickup cancellation is staff-only to avoid accidental release after staff has held the copy.

### Member Dashboard

Add pickup-focused reservation summary:

- show ready-for-pickup holds separately from borrowed books,
- include book cover, title, and pickup deadline,
- do not show ready-for-pickup holds under current borrowed books.

Borrowed books continue to come only from transaction endpoints.

### Services

Update frontend reservation service:

- `approve(id)` calls `/reservations/{id}/approve/`
- `issue(id)` calls `/reservations/{id}/issue/`
- `fulfill(id)` removed from UI usage

## Testing

Backend tests:

- creating reservation leaves availability unchanged.
- approving pending reservation changes status to `READY_FOR_PICKUP` and decrements availability once.
- issuing ready reservation creates transaction, sets status `BORROWED`, and does not double-decrement availability.
- expired ready reservation releases copy and cannot be issued.
- cancelling ready reservation releases copy.
- issue enforces max-books limit and leaves reservation `READY_FOR_PICKUP` when limit blocks issuing.
- member cannot approve or issue.

Frontend tests:

- staff reservations table shows `Approve hold` for pending rows.
- staff reservations table shows `Issue book` for ready-for-pickup rows.
- member reservations page displays ready pickup label with pickup deadline.
- member dashboard shows ready pickup cards separately from currently borrowed books.
- issue failure with max-book payload shows approved clean message.

## Rollout Notes

Existing records with status `FULFILLED` represent already-issued reservations from older behavior. Migration should map `FULFILLED` to `BORROWED` or keep display compatibility by rendering `FULFILLED` as `Borrowed`. Preferred prototype path: map `FULFILLED` to `BORROWED` in migration where possible.

Documentation should update reservation language from "fulfill/approve creates borrow" to "approve holds copy, issue creates borrow."
