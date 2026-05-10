# Bonus (frontend): Testing

- Add **Vitest** + **@testing-library/react** for unit tests.
  - Cover `permissions.ts`, `validation/schemas.ts`, hooks, key components.
  - Target 90%+ coverage on `src/auth/`, `src/validation/`, and `src/api/services/`.

- Add **Playwright** for end-to-end tests under `uniclub-web/e2e/`:
  - Login (password) → dashboard.
  - Failed login → error toast.
  - Register a new member → onboarding.
  - Admin role gate (admin sees /admin, member does not).
  - 2FA TOTP setup happy path.

- npm scripts:
  - `test` → vitest run with coverage.
  - `test:ui` → vitest --ui.
  - `e2e` → playwright test.
  - `e2e:install` → playwright install --with-deps.

- Tests should be runnable in CI without a real backend by stubbing axios — except Playwright,
  which needs the backend running on `127.0.0.1:8000`.
