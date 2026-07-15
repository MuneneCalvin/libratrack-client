# Reservation Pickup Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build two-step reservation flow: member reserves, staff approves pickup hold, staff issues borrow at pickup, expired holds release copies automatically.

**Architecture:** Backend owns lifecycle rules and copy-count integrity. Frontend becomes thin client with explicit `approve` and `issue` service methods, status labels, and role-specific actions. Existing `reservation_expiry_days` setting becomes pickup window after approval.

**Tech Stack:** Plain PHP backend with PDO repositories/controllers/tests, React + TypeScript frontend with TanStack Query, MSW/Vitest tests.

## Global Constraints

- No new runtime dependencies.
- Existing setting `reservationExpiryDays` controls pickup window.
- Status labels: `Pending`, `Ready for pickup`, `Borrowed`, `Expired`, `Cancelled`.
- Backend statuses: `PENDING`, `READY_FOR_PICKUP`, `BORROWED`, `EXPIRED`, `CANCELLED`.
- Creating `PENDING` reservation does not change `available_copies`.
- Approving reservation decrements `available_copies` once and sets `expires_at = now + reservationExpiryDays`.
- Issuing approved hold creates transaction without decrementing `available_copies` again.
- Expired or cancelled approved hold releases held copy.
- Max-book limit error shown to users: `Member cannot borrow more than {limit}. Return books first or contact librarian`
- Do not commit report document changes.

---

## File Structure

Backend repo root: `../libratrack-new-server`

- Modify `database/migrations/006_update_reservation_pickup_statuses.php`: add migration for new reservation statuses and map old `FULFILLED` to `BORROWED`.
- Modify `src/Repositories/BookRepository.php`: add atomic copy count helpers.
- Modify `src/Repositories/ReservationRepository.php`: add approved-hold lifecycle methods and auto-expiry release.
- Modify `src/Repositories/TransactionRepository.php`: let transaction creation skip copy decrement for already-held copies.
- Modify `src/Services/BorrowingService.php`: add `$copiesAlreadyHeld` parameter.
- Modify `src/Controllers/ReservationController.php`: add `approve()` and `issue()` actions, expire holds before reads, update cancel behavior.
- Modify `src/routes.php`: add `/approve/` and `/issue/`, keep `/fulfill/` as alias to `issue()`.
- Modify `tests/Feature/ReservationEndpointTest.php`: cover approve, issue, expiry, release, permissions, max limit.
- Modify `README.md` and `USAGE.md`: update reservation endpoint language.

Frontend repo root: `./`

- Modify `src/services/reservations.service.ts`: add `approve()` and `issue()`, stop UI usage of `fulfill()`.
- Modify `src/pages/reservations/ReservationsPage.tsx`: status labels, metrics, `Approve hold`, `Issue book`, cancel release copy copy.
- Modify `src/pages/portal/PortalReservationsPage.tsx`: member labels and cancellation rules.
- Modify `src/pages/portal/PortalDashboardPage.tsx`: show ready-for-pickup cards separately from borrowed books.
- Modify `src/pages/members/MemberDetailPage.tsx`: map reservation labels.
- Modify `tests/pages/ReservationsPage.test.tsx`: staff action tests.
- Modify `tests/pages/PortalReservationsPage.test.tsx`: member ready pickup label test.
- Modify `tests/pages/PortalDashboardPage.test.tsx`: ready pickup separate from current borrows.

---

### Task 1: Backend Reservation Lifecycle Core

**Files:**
- Create: `../libratrack-new-server/database/migrations/006_update_reservation_pickup_statuses.php`
- Modify: `../libratrack-new-server/src/Repositories/BookRepository.php`
- Modify: `../libratrack-new-server/src/Repositories/ReservationRepository.php`
- Modify: `../libratrack-new-server/src/Repositories/TransactionRepository.php`
- Modify: `../libratrack-new-server/src/Services/BorrowingService.php`
- Test: `../libratrack-new-server/tests/Feature/ReservationEndpointTest.php`

**Interfaces:**
- Produces: `BookRepository::decrementAvailableCopy(int $bookId): bool`
- Produces: `BookRepository::incrementAvailableCopy(int $bookId): void`
- Produces: `ReservationRepository::approveHold(int $id, DateTimeImmutable $expiresAt): bool`
- Produces: `ReservationRepository::markBorrowed(int $id): void`
- Produces: `ReservationRepository::expireReadyForPickup(DateTimeImmutable $now): int`
- Produces: `TransactionRepository::create(int $memberId, array $bookIds, DateTimeImmutable $dueDate, bool $decrementAvailability = true): int`
- Produces: `BorrowingService::issue(int $memberId, array $bookIds, bool $copiesAlreadyHeld = false): int`

- [ ] **Step 1: Add failing backend lifecycle tests**

Append these tests to `../libratrack-new-server/tests/Feature/ReservationEndpointTest.php` and keep existing helper style:

```php
public function testApproveReservationHoldsCopyWithoutCreatingBorrow(): void
{
    $this->freeAllBorrowSlots();
    $router = $this->router();
    $bookId = $this->createBook();
    $headers = ['authorization' => 'Bearer ' . self::$librarianToken, 'content-type' => 'application/json'];
    $create = $router->dispatch(new Request('POST', '/api/reservations/', [], $headers, [], [
        'bookId' => $bookId,
        'memberId' => self::$memberId,
    ]));
    $reservationId = $create->payload['data']['id'];

    $response = $router->dispatch(new Request('PATCH', "/api/reservations/{$reservationId}/approve/", [], $headers, [], null));

    $this->assertSame(200, $response->statusCode);
    $this->assertSame('READY_FOR_PICKUP', $response->payload['data']['status']);

    $available = self::$pdo->prepare('SELECT available_copies FROM books WHERE id = ?');
    $available->execute([$bookId]);
    $this->assertSame(0, (int) $available->fetchColumn());

    $transactionCount = self::$pdo->prepare(
        'SELECT COUNT(*)
         FROM transactions
         JOIN transaction_items ON transaction_items.transaction_id = transactions.id
         WHERE transactions.member_id = ? AND transaction_items.book_id = ?'
    );
    $transactionCount->execute([self::$memberId, $bookId]);
    $this->assertSame(0, (int) $transactionCount->fetchColumn());
}

public function testIssueApprovedReservationCreatesBorrowWithoutDoubleDecrement(): void
{
    $this->freeAllBorrowSlots();
    $router = $this->router();
    $bookId = $this->createBook();
    $headers = ['authorization' => 'Bearer ' . self::$librarianToken, 'content-type' => 'application/json'];
    $create = $router->dispatch(new Request('POST', '/api/reservations/', [], $headers, [], [
        'bookId' => $bookId,
        'memberId' => self::$memberId,
    ]));
    $reservationId = $create->payload['data']['id'];
    $approve = $router->dispatch(new Request('PATCH', "/api/reservations/{$reservationId}/approve/", [], $headers, [], null));
    $this->assertSame(200, $approve->statusCode);

    $response = $router->dispatch(new Request('PATCH', "/api/reservations/{$reservationId}/issue/", [], $headers, [], null));

    $this->assertSame(200, $response->statusCode);
    $this->assertSame('BORROWED', $response->payload['data']['status']);

    $transaction = self::$pdo->prepare(
        "SELECT transactions.id, transactions.status
         FROM transactions
         JOIN transaction_items ON transaction_items.transaction_id = transactions.id
         WHERE transactions.member_id = ? AND transaction_items.book_id = ? AND transaction_items.returned_at IS NULL
         ORDER BY transactions.id DESC
         LIMIT 1"
    );
    $transaction->execute([self::$memberId, $bookId]);
    $row = $transaction->fetch();
    $this->assertNotFalse($row);
    $this->assertSame('ACTIVE', $row['status']);

    $available = self::$pdo->prepare('SELECT available_copies FROM books WHERE id = ?');
    $available->execute([$bookId]);
    $this->assertSame(0, (int) $available->fetchColumn());
}
```

- [ ] **Step 2: Run failing backend tests**

Run:

```bash
cd ../libratrack-new-server
vendor/bin/phpunit tests/Feature/ReservationEndpointTest.php --filter 'ApproveReservationHoldsCopy|IssueApprovedReservation'
```

Expected: FAIL because `/approve/` and `/issue/` routes do not exist.

- [ ] **Step 3: Add status migration**

Create `../libratrack-new-server/database/migrations/006_update_reservation_pickup_statuses.php`:

```php
<?php

declare(strict_types=1);

return [
    'up' => [
        "UPDATE reservations SET status = 'BORROWED' WHERE status = 'FULFILLED'",
        "ALTER TABLE reservations MODIFY status ENUM('PENDING', 'READY_FOR_PICKUP', 'BORROWED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING'",
    ],
    'down' => [
        "ALTER TABLE reservations MODIFY status ENUM('PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING'",
        "UPDATE reservations SET status = 'FULFILLED' WHERE status = 'BORROWED'",
    ],
];
```

- [ ] **Step 4: Add book copy helpers**

In `../libratrack-new-server/src/Repositories/BookRepository.php`, add methods before `private function toRow`:

```php
public function decrementAvailableCopy(int $bookId): bool
{
    $statement = $this->pdo->prepare(
        'UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0'
    );
    $statement->execute([$bookId]);

    return $statement->rowCount() > 0;
}

public function incrementAvailableCopy(int $bookId): void
{
    $statement = $this->pdo->prepare(
        'UPDATE books SET available_copies = LEAST(total_copies, available_copies + 1) WHERE id = ?'
    );
    $statement->execute([$bookId]);
}
```

- [ ] **Step 5: Add reservation lifecycle repository methods**

In `../libratrack-new-server/src/Repositories/ReservationRepository.php`, add methods before `deleteForMember()`:

```php
public function approveHold(int $id, DateTimeImmutable $expiresAt): bool
{
    $reservation = $this->find($id);
    if ($reservation === null || $reservation['status'] !== 'PENDING') {
        return false;
    }

    $this->pdo->beginTransaction();
    try {
        $decrement = $this->pdo->prepare(
            'UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0'
        );
        $decrement->execute([(int) $reservation['book_id']]);
        if ($decrement->rowCount() === 0) {
            $this->pdo->rollBack();
            return false;
        }

        $update = $this->pdo->prepare(
            "UPDATE reservations SET status = 'READY_FOR_PICKUP', expires_at = ? WHERE id = ? AND status = 'PENDING'"
        );
        $update->execute([$expiresAt->format('Y-m-d H:i:s'), $id]);
        if ($update->rowCount() === 0) {
            $this->pdo->rollBack();
            return false;
        }

        $this->pdo->commit();
        return true;
    } catch (\Throwable $exception) {
        $this->pdo->rollBack();
        throw $exception;
    }
}

public function markBorrowed(int $id): void
{
    $statement = $this->pdo->prepare("UPDATE reservations SET status = 'BORROWED' WHERE id = ?");
    $statement->execute([$id]);
}

public function cancelWithRelease(int $id): void
{
    $reservation = $this->find($id);
    if ($reservation === null) {
        return;
    }

    $this->pdo->beginTransaction();
    try {
        if ($reservation['status'] === 'READY_FOR_PICKUP') {
            $increment = $this->pdo->prepare(
                'UPDATE books SET available_copies = LEAST(total_copies, available_copies + 1) WHERE id = ?'
            );
            $increment->execute([(int) $reservation['book_id']]);
        }
        $statement = $this->pdo->prepare("UPDATE reservations SET status = 'CANCELLED' WHERE id = ?");
        $statement->execute([$id]);
        $this->pdo->commit();
    } catch (\Throwable $exception) {
        $this->pdo->rollBack();
        throw $exception;
    }
}

public function expireReadyForPickup(DateTimeImmutable $now): int
{
    $statement = $this->pdo->prepare(
        "SELECT id, book_id FROM reservations WHERE status = 'READY_FOR_PICKUP' AND expires_at < ?"
    );
    $statement->execute([$now->format('Y-m-d H:i:s')]);
    $rows = $statement->fetchAll();
    if ($rows === []) {
        return 0;
    }

    $this->pdo->beginTransaction();
    try {
        $expire = $this->pdo->prepare("UPDATE reservations SET status = 'EXPIRED' WHERE id = ? AND status = 'READY_FOR_PICKUP'");
        $release = $this->pdo->prepare('UPDATE books SET available_copies = LEAST(total_copies, available_copies + 1) WHERE id = ?');
        $count = 0;
        foreach ($rows as $row) {
            $expire->execute([(int) $row['id']]);
            if ($expire->rowCount() > 0) {
                $release->execute([(int) $row['book_id']]);
                $count++;
            }
        }
        $this->pdo->commit();
        return $count;
    } catch (\Throwable $exception) {
        $this->pdo->rollBack();
        throw $exception;
    }
}
```

- [ ] **Step 6: Support already-held copy transaction creation**

In `../libratrack-new-server/src/Repositories/TransactionRepository.php`, change signature and decrement block:

```php
public function create(int $memberId, array $bookIds, DateTimeImmutable $dueDate, bool $decrementAvailability = true): int
```

Replace loop body with:

```php
foreach ($bookIds as $bookId) {
    $insertItem->execute([$transactionId, $bookId]);
    if ($decrementAvailability) {
        $decrementBook->execute([$bookId]);
        if ($decrementBook->rowCount() === 0) {
            throw new ValidationException('Book is no longer available');
        }
    }
}
```

- [ ] **Step 7: Add held-copy mode to borrowing service**

In `../libratrack-new-server/src/Services/BorrowingService.php`, change signature:

```php
public function issue(int $memberId, array $bookIds, bool $copiesAlreadyHeld = false): int
```

Replace availability check with:

```php
if (!$copiesAlreadyHeld && (int) $book['available_copies'] < 1) {
    throw new ValidationException("Book \"{$book['title']}\" is not available");
}
```

Replace transaction creation with:

```php
return $this->transactions->create($memberId, $bookIds, $dueDate, !$copiesAlreadyHeld);
```

- [ ] **Step 8: Run backend core tests**

Run:

```bash
cd ../libratrack-new-server
php database/migrate.php
vendor/bin/phpunit tests/Feature/ReservationEndpointTest.php --filter 'ApproveReservationHoldsCopy|IssueApprovedReservation'
```

Expected: still FAIL until controller/routes exist.

- [ ] **Step 9: Commit backend core**

Run:

```bash
cd ../libratrack-new-server
git add database/migrations/006_update_reservation_pickup_statuses.php src/Repositories/BookRepository.php src/Repositories/ReservationRepository.php src/Repositories/TransactionRepository.php src/Services/BorrowingService.php tests/Feature/ReservationEndpointTest.php
git commit -m "feat: add reservation pickup lifecycle core"
```

---

### Task 2: Backend Reservation API Actions

**Files:**
- Modify: `../libratrack-new-server/src/Controllers/ReservationController.php`
- Modify: `../libratrack-new-server/src/routes.php`
- Test: `../libratrack-new-server/tests/Feature/ReservationEndpointTest.php`

**Interfaces:**
- Consumes: `ReservationRepository::approveHold()`
- Consumes: `ReservationRepository::markBorrowed()`
- Consumes: `ReservationRepository::cancelWithRelease()`
- Consumes: `ReservationRepository::expireReadyForPickup()`
- Consumes: `BorrowingService::issue($memberId, $bookIds, true)`
- Produces: `ReservationController::approve(Request $request, array $params): Response`
- Produces: `ReservationController::issue(Request $request, array $params): Response`

- [ ] **Step 1: Add failing backend API tests**

Add these tests to `../libratrack-new-server/tests/Feature/ReservationEndpointTest.php`:

```php
public function testExpiredReadyReservationReleasesCopyAndCannotBeIssued(): void
{
    $this->freeAllBorrowSlots();
    $router = $this->router();
    $bookId = $this->createBook();
    $headers = ['authorization' => 'Bearer ' . self::$librarianToken, 'content-type' => 'application/json'];
    $create = $router->dispatch(new Request('POST', '/api/reservations/', [], $headers, [], [
        'bookId' => $bookId,
        'memberId' => self::$memberId,
    ]));
    $reservationId = $create->payload['data']['id'];
    $router->dispatch(new Request('PATCH', "/api/reservations/{$reservationId}/approve/", [], $headers, [], null));

    self::$pdo->prepare("UPDATE reservations SET expires_at = NOW() - INTERVAL 1 DAY WHERE id = ?")->execute([$reservationId]);

    $response = $router->dispatch(new Request('PATCH', "/api/reservations/{$reservationId}/issue/", [], $headers, [], null));

    $this->assertSame(400, $response->statusCode);
    $this->assertSame('Pickup window has expired for this reservation', $response->payload['message']);

    $reservationStatus = self::$pdo->prepare('SELECT status FROM reservations WHERE id = ?');
    $reservationStatus->execute([$reservationId]);
    $this->assertSame('EXPIRED', $reservationStatus->fetchColumn());

    $available = self::$pdo->prepare('SELECT available_copies FROM books WHERE id = ?');
    $available->execute([$bookId]);
    $this->assertSame(1, (int) $available->fetchColumn());
}

public function testCancelReadyReservationReleasesHeldCopy(): void
{
    $this->freeAllBorrowSlots();
    $router = $this->router();
    $bookId = $this->createBook();
    $headers = ['authorization' => 'Bearer ' . self::$librarianToken, 'content-type' => 'application/json'];
    $create = $router->dispatch(new Request('POST', '/api/reservations/', [], $headers, [], [
        'bookId' => $bookId,
        'memberId' => self::$memberId,
    ]));
    $reservationId = $create->payload['data']['id'];
    $router->dispatch(new Request('PATCH', "/api/reservations/{$reservationId}/approve/", [], $headers, [], null));

    $response = $router->dispatch(new Request('PATCH', "/api/reservations/{$reservationId}/cancel/", [], $headers, [], null));

    $this->assertSame(200, $response->statusCode);
    $this->assertSame('CANCELLED', $response->payload['data']['status']);

    $available = self::$pdo->prepare('SELECT available_copies FROM books WHERE id = ?');
    $available->execute([$bookId]);
    $this->assertSame(1, (int) $available->fetchColumn());
}

public function testMemberCannotApproveOrIssueReservation(): void
{
    $router = $this->router();
    $bookId = $this->createBook();
    $memberHeaders = ['authorization' => 'Bearer ' . self::$memberToken, 'content-type' => 'application/json'];
    $staffHeaders = ['authorization' => 'Bearer ' . self::$librarianToken, 'content-type' => 'application/json'];
    $create = $router->dispatch(new Request('POST', '/api/reservations/', [], $memberHeaders, [], ['bookId' => $bookId]));
    $reservationId = $create->payload['data']['id'];

    $approve = $router->dispatch(new Request('PATCH', "/api/reservations/{$reservationId}/approve/", [], $memberHeaders, [], null));
    $this->assertSame(403, $approve->statusCode);

    $router->dispatch(new Request('PATCH', "/api/reservations/{$reservationId}/approve/", [], $staffHeaders, [], null));
    $issue = $router->dispatch(new Request('PATCH', "/api/reservations/{$reservationId}/issue/", [], $memberHeaders, [], null));
    $this->assertSame(403, $issue->statusCode);
}
```

- [ ] **Step 2: Run failing backend API tests**

Run:

```bash
cd ../libratrack-new-server
vendor/bin/phpunit tests/Feature/ReservationEndpointTest.php --filter 'ExpiredReadyReservation|CancelReadyReservation|MemberCannotApproveOrIssue'
```

Expected: FAIL because controller actions/routes are missing.

- [ ] **Step 3: Add expire call helper in controller**

In `../libratrack-new-server/src/Controllers/ReservationController.php`, add private method before `toFrontend()`:

```php
private function expireReadyReservations(): void
{
    $this->reservations->expireReadyForPickup(new DateTimeImmutable());
}
```

Call `$this->expireReadyReservations();` after auth in `index()`, `show()`, and `forMember()`.

- [ ] **Step 4: Add approve action**

In `ReservationController`, add:

```php
public function approve(Request $request, array $params): Response
{
    $payload = $this->authMiddleware->authenticate($request);
    $this->roleMiddleware->authorize($payload, ['admin', 'librarian']);
    $this->expireReadyReservations();

    $id = (int) $params['id'];
    $reservation = $this->reservations->find($id);
    if ($reservation === null) {
        throw new ValidationException('Reservation not found', 404);
    }
    if ($reservation['status'] !== 'PENDING') {
        throw new ValidationException('Reservation is not pending');
    }

    $expiryDays = $this->settings->all()['reservationExpiryDays'];
    $expiresAt = (new DateTimeImmutable())->add(new DateInterval("P{$expiryDays}D"));
    if (!$this->reservations->approveHold($id, $expiresAt)) {
        throw new ValidationException('Book is not available for pickup hold');
    }

    return Response::success($this->toFrontend($this->reservations->find($id)));
}
```

- [ ] **Step 5: Add issue action and adjust fulfill**

Replace current `fulfill()` body with a call to `issue()`:

```php
public function fulfill(Request $request, array $params): Response
{
    return $this->issue($request, $params);
}
```

Add `issue()`:

```php
public function issue(Request $request, array $params): Response
{
    $payload = $this->authMiddleware->authenticate($request);
    $this->roleMiddleware->authorize($payload, ['admin', 'librarian']);
    $this->expireReadyReservations();

    $id = (int) $params['id'];
    $reservation = $this->reservations->find($id);
    if ($reservation === null) {
        throw new ValidationException('Reservation not found', 404);
    }
    if ($reservation['status'] === 'EXPIRED') {
        throw new ValidationException('Pickup window has expired for this reservation');
    }
    if ($reservation['status'] !== 'READY_FOR_PICKUP') {
        throw new ValidationException('Reservation is not ready for pickup');
    }

    $this->borrowing->issue((int) $reservation['member_id'], [(int) $reservation['book_id']], true);
    $this->reservations->markBorrowed($id);

    return Response::success($this->toFrontend($this->reservations->find($id)));
}
```

- [ ] **Step 6: Update cancel action**

Replace final status update in `cancel()`:

```php
if (!in_array($reservation['status'], ['PENDING', 'READY_FOR_PICKUP'], true)) {
    throw new ValidationException('Reservation cannot be cancelled');
}

$this->reservations->cancelWithRelease($id);
```

Keep ownership and staff permission checks unchanged.

- [ ] **Step 7: Add routes**

In `../libratrack-new-server/src/routes.php`, add:

```php
$router->add('PATCH', '/api/reservations/{id}/approve/', fn (Request $request, array $params): Response => $reservationController->approve($request, $params));
$router->add('PATCH', '/api/reservations/{id}/issue/', fn (Request $request, array $params): Response => $reservationController->issue($request, $params));
```

Keep existing `/fulfill/` route pointing to `fulfill()`.

- [ ] **Step 8: Update old fulfill tests**

In `ReservationEndpointTest.php`, rename old immediate-fulfill tests:

- `testAdminCanFulfillReservation` becomes `testAdminCanIssueApprovedReservation`.
- `testFulfillReservationIssuesBorrowAndDecrementsAvailableCopies` becomes covered by Task 1 `testIssueApprovedReservationCreatesBorrowWithoutDoubleDecrement`.
- `testFulfillReservationEnforcesMemberBorrowLimit` should approve first, then call `/issue/`, assert status remains `READY_FOR_PICKUP`.

Use this assertion after limit failure:

```php
$this->assertSame('READY_FOR_PICKUP', $reservationStatus->fetchColumn());
```

- [ ] **Step 9: Run reservation backend suite**

Run:

```bash
cd ../libratrack-new-server
vendor/bin/phpunit tests/Feature/ReservationEndpointTest.php
```

Expected: PASS.

- [ ] **Step 10: Commit backend API**

Run:

```bash
cd ../libratrack-new-server
git add src/Controllers/ReservationController.php src/routes.php tests/Feature/ReservationEndpointTest.php
git commit -m "feat: split reservation approval from issuing"
```

---

### Task 3: Frontend Staff Reservation Flow

**Files:**
- Modify: `src/services/reservations.service.ts`
- Modify: `src/pages/reservations/ReservationsPage.tsx`
- Test: `tests/pages/ReservationsPage.test.tsx`

**Interfaces:**
- Consumes: backend `PATCH /reservations/{id}/approve/`
- Consumes: backend `PATCH /reservations/{id}/issue/`
- Produces: `reservationsService.approve(id: number)`
- Produces: `reservationsService.issue(id: number)`
- Produces: staff table actions `Approve hold`, `Issue book`, `Cancel`

- [ ] **Step 1: Write failing staff reservation tests**

Create `tests/pages/ReservationsPage.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import ReservationsPage from '@/pages/reservations/ReservationsPage';
import { server } from '../mocks/handlers';

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <ReservationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ReservationsPage pickup flow', () => {
  it('shows approve hold for pending and issue book for ready pickup', async () => {
    server.use(
      http.get('*/api/reservations/', () => HttpResponse.json({
        status: 'success',
        data: [
          {
            id: 1,
            memberId: 7,
            memberName: 'Jane Member',
            bookId: 5,
            bookTitle: 'Clean Code',
            bookAuthor: 'Robert Martin',
            bookCoverUrl: null,
            reservedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            status: 'PENDING',
          },
          {
            id: 2,
            memberId: 8,
            memberName: 'Ready Member',
            bookId: 6,
            bookTitle: 'Refactoring',
            bookAuthor: 'Martin Fowler',
            bookCoverUrl: null,
            reservedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            status: 'READY_FOR_PICKUP',
          },
        ],
        meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
      })),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText('Clean Code')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Approve hold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Issue book/i })).toBeInTheDocument();
    expect(screen.getByText('Ready for pickup')).toBeInTheDocument();
  });

  it('calls approve endpoint from approve hold action', async () => {
    const user = userEvent.setup();
    let approved = false;
    server.use(
      http.get('*/api/reservations/', () => HttpResponse.json({
        status: 'success',
        data: [{
          id: 1,
          memberId: 7,
          memberName: 'Jane Member',
          bookId: 5,
          bookTitle: 'Clean Code',
          bookAuthor: 'Robert Martin',
          bookCoverUrl: null,
          reservedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          status: 'PENDING',
        }],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      })),
      http.patch('*/api/reservations/1/approve/', () => {
        approved = true;
        return HttpResponse.json({ status: 'success', data: { id: 1, status: 'READY_FOR_PICKUP' } });
      }),
    );

    renderPage();

    await user.click(await screen.findByRole('button', { name: /Approve hold/i }));
    await user.click(screen.getByRole('button', { name: /Approve hold/i }));

    await waitFor(() => expect(approved).toBe(true));
  });
});
```

- [ ] **Step 2: Run failing frontend staff tests**

Run:

```bash
npm test -- tests/pages/ReservationsPage.test.tsx
```

Expected: FAIL because labels/actions/endpoints still use issue/fulfill behavior.

- [ ] **Step 3: Update reservation service**

Modify `src/services/reservations.service.ts`:

```ts
import { api } from './api';

export const reservationsService = {
  getAll: (params?: Record<string, unknown>) => api.get('/reservations/', { params }),
  getByMember: (memberId: number, params?: Record<string, unknown>) =>
    api.get(`/members/${memberId}/reservations/`, { params }),
  create: (memberId: number, bookId: number) => api.post('/reservations/', { memberId, bookId }),
  cancel: (id: number) => api.patch(`/reservations/${id}/cancel/`),
  approve: (id: number) => api.patch(`/reservations/${id}/approve/`),
  issue: (id: number) => api.patch(`/reservations/${id}/issue/`),
  fulfill: (id: number) => api.patch(`/reservations/${id}/fulfill/`),
};
```

- [ ] **Step 4: Update staff status mapping**

In `src/pages/reservations/ReservationsPage.tsx`, replace `statusVariant` and `formatStatus` with:

```ts
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'default',
  READY_FOR_PICKUP: 'default',
  BORROWED: 'secondary',
  CANCELLED: 'secondary',
  EXPIRED: 'destructive',
};

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    READY_FOR_PICKUP: 'Ready for pickup',
    BORROWED: 'Borrowed',
    FULFILLED: 'Borrowed',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  };
  return labels[status] ?? status.charAt(0) + status.slice(1).toLowerCase();
}
```

- [ ] **Step 5: Replace fulfill mutation with approve and issue mutations**

Replace current `fulfillMutation` with:

```ts
const approveMutation = useMutation({
  mutationFn: reservationsService.approve,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
    setPendingAction(null);
    toast.success('Reservation approved', {
      description: 'Copy held for pickup until the reservation deadline.',
    });
  },
  onError: (error) => {
    toast.error(getApiErrorMessage(error, 'Failed to approve reservation'));
  },
});

const issueMutation = useMutation({
  mutationFn: reservationsService.issue,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reservations });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books });
    setPendingAction(null);
    toast.success('Book issued');
  },
  onError: (error) => {
    toast.error(getApiErrorMessage(error, 'Failed to issue reserved book'));
  },
});
```

Set pending state:

```ts
const isPending = cancelMutation.isPending || approveMutation.isPending || issueMutation.isPending;
```

- [ ] **Step 6: Expand reservation action type and buttons**

Change type:

```ts
type ReservationAction = { type: 'approve' | 'issue' | 'decline'; reservation: Reservation };
```

Replace actions render:

```tsx
render: (reservation: Reservation) => {
  if (reservation.status === 'PENDING') {
    return (
      <TableActionGroup>
        <TableActionButton
          label="Approve hold"
          icon={CheckCircle}
          tone="success"
          disabled={isPending}
          onClick={() => setPendingAction({ type: 'approve', reservation })}
        />
        <TableActionButton
          label="Cancel"
          icon={XCircle}
          tone="danger"
          disabled={isPending}
          onClick={() => setPendingAction({ type: 'decline', reservation })}
        />
      </TableActionGroup>
    );
  }

  if (reservation.status === 'READY_FOR_PICKUP') {
    return (
      <TableActionGroup>
        <TableActionButton
          label="Issue book"
          icon={CheckCircle}
          tone="success"
          disabled={isPending}
          onClick={() => setPendingAction({ type: 'issue', reservation })}
        />
        <TableActionButton
          label="Cancel"
          icon={XCircle}
          tone="danger"
          disabled={isPending}
          onClick={() => setPendingAction({ type: 'decline', reservation })}
        />
      </TableActionGroup>
    );
  }

  return null;
}
```

- [ ] **Step 7: Update confirm submit**

Replace confirm handler:

```tsx
onConfirm={() => {
  if (!pendingAction) return;
  if (pendingAction.type === 'approve') approveMutation.mutate(pendingAction.reservation.id);
  else if (pendingAction.type === 'issue') issueMutation.mutate(pendingAction.reservation.id);
  else cancelMutation.mutate(pendingAction.reservation.id);
}}
```

- [ ] **Step 8: Update confirm copy**

Replace approve branch in `getReservationConfirmCopy` and add issue branch:

```ts
if (action.type === 'approve') {
  return {
    title: 'Approve pickup hold?',
    description: `${reservation.memberName}'s reservation for "${reservation.bookTitle}" will hold one copy until ${formatDate(reservation.expiresAt)}. The book is not borrowed until pickup.`,
    confirmLabel: 'Approve hold',
    eyebrow: 'Pickup hold',
    tone: 'success',
  };
}
if (action.type === 'issue') {
  return {
    title: 'Issue reserved book?',
    description: `${reservation.memberName} has arrived to pick up "${reservation.bookTitle}". This creates an active borrow and counts against their borrowing limit.`,
    confirmLabel: 'Issue book',
    eyebrow: 'Issue book',
    tone: 'success',
  };
}
```

Update decline description:

```ts
description: reservation.status === 'READY_FOR_PICKUP'
  ? `${reservation.memberName}'s pickup hold for "${reservation.bookTitle}" will be cancelled and the held copy will be released.`
  : `${reservation.memberName}'s reservation for "${reservation.bookTitle}" will be cancelled and closed.`,
```

- [ ] **Step 9: Update metrics**

Replace counts:

```ts
const pendingCount = reservations.filter((reservation) => reservation.status === 'PENDING').length;
const readyCount = reservations.filter((reservation) => reservation.status === 'READY_FOR_PICKUP').length;
const borrowedCount = reservations.filter((reservation) => reservation.status === 'BORROWED' || reservation.status === 'FULFILLED').length;
const closedCount = reservations.filter((reservation) => reservation.status === 'CANCELLED' || reservation.status === 'EXPIRED').length;
```

Render metric cards:

```tsx
<MetricCard icon={Clock3} label="Pending" value={pendingCount} />
<MetricCard icon={CheckCircle2} label="Ready for pickup" value={readyCount} />
<MetricCard icon={BookOpen} label="Borrowed" value={borrowedCount} />
<MetricCard icon={TimerReset} label="Closed" value={closedCount} />
```

- [ ] **Step 10: Run frontend staff tests**

Run:

```bash
npm test -- tests/pages/ReservationsPage.test.tsx
```

Expected: PASS.

- [ ] **Step 11: Commit frontend staff flow**

Run:

```bash
git add src/services/reservations.service.ts src/pages/reservations/ReservationsPage.tsx tests/pages/ReservationsPage.test.tsx
git commit -m "feat: add staff pickup hold reservation flow"
```

---

### Task 4: Frontend Member Reservation And Dashboard Flow

**Files:**
- Modify: `src/pages/portal/PortalReservationsPage.tsx`
- Modify: `src/pages/portal/PortalDashboardPage.tsx`
- Modify: `src/pages/members/MemberDetailPage.tsx`
- Test: `tests/pages/PortalReservationsPage.test.tsx`
- Test: `tests/pages/PortalDashboardPage.test.tsx`

**Interfaces:**
- Consumes: reservation statuses `PENDING`, `READY_FOR_PICKUP`, `BORROWED`, `EXPIRED`, `CANCELLED`
- Produces: member label `Ready for pickup - pick up by {date}`
- Produces: dashboard ready pickup card section separate from currently borrowed books

- [ ] **Step 1: Add failing portal reservation label test**

Append to `tests/pages/PortalReservationsPage.test.tsx`:

```tsx
it('shows ready-for-pickup reservations with pickup deadline and no cancel action', async () => {
  server.use(
    http.get('*/api/members/7/reservations/', () => HttpResponse.json({
      status: 'success',
      data: [{
        id: 9,
        bookTitle: 'Clean Code',
        bookAuthor: 'Robert Martin',
        bookCoverUrl: null,
        status: 'READY_FOR_PICKUP',
        reservedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }],
    })),
  );

  renderPage();

  await waitFor(() => expect(screen.getByText('Clean Code')).toBeInTheDocument());
  expect(screen.getByText('Ready for pickup')).toBeInTheDocument();
  expect(screen.getByText(/Pick up by/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Add failing dashboard pickup card test**

Append to `tests/pages/PortalDashboardPage.test.tsx`:

```tsx
it('shows ready pickup reservations separately from borrowed books', async () => {
  useAuthStore.getState().setAuth(
    { id: 2, email: 'member@test.com', role: 'member', memberId: 7 },
    'token',
  );
  server.use(
    http.get('*/api/members/7/', () => HttpResponse.json({ status: 'success', data: { id: 7, fullName: 'Test Member' } })),
    http.get('*/api/members/7/transactions/', () => HttpResponse.json({ status: 'success', data: [] })),
    http.get('*/api/members/7/fines/', () => HttpResponse.json({ status: 'success', data: [] })),
    http.get('*/api/members/7/reservations/', () => HttpResponse.json({
      status: 'success',
      data: [{
        id: 20,
        bookTitle: 'Clean Code',
        bookAuthor: 'Robert Martin',
        bookCoverUrl: 'https://covers.example/clean-code.jpg',
        status: 'READY_FOR_PICKUP',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }],
    })),
    http.get('*/api/books/', () => HttpResponse.json({ status: 'success', data: [], meta: { page: 1, limit: 8, total: 0, totalPages: 1 } })),
  );

  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <PortalDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  await waitFor(() => expect(screen.getByText('Ready for pickup')).toBeInTheDocument());
  expect(screen.getByText('Clean Code')).toBeInTheDocument();
  expect(screen.getByText(/Pick up by/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run failing portal tests**

Run:

```bash
npm test -- tests/pages/PortalReservationsPage.test.tsx tests/pages/PortalDashboardPage.test.tsx
```

Expected: FAIL because ready pickup labels/cards are missing.

- [ ] **Step 4: Update portal reservation status helpers**

In `src/pages/portal/PortalReservationsPage.tsx`, update status helper:

```ts
function formatStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'Pending approval',
    READY_FOR_PICKUP: 'Ready for pickup',
    BORROWED: 'Borrowed',
    FULFILLED: 'Borrowed',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  };
  return labels[status] ?? status;
}
```

Update `ReservationBadge` to use this helper and make `READY_FOR_PICKUP` default variant.

- [ ] **Step 5: Restrict member cancel action**

In portal reservation table action render, keep cancel only for `PENDING`:

```tsx
reservation.status === 'PENDING' ? (
  <div className="flex justify-end">
    <Button
      variant="ghost"
      size="sm"
      className="text-danger"
      disabled={cancelMutation.isPending}
      onClick={() => cancelMutation.mutate(reservation.id)}
    >
      Cancel
    </Button>
  </div>
) : null
```

Add pickup deadline text under title:

```tsx
{reservation.status === 'READY_FOR_PICKUP' && (
  <p className="mt-1 text-xs font-medium text-accent">Pick up by {formatDate(reservation.expiresAt)}</p>
)}
```

- [ ] **Step 6: Update portal dashboard reservation data**

In `src/pages/portal/PortalDashboardPage.tsx`, change reservation type cast:

```ts
const reservations = (resData?.data as { data?: { id: number; bookTitle: string; bookAuthor?: string; bookCoverUrl?: string | null; expiresAt: string; status: string }[] })?.data ?? [];
const pendingRes = reservations.filter((reservation) => reservation.status === 'PENDING');
const readyPickup = reservations.filter((reservation) => reservation.status === 'READY_FOR_PICKUP');
```

Update pending stat:

```tsx
<StatsCard title="Pending Reservations" value={pendingRes.length} icon={CalendarCheck} />
```

- [ ] **Step 7: Add ready pickup card to member dashboard**

Insert card before current borrowed card:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <CalendarCheck size={16} /> Ready for pickup
    </CardTitle>
  </CardHeader>
  <CardContent>
    {readyPickup.length === 0 ? (
      <p className="text-text-secondary text-sm py-2">No books waiting for pickup.</p>
    ) : (
      <div className="divide-y divide-border">
        {readyPickup.map((reservation) => (
          <div key={reservation.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="flex min-w-0 items-center gap-3">
              <BookThumb
                book={{ title: reservation.bookTitle, author: reservation.bookAuthor, coverUrl: reservation.bookCoverUrl ?? undefined }}
                className="size-11 rounded-md"
              />
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">{reservation.bookTitle}</p>
                <p className="truncate text-xs text-text-secondary">{reservation.bookAuthor ?? 'Unknown author'}</p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-medium text-accent">Pick up by {formatDate(reservation.expiresAt)}</span>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

Change the dashboard lower grid wrapper from `xl:grid-cols-[1.2fr_1fr_1fr]` to `xl:grid-cols-[1.1fr_1fr_1fr_1fr]` so ready pickup, current borrows, pending reservations, and fines each have stable desktop space.

- [ ] **Step 8: Update member detail reservation labels**

In `src/pages/members/MemberDetailPage.tsx`, add status label helper near bottom:

```ts
function reservationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    READY_FOR_PICKUP: 'Ready for pickup',
    BORROWED: 'Borrowed',
    FULFILLED: 'Borrowed',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  };
  return labels[status] ?? status;
}
```

Use it where reservation badge currently receives `reservation.status`:

```tsx
badge={reservationStatusLabel(reservation.status)}
```

- [ ] **Step 9: Run portal tests**

Run:

```bash
npm test -- tests/pages/PortalReservationsPage.test.tsx tests/pages/PortalDashboardPage.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Commit member UI flow**

Run:

```bash
git add src/pages/portal/PortalReservationsPage.tsx src/pages/portal/PortalDashboardPage.tsx src/pages/members/MemberDetailPage.tsx tests/pages/PortalReservationsPage.test.tsx tests/pages/PortalDashboardPage.test.tsx
git commit -m "feat: show member pickup holds separately"
```

---

### Task 5: Documentation And Verification

**Files:**
- Modify: `../libratrack-new-server/README.md`
- Modify: `../libratrack-new-server/USAGE.md`

**Interfaces:**
- Consumes: final backend endpoints `/approve/` and `/issue/`
- Produces: updated setup/API docs with reservation lifecycle

- [ ] **Step 1: Update backend API docs**

In `../libratrack-new-server/README.md`, replace reservation endpoint row:

```markdown
| PATCH | `/reservations/{id}/approve/` | Approve reservation and hold one copy for pickup |
| PATCH | `/reservations/{id}/issue/` | Issue approved pickup hold as an active borrow |
| PATCH | `/reservations/{id}/cancel/` | Cancel reservation; ready pickup holds release their copy |
```

Keep `/fulfill/` note:

```markdown
`/reservations/{id}/fulfill/` remains as a compatibility alias for issuing a ready-for-pickup reservation. New clients should use `/issue/`.
```

- [ ] **Step 2: Update usage examples**

In `../libratrack-new-server/USAGE.md`, replace fulfill example with:

````markdown
### Approve a reservation hold

```bash
curl -X PATCH http://localhost:8000/api/reservations/5/approve/ \
  -H "Authorization: Bearer $TOKEN"
```

This changes the reservation to `READY_FOR_PICKUP`, holds one copy, and sets the pickup deadline from `reservation_expiry_days`.

### Issue a reserved book at pickup

```bash
curl -X PATCH http://localhost:8000/api/reservations/5/issue/ \
  -H "Authorization: Bearer $TOKEN"
```

This creates the borrow transaction and changes the reservation to `BORROWED`.
```
````

- [ ] **Step 3: Run backend verification**

Run:

```bash
cd ../libratrack-new-server
vendor/bin/phpunit
```

Expected: PASS.

- [ ] **Step 4: Run frontend verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected:
- `npm test`: PASS
- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS with existing Vite chunk-size warning allowed.

- [ ] **Step 5: Commit docs**

Run:

```bash
cd ../libratrack-new-server
git add README.md USAGE.md
git commit -m "docs: document reservation pickup lifecycle"
```

---

## Final Verification Checklist

- [ ] Member creates reservation; copy count unchanged.
- [ ] Staff approves reservation; status becomes `READY_FOR_PICKUP`; copy count decreases by one.
- [ ] Member dashboard shows ready pickup hold separate from borrowed books.
- [ ] Staff issues ready pickup reservation; transaction created; reservation becomes `BORROWED`; copy count not decremented twice.
- [ ] Return flow returns borrowed copy through existing transaction return logic.
- [ ] Expired ready pickup hold becomes `EXPIRED` and copy count increases by one when reservation endpoints are read.
- [ ] Staff cancelling ready pickup hold releases copy.
- [ ] Member cannot approve or issue.
- [ ] Member cannot cancel ready pickup hold.
- [ ] Max-book limit blocks issue, leaves reservation `READY_FOR_PICKUP`, and shows clean frontend toast.
