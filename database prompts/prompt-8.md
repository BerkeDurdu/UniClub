# Prompt 8 — Auth-Related Tables and Schema Evolution

Extend the schema to support the new authorization, OAuth, and 2FA features added in the
backend prompts. All new tables are SQLModel-defined and created at startup like the rest of
the schema.

## Permission system

- `permission(id, code UNIQUE, description)`
- `role_permission(id, role, permission_id, UNIQUE(role, permission_id))`

## OAuth

- `oauth_account(id, provider, provider_account_id, email, user_id FK app_user.id,
  UNIQUE(provider, provider_account_id))`

## Two-factor authentication

- `user_totp(user_id PK FK app_user.id, secret, confirmed_at NULLABLE)`
- `user_email_otp(user_id PK FK app_user.id, enabled BOOL DEFAULT TRUE)`
- `email_otp_challenge(id, user_id FK, code_hash, purpose, expires_at, consumed_at NULL)`
- `webauthn_credential(id, user_id FK, credential_id UNIQUE, public_key, sign_count, label,
  created_at)`
- `webauthn_challenge(id, user_id FK, challenge, purpose, expires_at)` for short-lived
  registration / authentication challenges.

## `UserRole` enum extension

- Add the `admin` value to the enum.
- Update the `ck_user_role_requires_club` check constraint so that the rule becomes:
  `(role IN ('member','admin')) OR (club_id IS NOT NULL)`.
- Provide a lightweight startup migration that runs `ALTER TYPE userrole ADD VALUE IF NOT
  EXISTS 'admin'` and rewrites the check constraint on PostgreSQL. The migration must be a
  no-op on SQLite so test runs stay hermetic.

## Seed data

On startup, seed:

- All baseline permission codes.
- The current effective role-to-permission matrix, so behavior is unchanged on day 1.
- One admin user using `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (the existing seed pattern
  for the other roles).
