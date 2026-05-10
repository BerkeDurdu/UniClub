# Prompt 8 — Integration and Validation for the New Auth Features

Cross-cutting integration notes that tie the backend prompts (admin, OAuth, 2FA) together
with their frontend counterparts, plus the validation rules that span the contract.

## Login response shape

`POST /auth/login` is now a discriminated union:

- Success path: `{ access_token, token_type, user }` — used by the password login when no
  second factor is enabled.
- Challenge path: `{ kind: "challenge", challenge_token, methods: ("totp"|"email"|"webauthn")[] }`
  — used when at least one 2FA method is enabled.

The frontend `authService.login()` must check the discriminator and either persist the access
token (and resolve to the `AuthUser`) or surface the challenge state to `LoginPage`.

## `/auth/me` permission propagation

The response gains `permissions: string[]`:

- For non-admin users, it is the set of permission codes granted by the current role-to-
  permission matrix.
- For admin users, it is `["*"]`. The frontend `hasPermission(permissions, code)` helper
  treats `*` as a wildcard.

## OAuth provider discovery

`/auth/oauth/providers` is queried once on app boot. Only enabled providers render. Buttons
are plain anchors so the browser performs the redirect — no custom XHR required.

## Admin endpoints integration

All `/admin/*` endpoints go through the standard axios client. The existing global toast
handler in `api/client.ts` already surfaces 403 responses, which is the expected UX when a
non-admin reaches the routes via a stale token.

## Validation rules

- Backend: Pydantic schemas validate request bodies for admin endpoints (role enum, optional
  `club_id`, active flag).
- Frontend: Zod schemas for the TOTP confirm input (`/^\d{6}$/`), email OTP code, and admin
  role change select.
- All new endpoints carry `Admin`, `2FA`, or `OAuth` Swagger tags so the docs page groups
  them clearly.
