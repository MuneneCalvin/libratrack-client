# Open Library Catalog Import Design

## Objective

Replace the small hardcoded demo book set with a richer starter catalog imported from Open Library. The prototype should ship with about 500 real book records, including cover images where available, so both staff and members can browse a realistic catalog immediately.

LibraTrack remains the source of truth for inventory. Open Library provides metadata only; local database records still control copies, availability, borrowing, reservations, reports, and member activity.

## Product Goals

- Give the prototype a realistic catalog without manually entering hundreds of books.
- Store book covers so catalog and member browse screens look more complete.
- Keep the existing borrowing, returns, reservations, search, and reporting flows unchanged.
- Avoid making the app dependent on Open Library during normal browsing.
- Make the importer repeatable for demos and development resets.

## Non-Goals

- Do not stream the entire Open Library catalog into LibraTrack.
- Do not make members browse external books that are not in local inventory.
- Do not replace existing `/api/books/` endpoints with Open Library calls.
- Do not add paid API dependencies or require users to create API keys for the prototype.
- Do not introduce physical shelf/location tracking as part of this feature.

## Recommended Approach

Create a backend Django management command that imports about 500 books from Open Library into the local `books` table.

The command should:

- Query Open Library using curated search terms or subjects.
- Normalize Open Library records into LibraTrack `Book` fields.
- Store a cover image URL when Open Library provides cover identifiers or ISBNs.
- Default every imported book to `total_copies = 50` and `available_copies = 50`.
- Assign each imported book to a local category.
- Skip books without a usable title, author, and ISBN.
- Skip duplicate ISBNs.
- Stop when the requested import target is reached.

This gives staff and members a real-looking catalog while keeping the current app architecture simple and reliable.

## Data Ownership

### Open Library Owns

- Source title.
- Source author names.
- Source ISBN identifiers.
- Source publisher and first publish year when available.
- Source cover identifiers.
- Source subject/category hints.

### LibraTrack Owns

- Local book ID.
- Local category.
- Total copies.
- Available copies.
- Borrow transactions.
- Reservations.
- Fines.
- Reports.
- Member-visible availability.
- Staff edits after import.

After a book is imported, Open Library is not required for normal app operation.

## Backend Design

### Management Command

Add a command in the backend repo:

```bash
python manage.py import_openlibrary_books --limit 500
```

Recommended options:

```bash
python manage.py import_openlibrary_books --limit 500 --copies 50
```

The first implementation should support `--limit` and `--copies`. Cleanup and dry-run behavior should stay out of scope for the initial prototype importer.

### Source Queries

Use a balanced, hardcoded set of search topics so the catalog does not become one-note:

- Fiction
- Classics
- Science
- Technology
- Programming
- Business
- History
- Biography
- Education
- Health
- Children
- Literature

Each category should request a batch of books from Open Library and map successful results into that local category.

### Import Loop

For each category/search topic:

1. Request a page of Open Library search results.
2. For each result, extract required fields.
3. Choose the best ISBN:
   - Prefer ISBN-13.
   - Fall back to ISBN-10.
   - Skip if no ISBN exists.
4. Skip if the ISBN already exists locally.
5. Resolve or create the matching category.
6. Build the cover URL:
   - Prefer ISBN-based cover URL when ISBN exists.
   - Fall back to cover ID when available.
7. Create the local `Book` record.
8. Continue until the target count is reached or source results are exhausted.

### Field Mapping

| LibraTrack Field | Open Library Source | Notes |
| --- | --- | --- |
| `title` | `title` | Required. Trim long values to model max length. |
| `author` | `author_name[0..n]` | Required. Join multiple authors with comma. |
| `isbn` | `isbn` | Required. Prefer 13-digit ISBN. |
| `category` | Query topic or subject match | Create missing local category if needed. |
| `total_copies` | Command `--copies` | Default 50. |
| `available_copies` | Command `--copies` | Default 50. |
| `publisher` | `publisher[0]` | Optional. |
| `published_year` | `first_publish_year` | Optional. |
| `cover_url` | ISBN or cover ID | Optional but preferred. |

### Cover URL Strategy

Use stable Open Library cover image URLs derived from the imported metadata. If no cover can be generated, leave `cover_url` blank and allow the existing frontend fallback cover treatment to render.

The app should not download and store image files during the prototype phase. Storing remote cover URLs is enough.

### Duplicate Handling

ISBN is already unique in the current backend model, so the importer should check before creating records.

Duplicate policy:

- If ISBN already exists, skip.
- Do not update staff-edited records by default.
- Count skipped duplicates separately in command output.

This avoids overwriting local inventory changes after a demo database has been used.

### Error Handling

The importer should fail gracefully:

- Network timeout: retry a small number of times, then move to the next query.
- Malformed result: skip and count as invalid.
- Missing required fields: skip and count as invalid.
- Duplicate ISBN: skip and count as duplicate.
- Category creation failure: stop and report the error.

At the end, print a clear summary:

```text
Imported: 500
Skipped duplicates: 37
Skipped invalid: 112
Categories created: 12
```

## Frontend Design

No frontend API contract changes are required.

Existing pages should continue using LibraTrack endpoints:

- Staff/admin: `/books`
- Member portal: `/portal/books`
- Borrow flow: `/transactions/borrow`
- Reservation flow: `/portal/reservations`
- Reports: `/reports`

The imported books appear naturally because the existing `Book` model already includes `coverUrl`, `totalCopies`, and `availableCopies`.

If the real-product UI branch is merged, covers should render through the existing `BookCover` behavior. If a book has no cover URL, the fallback category cover remains acceptable.

## Seed Strategy

Keep local seed data for:

- Roles.
- Admin/librarian accounts.
- Member accounts.
- Settings.
- Example transactions.
- Reservations.
- Fines.

Reduce or replace the hardcoded book seed list with the Open Library importer for large catalog population.

Recommended demo setup:

```bash
python seed.py
python manage.py import_openlibrary_books --limit 500 --copies 50
```

The seed script can continue creating a small set of known books used by transaction/reservation examples. The importer should skip duplicates and fill the rest of the catalog.

## User Experience

### Admin/Librarian

- Books page shows about 500 books after import.
- Every imported book starts with 50 total and 50 available copies.
- Staff can still add, edit, or delete books manually.
- Staff can still borrow imported books to members.
- Reports count imported books like normal records.

### Member

- Browse Books shows the same imported catalog.
- Members can search imported books.
- Members can reserve imported books if available.
- Members do not see Open Library as a separate external source.

## Security And Reliability

- Open Library requests should run server-side only.
- No Open Library API key or user credential is needed.
- Normal authenticated app browsing should not call Open Library.
- The importer should be safe to rerun without creating duplicates.
- The importer should use conservative request pacing to avoid unnecessary pressure on Open Library.

## Testing

Backend tests should cover:

- Mapping an Open Library result into a `Book`.
- Skipping results without ISBN.
- Skipping duplicate ISBNs.
- Creating/finding categories.
- Applying default copies of 50.
- Storing cover URL when ISBN or cover ID exists.
- Command stops when the limit is reached.

Frontend tests should not require Open Library. Existing book list/member browse tests can use local mocked `/books/` responses with `coverUrl`.

## Verification

After implementation:

Backend:

```bash
pytest
python manage.py import_openlibrary_books --limit 20 --copies 50
```

Frontend:

```bash
npm run lint
npm test
npm run build
```

Manual smoke:

- Run importer for 500 books.
- Log in as admin/librarian.
- Confirm `/books` lists imported records with covers where available.
- Confirm search works by title, author, and ISBN.
- Borrow an imported book and confirm available copies decrease.
- Log in as member.
- Confirm `/portal/books` lists the same catalog.
- Reserve an imported available book.
- Confirm reports reflect imported inventory.

## Deferred Decisions

- `--clear-existing-demo-books` is not part of the first implementation. Cleanup remains manual.
- Importer query topics are hardcoded for the prototype. They can become configurable later if staff need control.
- Production can later cache cover images locally, but the prototype stores remote cover URLs only.
