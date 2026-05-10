# Bonus (backend): Testing & CI

- Add **pytest** + **pytest-cov** + **httpx** for backend tests under `uniclub-api/tests/`.
  - Use a SQLite in-memory engine override of `get_session` so tests don't need PostgreSQL.
  - Cover: auth (register/login/me), permissions (admin gate), 2FA enable/verify (TOTP),
    OAuth provider listing, basic CRUD on a couple of resources.
  - Target 90%+ on `auth.py`, `oauth.py`, `services.py`, and the new admin/2fa routers.

- Top-level `.github/workflows/ci.yml`:
  - Job `backend`: spin up Postgres service, install deps, run pytest with coverage,
    fail under 90% (excluding migrations and main.py seed block).
  - Job `frontend`: install npm, run `npm run test` with coverage, run `npm run build`.
  - Job `e2e` (depends on backend+frontend): start the API and the dev preview, run Playwright.
  - Run on push and pull_request.
