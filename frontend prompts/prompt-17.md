# Prompt 17 — Frontend Test Suite (Vitest + Playwright)

Stand up automated tests for the frontend at two levels and wire them into the same CI
pipeline that already runs the backend tests.

## Unit tests with Vitest

- Add `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`,
  `@testing-library/user-event`, `jsdom` to devDependencies.
- A small `src/test/setup.ts` brings in `@testing-library/jest-dom/vitest` and resets
  `localStorage` between tests.
- `vite.config.ts` gets a `test` block with the v8 coverage provider, jsdom env, and an
  `include` list scoped to the modules whose correctness matters most:
  - `src/auth/permissions.ts`
  - `src/api/services/authService.ts`
  - `src/api/services/adminService.ts`
  - `src/api/services/oauthService.ts`
  - `src/api/services/twoFactorService.ts`
- Coverage thresholds: statements ≥ 90, branches ≥ 80, functions ≥ 90, lines ≥ 90.

Cover the obvious branches: storage hydration, malformed JSON, login response variants
(token vs challenge), `fetchAuthMeContext` permission propagation, every service wrapper.

## End-to-end tests with Playwright

- `@playwright/test` in devDependencies, `playwright.config.ts` at the project root with the
  Chromium project enabled and `baseURL` from `E2E_BASE_URL` env (default
  `http://127.0.0.1:5173`).
- Specs under `uniclub-web/e2e/`:
  - `auth.spec.ts` — login page renders, invalid login shows a toast, dashboard redirects an
    unauthenticated user, admin login lands on dashboard (or stays on login if the seed
    password differs in CI).
  - `register.spec.ts` — register page is reachable and the form is wired up.

## npm scripts

- `test` → `vitest run --coverage`
- `test:watch` → `vitest`
- `e2e` → `playwright test`
- `e2e:install` → `playwright install --with-deps`

## CI integration

The existing pipeline adds a `frontend-unit` job (`npm ci && npm run test && npm run build`)
and an `e2e` job that depends on backend + frontend-unit, spins up the API and a Vite preview
on the runner, then runs the Playwright suite headlessly.
