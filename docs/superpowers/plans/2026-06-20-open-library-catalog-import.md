# Open Library Catalog Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repeatable backend importer that loads about 500 Open Library books into LibraTrack with cover URLs and 50 available copies per book.

**Architecture:** Open Library is an import/enrichment source only. A pure normalization module converts Open Library search results into local book candidates, and a Django management command creates local `Book` records while preserving LibraTrack as the source of truth for inventory and circulation.

**Tech Stack:** Django 4.2, Django REST Framework 3.15, pytest, pytest-django, Python standard-library `urllib`, existing React/Vite frontend for verification only.

## Global Constraints

- Backend repo root: `/Users/admin/Desktop/Work/Annettes Project/libratrack-new-server`.
- Frontend repo root: `/Users/admin/Desktop/Work/Annettes Project/libratrack-client`.
- The importer must create about 500 local `books` records when run with `--limit 500`.
- Imported books must default to `total_copies = 50` and `available_copies = 50`.
- Open Library must not be called during normal frontend browsing.
- Existing `/api/books/` contracts must remain unchanged.
- Members must browse only local LibraTrack inventory, not external Open Library results.
- Do not add paid API dependencies or require API keys.
- Do not add physical shelf/location tracking.
- Use the existing `cover_url` database field; do not download image files.
- Backend implementation requires write access to the backend repo.

---

## File Structure

Backend files:

- `apps/books/openlibrary_importer.py`: pure Open Library constants, fetch helper, ISBN selection, cover URL generation, and result normalization.
- `apps/books/management/__init__.py`: Django management package marker for the books app.
- `apps/books/management/commands/__init__.py`: Django command package marker.
- `apps/books/management/commands/import_openlibrary_books.py`: command-line importer that creates categories and books.
- `tests/test_openlibrary_importer.py`: unit tests for pure normalization/fetch helper behavior.
- `tests/test_import_openlibrary_command.py`: command tests using monkeypatched Open Library responses.
- `README.md`: add demo setup command.
- `USAGE.md`: add importer usage details.

Frontend files:

- No frontend source changes are required. Run frontend verification after backend implementation because catalog screens consume the imported local records through existing `/api/books/` endpoints.

---

### Task 1: Open Library Normalization Module

**Files:**
- Create: `apps/books/openlibrary_importer.py`
- Test: `tests/test_openlibrary_importer.py`

**Interfaces:**
- Produces: `TOPIC_QUERIES: tuple[tuple[str, str], ...]`
- Produces: `OpenLibraryBookCandidate`
- Produces: `choose_isbn(isbns: list[str] | None) -> str | None`
- Produces: `build_cover_url(isbn: str | None, cover_id: object) -> str | None`
- Produces: `normalize_openlibrary_doc(doc: dict[str, object], category_name: str) -> OpenLibraryBookCandidate | None`
- Produces: `fetch_openlibrary_docs(query: str, page: int = 1, limit: int = 100, timeout: int = 10) -> list[dict[str, object]]`

- [ ] **Step 1: Write failing normalizer tests**

Create `tests/test_openlibrary_importer.py` with:

```python
import json

from apps.books import openlibrary_importer as importer


def test_choose_isbn_prefers_isbn_13():
    assert importer.choose_isbn(['0-13-235088-2', '978-0132350884']) == '9780132350884'


def test_choose_isbn_falls_back_to_isbn_10():
    assert importer.choose_isbn(['0-13-235088-2']) == '0132350882'


def test_build_cover_url_prefers_isbn():
    assert (
        importer.build_cover_url('9780132350884', 12345)
        == 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg'
    )


def test_build_cover_url_falls_back_to_cover_id():
    assert (
        importer.build_cover_url(None, 12345)
        == 'https://covers.openlibrary.org/b/id/12345-L.jpg'
    )


def test_normalize_openlibrary_doc_maps_book_fields():
    doc = {
        'title': 'Clean Code',
        'author_name': ['Robert C. Martin'],
        'isbn': ['0132350882', '9780132350884'],
        'publisher': ['Prentice Hall'],
        'first_publish_year': 2008,
        'cover_i': 12345,
    }

    candidate = importer.normalize_openlibrary_doc(doc, 'Technology')

    assert candidate is not None
    assert candidate.title == 'Clean Code'
    assert candidate.author == 'Robert C. Martin'
    assert candidate.isbn == '9780132350884'
    assert candidate.category_name == 'Technology'
    assert candidate.publisher == 'Prentice Hall'
    assert candidate.published_year == 2008
    assert candidate.cover_url == 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg'


def test_normalize_openlibrary_doc_skips_missing_required_fields():
    assert importer.normalize_openlibrary_doc({'title': 'No ISBN', 'author_name': ['A']}, 'Fiction') is None
    assert importer.normalize_openlibrary_doc({'isbn': ['9780132350884'], 'author_name': ['A']}, 'Fiction') is None
    assert importer.normalize_openlibrary_doc({'title': 'No Author', 'isbn': ['9780132350884']}, 'Fiction') is None


def test_fetch_openlibrary_docs_builds_search_request(monkeypatch):
    captured = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def read(self):
            return json.dumps({'docs': [{'title': 'Example'}]}).encode('utf-8')

    def fake_urlopen(request, timeout):
        captured['url'] = request.full_url
        captured['timeout'] = timeout
        captured['user_agent'] = request.get_header('User-agent')
        return FakeResponse()

    monkeypatch.setattr(importer, 'urlopen', fake_urlopen)

    docs = importer.fetch_openlibrary_docs('programming', page=2, limit=25, timeout=7)

    assert docs == [{'title': 'Example'}]
    assert captured['url'].startswith('https://openlibrary.org/search.json?')
    assert 'q=programming' in captured['url']
    assert 'page=2' in captured['url']
    assert 'limit=25' in captured['url']
    assert 'fields=title%2Cauthor_name%2Cisbn%2Cpublisher%2Cfirst_publish_year%2Ccover_i' in captured['url']
    assert captured['timeout'] == 7
    assert captured['user_agent'] == 'LibraTrack Open Library importer'
```

- [ ] **Step 2: Run the normalizer tests to verify they fail**

Run from backend root:

```bash
venv/bin/python -m pytest tests/test_openlibrary_importer.py -v
```

Expected: FAIL with `ImportError` or `ModuleNotFoundError` because `apps.books.openlibrary_importer` does not exist yet.

- [ ] **Step 3: Implement the normalizer module**

Create `apps/books/openlibrary_importer.py` with:

```python
import json
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json'
OPEN_LIBRARY_COVER_BASE_URL = 'https://covers.openlibrary.org/b'
SEARCH_FIELDS = 'title,author_name,isbn,publisher,first_publish_year,cover_i'
MAX_TITLE_LENGTH = 500
MAX_AUTHOR_LENGTH = 500
MAX_PUBLISHER_LENGTH = 255

TOPIC_QUERIES = (
    ('Fiction', 'fiction'),
    ('Classics', 'classic literature'),
    ('Science', 'science'),
    ('Technology', 'technology'),
    ('Programming', 'computer programming'),
    ('Business', 'business'),
    ('History', 'history'),
    ('Biography', 'biography'),
    ('Education', 'education'),
    ('Health', 'health'),
    ('Children', 'children books'),
    ('Literature', 'literature'),
)


@dataclass(frozen=True)
class OpenLibraryBookCandidate:
    title: str
    author: str
    isbn: str
    category_name: str
    publisher: str | None = None
    published_year: int | None = None
    cover_url: str | None = None


def _clean_text(value: Any, max_length: int) -> str:
    return str(value).strip()[:max_length]


def _first_text(values: Any, max_length: int) -> str | None:
    if isinstance(values, list):
        for value in values:
            cleaned = _clean_text(value, max_length)
            if cleaned:
                return cleaned
        return None
    cleaned = _clean_text(values, max_length) if values is not None else ''
    return cleaned or None


def _normalize_isbn(value: Any) -> str:
    return ''.join(char for char in str(value).upper() if char.isdigit() or char == 'X')


def _is_isbn_13(value: str) -> bool:
    return len(value) == 13 and value.isdigit()


def _is_isbn_10(value: str) -> bool:
    return len(value) == 10 and value[:9].isdigit() and (value[9].isdigit() or value[9] == 'X')


def choose_isbn(isbns: list[str] | None) -> str | None:
    normalized = [_normalize_isbn(isbn) for isbn in isbns or []]
    for isbn in normalized:
        if _is_isbn_13(isbn):
            return isbn
    for isbn in normalized:
        if _is_isbn_10(isbn):
            return isbn
    return None


def build_cover_url(isbn: str | None, cover_id: object) -> str | None:
    if isbn:
        return f'{OPEN_LIBRARY_COVER_BASE_URL}/isbn/{isbn}-L.jpg'
    if cover_id:
        return f'{OPEN_LIBRARY_COVER_BASE_URL}/id/{cover_id}-L.jpg'
    return None


def normalize_openlibrary_doc(
    doc: dict[str, object],
    category_name: str,
) -> OpenLibraryBookCandidate | None:
    title = _first_text(doc.get('title'), MAX_TITLE_LENGTH)
    author_names = doc.get('author_name')
    author = None
    if isinstance(author_names, list):
        authors = [_clean_text(author, MAX_AUTHOR_LENGTH) for author in author_names]
        author = ', '.join(author for author in authors if author)[:MAX_AUTHOR_LENGTH]

    isbn_values = doc.get('isbn')
    isbn = choose_isbn(isbn_values if isinstance(isbn_values, list) else None)

    if not title or not author or not isbn:
        return None

    publisher = _first_text(doc.get('publisher'), MAX_PUBLISHER_LENGTH)
    published_year = doc.get('first_publish_year')
    if not isinstance(published_year, int):
        published_year = None

    return OpenLibraryBookCandidate(
        title=title,
        author=author,
        isbn=isbn,
        category_name=category_name,
        publisher=publisher,
        published_year=published_year,
        cover_url=build_cover_url(isbn, doc.get('cover_i')),
    )


def fetch_openlibrary_docs(
    query: str,
    page: int = 1,
    limit: int = 100,
    timeout: int = 10,
) -> list[dict[str, object]]:
    params = urlencode(
        {
            'q': query,
            'page': page,
            'limit': limit,
            'fields': SEARCH_FIELDS,
        }
    )
    request = Request(
        f'{OPEN_LIBRARY_SEARCH_URL}?{params}',
        headers={'User-Agent': 'LibraTrack Open Library importer'},
    )
    with urlopen(request, timeout=timeout) as response:
        payload = json.loads(response.read().decode('utf-8'))

    docs = payload.get('docs', [])
    return docs if isinstance(docs, list) else []
```

- [ ] **Step 4: Run the normalizer tests to verify they pass**

Run:

```bash
venv/bin/python -m pytest tests/test_openlibrary_importer.py -v
```

Expected: PASS for all tests in `tests/test_openlibrary_importer.py`.

- [ ] **Step 5: Commit Task 1**

```bash
git add apps/books/openlibrary_importer.py tests/test_openlibrary_importer.py
git commit -m "feat: add Open Library book normalization"
```

---

### Task 2: Import Management Command

**Files:**
- Create: `apps/books/management/__init__.py`
- Create: `apps/books/management/commands/__init__.py`
- Create: `apps/books/management/commands/import_openlibrary_books.py`
- Test: `tests/test_import_openlibrary_command.py`

**Interfaces:**
- Consumes: `TOPIC_QUERIES`
- Consumes: `fetch_openlibrary_docs(query: str, page: int = 1, limit: int = 100, timeout: int = 10) -> list[dict[str, object]]`
- Consumes: `normalize_openlibrary_doc(doc: dict[str, object], category_name: str) -> OpenLibraryBookCandidate | None`
- Produces: Django management command `import_openlibrary_books`
- Produces: command options `--limit` and `--copies`

- [ ] **Step 1: Write failing command tests**

Create `tests/test_import_openlibrary_command.py` with:

```python
import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from apps.books.management.commands import import_openlibrary_books as command_module
from apps.books.models import Book
from apps.categories.models import Category


def make_doc(title, isbn):
    return {
        'title': title,
        'author_name': ['Demo Author'],
        'isbn': [isbn],
        'publisher': ['Demo Publisher'],
        'first_publish_year': 2020,
        'cover_i': 12345,
    }


@pytest.mark.django_db
def test_import_command_creates_books_with_default_copy_count(monkeypatch):
    docs = [
        make_doc('Imported One', '9780000000001'),
        make_doc('Imported Two', '9780000000002'),
    ]

    def fake_fetch(query, page=1, limit=100, timeout=10):
        return docs if query == 'fiction' and page == 1 else []

    monkeypatch.setattr(command_module, 'fetch_openlibrary_docs', fake_fetch)

    call_command('import_openlibrary_books', limit=2, copies=50)

    assert Book.objects.count() == 2
    first = Book.objects.get(isbn='9780000000001')
    assert first.title == 'Imported One'
    assert first.author == 'Demo Author'
    assert first.category.name == 'Fiction'
    assert first.total_copies == 50
    assert first.available_copies == 50
    assert first.publisher == 'Demo Publisher'
    assert first.published_year == 2020
    assert first.cover_url == 'https://covers.openlibrary.org/b/isbn/9780000000001-L.jpg'


@pytest.mark.django_db
def test_import_command_skips_duplicate_isbns(monkeypatch):
    category = Category.objects.create(name='Fiction')
    Book.objects.create(
        title='Existing Book',
        author='Existing Author',
        isbn='9780000000001',
        category=category,
        total_copies=3,
        available_copies=3,
    )

    def fake_fetch(query, page=1, limit=100, timeout=10):
        return [make_doc('Duplicate Book', '9780000000001')] if page == 1 else []

    monkeypatch.setattr(command_module, 'fetch_openlibrary_docs', fake_fetch)

    call_command('import_openlibrary_books', limit=1, copies=50)

    assert Book.objects.count() == 1
    existing = Book.objects.get(isbn='9780000000001')
    assert existing.title == 'Existing Book'
    assert existing.total_copies == 3
    assert existing.available_copies == 3


@pytest.mark.django_db
def test_import_command_skips_invalid_results(monkeypatch):
    def fake_fetch(query, page=1, limit=100, timeout=10):
        return [{'title': 'Missing ISBN', 'author_name': ['Demo Author']}] if page == 1 else []

    monkeypatch.setattr(command_module, 'fetch_openlibrary_docs', fake_fetch)

    call_command('import_openlibrary_books', limit=1, copies=50)

    assert Book.objects.count() == 0


@pytest.mark.django_db
def test_import_command_stops_at_limit(monkeypatch):
    docs = [
        make_doc('Imported One', '9780000000001'),
        make_doc('Imported Two', '9780000000002'),
        make_doc('Imported Three', '9780000000003'),
    ]

    def fake_fetch(query, page=1, limit=100, timeout=10):
        return docs if query == 'fiction' and page == 1 else []

    monkeypatch.setattr(command_module, 'fetch_openlibrary_docs', fake_fetch)

    call_command('import_openlibrary_books', limit=2, copies=50)

    assert Book.objects.count() == 2
    assert not Book.objects.filter(isbn='9780000000003').exists()


@pytest.mark.django_db
def test_import_command_continues_after_source_failure(monkeypatch):
    calls = []

    def fake_fetch(query, page=1, limit=100, timeout=10):
        calls.append((query, page))
        if query == 'fiction':
            raise TimeoutError('network timeout')
        if query == 'classic literature' and page == 1:
            return [make_doc('Classic Import', '9780000000099')]
        return []

    monkeypatch.setattr(command_module, 'fetch_openlibrary_docs', fake_fetch)
    monkeypatch.setattr(command_module.time, 'sleep', lambda seconds: None)

    call_command('import_openlibrary_books', limit=1, copies=50)

    assert Book.objects.count() == 1
    assert Book.objects.get().title == 'Classic Import'
    assert ('fiction', 1) in calls
    assert ('classic literature', 1) in calls


def test_import_command_rejects_invalid_limit():
    with pytest.raises(CommandError, match='--limit must be greater than 0'):
        call_command('import_openlibrary_books', limit=0, copies=50)


def test_import_command_rejects_invalid_copies():
    with pytest.raises(CommandError, match='--copies must be greater than 0'):
        call_command('import_openlibrary_books', limit=1, copies=0)
```

- [ ] **Step 2: Run command tests to verify they fail**

Run:

```bash
venv/bin/python -m pytest tests/test_import_openlibrary_command.py -v
```

Expected: FAIL because `apps.books.management.commands.import_openlibrary_books` does not exist yet.

- [ ] **Step 3: Create Django command package markers**

Create empty files:

```python
# apps/books/management/__init__.py
```

```python
# apps/books/management/commands/__init__.py
```

- [ ] **Step 4: Implement the import command**

Create `apps/books/management/commands/import_openlibrary_books.py` with:

```python
import time

from django.core.management.base import BaseCommand, CommandError

from apps.books.models import Book
from apps.books.openlibrary_importer import (
    TOPIC_QUERIES,
    fetch_openlibrary_docs,
    normalize_openlibrary_doc,
)
from apps.categories.models import Category


class Command(BaseCommand):
    help = 'Import book metadata from Open Library into the local LibraTrack catalog'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=500)
        parser.add_argument('--copies', type=int, default=50)

    def handle(self, *args, **options):
        target = options['limit']
        copies = options['copies']

        if target < 1:
            raise CommandError('--limit must be greater than 0')
        if copies < 1:
            raise CommandError('--copies must be greater than 0')

        summary = {
            'imported': 0,
            'duplicates': 0,
            'invalid': 0,
            'categories_created': 0,
        }

        for category_name, query in TOPIC_QUERIES:
            if summary['imported'] >= target:
                break

            category, created = Category.objects.get_or_create(name=category_name)
            if created:
                summary['categories_created'] += 1

            page = 1
            while summary['imported'] < target:
                docs = self._fetch_with_retries(query, page)
                if not docs:
                    break

                for doc in docs:
                    if summary['imported'] >= target:
                        break

                    candidate = normalize_openlibrary_doc(doc, category_name)
                    if candidate is None:
                        summary['invalid'] += 1
                        continue

                    if Book.objects.filter(isbn=candidate.isbn).exists():
                        summary['duplicates'] += 1
                        continue

                    Book.objects.create(
                        title=candidate.title,
                        author=candidate.author,
                        isbn=candidate.isbn,
                        category=category,
                        total_copies=copies,
                        available_copies=copies,
                        publisher=candidate.publisher,
                        published_year=candidate.published_year,
                        cover_url=candidate.cover_url,
                    )
                    summary['imported'] += 1

                page += 1

        self.stdout.write(self.style.SUCCESS(f"Imported: {summary['imported']}"))
        self.stdout.write(f"Skipped duplicates: {summary['duplicates']}")
        self.stdout.write(f"Skipped invalid: {summary['invalid']}")
        self.stdout.write(f"Categories created: {summary['categories_created']}")

    def _fetch_with_retries(self, query, page):
        for attempt in range(1, 4):
            try:
                return fetch_openlibrary_docs(query, page=page, limit=100)
            except Exception as exc:
                if attempt == 3:
                    self.stderr.write(
                        f'Open Library query failed for "{query}" page {page}: {exc}'
                    )
                    return []
                time.sleep(0.5 * attempt)
        return []
```

- [ ] **Step 5: Run command tests to verify they pass**

Run:

```bash
venv/bin/python -m pytest tests/test_import_openlibrary_command.py -v
```

Expected: PASS for all tests in `tests/test_import_openlibrary_command.py`.

- [ ] **Step 6: Run importer test suite together**

Run:

```bash
venv/bin/python -m pytest tests/test_openlibrary_importer.py tests/test_import_openlibrary_command.py -v
```

Expected: PASS for both importer test files.

- [ ] **Step 7: Commit Task 2**

```bash
git add apps/books/management tests/test_import_openlibrary_command.py
git commit -m "feat: add Open Library catalog import command"
```

---

### Task 3: Documentation And End-To-End Verification

**Files:**
- Modify: `README.md`
- Modify: `USAGE.md`

**Interfaces:**
- Consumes: command `python manage.py import_openlibrary_books --limit 500 --copies 50`
- Produces: documented demo setup flow for importing the 500-book catalog.

- [ ] **Step 1: Update README demo setup docs**

In `README.md`, add this section near the existing seed/demo setup instructions:

````markdown
### Import a larger demo catalog

After seeding users, settings, members, and example transactions, import a richer
Open Library catalog:

```bash
python manage.py import_openlibrary_books --limit 500 --copies 50
```

The importer stores Open Library metadata in the local `books` table, uses remote
cover URLs when available, skips duplicate ISBNs, and sets each imported book to
50 total copies and 50 available copies. Normal app browsing still uses
`/api/books/`; Open Library is not called by the frontend.
````

- [ ] **Step 2: Update USAGE command docs**

In `USAGE.md`, add this section near the Books API section or seed/setup section:

````markdown
### Import books from Open Library

Run this from the backend project root:

```bash
python manage.py import_openlibrary_books --limit 500 --copies 50
```

Options:

| Option | Default | Description |
| --- | --- | --- |
| `--limit` | `500` | Maximum number of valid new books to import. |
| `--copies` | `50` | Value used for both `total_copies` and `available_copies`. |

The command imports local `Book` records, creates missing categories, stores
`cover_url` when Open Library metadata supports it, skips duplicate ISBNs, and
prints imported, duplicate, invalid, and category-created counts.
````

- [ ] **Step 3: Verify docs mention the command**

Run:

```bash
rg -n "import_openlibrary_books|Open Library catalog" README.md USAGE.md
```

Expected: output includes both `README.md` and `USAGE.md`.

- [ ] **Step 4: Run the full backend test suite**

Run:

```bash
venv/bin/python -m pytest
```

Expected: PASS for all backend tests.

- [ ] **Step 5: Run a small real importer smoke test**

Run from backend root:

```bash
venv/bin/python manage.py import_openlibrary_books --limit 20 --copies 50
```

Expected: command exits 0 and prints an `Imported:` count. If the environment blocks network access, rerun with approved network access rather than changing importer code.

- [ ] **Step 6: Run frontend verification**

Run from frontend root:

```bash
npm run lint
npm test
npm run build
```

Expected: all commands exit 0. The Vite large chunk warning is acceptable if it is the same existing warning.

- [ ] **Step 7: Manual browser smoke**

Start backend and frontend as normally used for local smoke testing. Confirm:

- Admin/librarian `/books` lists imported books.
- Admin/librarian book search finds imported titles, authors, and ISBNs.
- Borrowing an imported book decreases `availableCopies`.
- Member `/portal/books` lists the same imported catalog.
- Member reservation works for an imported available book.
- Reports inventory totals include imported books.

- [ ] **Step 8: Commit Task 3**

```bash
git add README.md USAGE.md
git commit -m "docs: document Open Library catalog import"
```

---

## Final Verification

After all tasks are committed:

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-new-server"
venv/bin/python -m pytest
venv/bin/python manage.py import_openlibrary_books --limit 20 --copies 50
```

```bash
cd "/Users/admin/Desktop/Work/Annettes Project/libratrack-client"
npm run lint
npm test
npm run build
```

Expected:

- Backend tests pass.
- Small Open Library import exits 0 or is rerun with approved network access if blocked.
- Frontend lint, tests, and build pass.
- Manual smoke confirms imported books are visible to staff and members through local catalog pages.
