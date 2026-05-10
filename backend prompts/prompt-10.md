# Prompt 10 — Backend Test Suite and CI Pipeline

Stand up an automated test suite for the backend and wire it into GitHub Actions so every
push verifies the API in isolation.

## Test framework

- `pytest`, `pytest-cov`, `pytest-asyncio`, `httpx` (TestClient already depends on it).
- Tests live in `uniclub-api/tests/` and use an in-memory SQLite engine override via a
  `conftest.py` fixture, so they do not require a real PostgreSQL instance.
- Each test gets a fresh schema; permission seed runs in the fixture so authorization tests
  start from a known state.

## Coverage targets

Focus on the modules with security implications:

- `auth.py`
- `permissions_catalog.py`
- `routers/admin.py`
- `routers/twofa.py`
- `email_utils.py`

`.coveragerc` should `include` these files and set `fail_under = 90`. A failing coverage run
should fail the CI job.

## What to cover

- Auth: register / login (with and without 2FA), `/auth/me`, expired token, inactive user,
  wrong purpose token, missing token.
- Admin: 403 for non-admins on every `/admin/...`, role change, active toggle, matrix get/put,
  validation errors (unknown role, unknown permission code), permission change actually
  affects a subsequent member request to `/auth/me`.
- 2FA: TOTP setup + confirm + disable + login challenge round-trip, email enable/disable +
  login challenge, WebAuthn register/verify, login flow start/verify.
- Email utility: console fallback, SMTP path with monkeypatched `smtplib`, async wrapper.

## CI pipeline (`.github/workflows/ci.yml`)

Three jobs running on `push` and `pull_request`:

1. **backend** — installs Python deps, runs `pytest --cov` with the 90% threshold.
2. **frontend-unit** — installs npm deps, runs the frontend test suite, runs the build.
3. **e2e** — depends on backend and frontend-unit; spins up a Postgres service, starts the API
   on port 8000, builds and serves the Vite preview on 5173, then runs Playwright.

The pipeline must run on standard GitHub-hosted Ubuntu runners with no self-hosted setup.
