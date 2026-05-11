# Prompt 13 — Forgot password & reset flow

Add a self-service password reset path so a user who has lost their password can recover
their account without an administrator manually resetting it. The flow has two endpoints
and an emailed single-use token.

## Data model

A new table `password_reset_token` in `models.py`:

- `id` (PK)
- `user_id` (FK → `app_user.id`, indexed)
- `token_hash` — SHA-256 hex of the raw token; the raw token only lives in the email
- `expires_at` — `datetime`, 1 hour after issuance
- `used_at` — nullable, set when the token has been consumed (single-use)

Tokens themselves are generated with `secrets.token_urlsafe(32)`. They are never stored
in plaintext; only the hash is persisted, mirroring how `EmailOTPChallenge` handles login
codes.

## Endpoints (both under `/auth`)

- **`POST /auth/password/forgot`** — body `{ "email": "..." }`. Always returns 200 with a
  generic `{ "ok": true }` body regardless of whether the email matches a real account.
  This is deliberate: a different response for unknown emails would let an attacker
  enumerate registered users. When a user *is* found, generate a token, persist its hash,
  and send an email containing a link of the form
  `{FRONTEND_BASE_URL}/auth/reset-password?token=<raw_token>` via `send_email`.
- **`POST /auth/password/reset`** — body `{ "token": "...", "new_password": "..." }`.
  Looks up the token by hash, rejects with 400 if missing, already used, or expired.
  On success: update `User.hashed_password`, set `used_at = now()`, and invalidate any
  other unused tokens for the same user so a stolen second link cannot be reused.

The password field reuses the existing `min_length=8` constraint from `UserRegister` via
a new `PasswordResetRequest` schema in `schemas.py`. OAuth-only users (no local password)
should still receive the email link — resetting effectively assigns a local password and
unlocks email/password login alongside their social login.

## Config

Add `frontend_base_url` to `Settings` (default `http://localhost:5173`, override with the
`FRONTEND_BASE_URL` env in production → `https://uni-club-bay.vercel.app`). The email
body uses this base to build the link. No other config changes; delivery rides the
existing Resend > SMTP > console chain from prompt 12.

## Out of scope

- Rate limiting / lockout — handled at the gateway layer separately.
- Notifying the user via a second channel when a reset happens — would be nice but is not
  required for the demo.
- Password complexity beyond length — keep symmetry with the register endpoint.
