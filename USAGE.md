# Book Tracking System — Frontend Usage Guide

This guide walks through every feature of the application from the perspective of each user role.

---

## Logging In

1. Open the application in your browser (`http://localhost:5173` in development).
2. Enter your email address and password.
3. Use the eye icon on the password field to reveal or hide what you have typed.
4. Click **Sign In**.

You will be redirected automatically:
- Admins and librarians → **Dashboard**
- Members → **Member Portal**

**First-time login (new members):** A modal will appear immediately requiring you to set a new password. You cannot dismiss it — enter a password of at least 8 characters, confirm it, and click **Set Password & Continue**.

---

## Admin & Librarian — Dashboard

The dashboard displays a live summary of the library's current state:

| Card | Meaning |
|---|---|
| Active Borrows | Books currently out on loan |
| Overdue | Loans past their due date |
| Total Books | Total catalogue size |
| Members | Registered member count |
| Reservations | Pending reservations |
| Unpaid Fines | Total outstanding fines (KES) |

A **Recent Overdue** panel lists members with books past due, showing the book title and how many days overdue.

---

## Books

**Path:** `/books` (admin/librarian)

- **Browse** the full catalogue in a searchable, paginated table.
- **Add a book** — click **Add Book**, fill in title, author, ISBN, category, publisher, year, and number of copies.
- **Edit / Delete** — use the action icons on each row.
- **View book detail** — click the eye icon to see the full record.

---

## Members

**Path:** `/members` (admin/librarian)

### Adding a new member

1. Click **Add Member** (top right).
2. A modal opens — fill in:
   - Full Name *(required)*
   - Email *(required)*
   - Phone *(optional)*
   - Address *(optional)*
   - Default Password — pre-filled with `Library@1234`, editable.
3. Click **Create Member**.
4. A success screen shows the auto-generated **Membership Number** and the **default password** with a copy button. Share these with the member.

The member will be prompted to change their password on first login.

### Viewing / managing members

- **Search** by name or membership number.
- Click the **eye icon** to open a member's detail page (contact info, membership number, join date, active status).
- Admins can **delete** a member using the trash icon.

---

## Transactions — Borrowing Books

**Path:** `/transactions`

### Borrow

1. Click **Borrow** (top right).
2. A modal opens. In the **Member** field, type a name or membership number and select from the dropdown.
3. In the **Books** field, search by title, author, or ISBN. Select one or more books (selected books appear as removable badges above the search box). Books with zero available copies are shown as "Out" and cannot be selected.
4. Click **Borrow (n)** to confirm.

### Return

1. Click **Return** (top right).
2. Search for the member whose book is being returned and select them.
3. The **Active Borrows** panel shows all books currently on loan under that member's account.
4. Select the transaction to return, then click **Confirm Return**.

### Reading the table

| Column | Meaning |
|---|---|
| Member | Who borrowed |
| Books | Titles borrowed in this transaction |
| Borrowed | Borrow date |
| Due | Due date |
| Status | ACTIVE / OVERDUE / RETURNED |
| Fine | Fine amount if overdue (KES) |

---

## Reservations

**Path:** `/reservations` (admin/librarian)

Reservations are displayed as cards. Each card shows:
- Book title and author
- Member name
- Reserved date and expiry date
- Status badge (colour-coded: blue = PENDING, green = READY_FOR_PICKUP, grey = BORROWED/CANCELLED, red = EXPIRED)

**For PENDING reservations**, staff can approve a pickup hold or cancel the request:

| Button | Action |
|---|---|
| **Approve hold** | Holds one copy and marks the reservation as READY_FOR_PICKUP |
| **Cancel** | Cancels the reservation |

**For READY_FOR_PICKUP reservations**, staff can issue the book when the member arrives or cancel the hold to release the copy.

Filter reservations by status using the dropdown at the top.

---

## Fines

**Path:** `/fines`

Displays all fines in the system. Fines are calculated in **Kenyan Shillings (KES)** based on the fine rate per day configured in Settings and the number of days overdue.

Each row shows the member name, book title, days overdue, total amount, and payment status. Admins and librarians can mark fines as paid.

---

## Reports

**Path:** `/reports`

Three stat cards at the top show:
- Active borrows / returned books / overdue count
- Total fines collected vs outstanding (KES)
- Books with zero available copies (unavailable)

Below, two charts display:
- **Inventory by Category** — bar chart of book counts per category
- **Most Borrowed Books** — top books ranked by borrow count

---

## Settings

**Path:** `/settings` (admin only)

Configure the library's operating rules:

| Setting | Description |
|---|---|
| Fine Rate Per Day (KES) | Daily charge per overdue book |
| Max Borrow Days | How long members can keep a book |
| Max Books Per Member | Maximum concurrent borrows per member |
| Reservation Expiry Days | Pickup window after a reservation is approved |

Click **Save Settings** to apply. Changes take effect on the next transaction.

---

## Profile

**Path:** `/profile` (admin/librarian) · `/portal/profile` (member)

Shows your account details:
- Display initials avatar
- Full name and role badge
- Email address
- Account ID / Membership Number
- Member since date (member portal only)
- Phone and address (member portal only)

Access the profile page by clicking your avatar in the top-right header and selecting **My Profile**.

---

## Dark Mode

Click the moon/sun icon in the top header to toggle dark mode. The preference is saved locally and restored on next visit.

---

## Member Portal

Members access a separate area of the application with a simplified interface.

### My Dashboard (`/portal/dashboard`)

Shows:
- Active borrows count
- Pending reservations count
- Outstanding fines (KES)
- An alert banner if any borrows are overdue
- **Currently Borrowed** panel — books on loan with due dates
- **Pending Reservations** panel — reservations awaiting approval

### Browse Books (`/portal/books`)

- Search by title, author, or ISBN.
- Books are shown in a card grid with cover, title, author, category, and availability badge.
- Click **Reserve** to open a confirmation dialog showing full book details (ISBN, publisher, year, copies available).
- Click **Confirm Reserve** to submit. The Reserve button is disabled for books with zero copies.

### My Reservations (`/portal/reservations`)

Lists all your reservations with their current status. You can cancel a PENDING reservation.

### My Fines (`/portal/fines`)

Shows your outstanding and paid fines in KES.

### Notifications (`/portal/notifications`)

In-app notifications from the library — overdue reminders, reservation updates, etc.

---

## Signing Out

Click your avatar in the top-right header and select **Sign Out**, or use the **Sign Out** button at the bottom of the sidebar. Your session is cleared and you are returned to the login page.
