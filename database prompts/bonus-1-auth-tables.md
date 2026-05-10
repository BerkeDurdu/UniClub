# Bonus (database): Auth-related Tables

New SQLModel tables introduced by the bonus features. They will be auto-created at startup like
the rest of the schema.

## Permission system
- `permission(id, code UNIQUE, description)`
- `role_permission(id, role, permission_id, UNIQUE(role, permission_id))`

## OAuth
- `oauth_account(id, provider, provider_account_id, email, user_id FK app_user.id,
  UNIQUE(provider, provider_account_id))`

## 2FA
- `user_totp(user_id PK FK app_user.id, secret, confirmed_at NULLABLE, recovery_codes TEXT NULL)`
- `user_email_otp(user_id PK FK app_user.id, enabled BOOL DEFAULT TRUE)`
- `email_otp_challenge(id, user_id FK, code_hash, expires_at, consumed_at NULL)`
- `webauthn_credential(id, user_id FK, credential_id UNIQUE, public_key BYTEA,
  sign_count INT, label TEXT)`

## UserRole enum extension
- Add value `admin`. Existing `ck_user_role_requires_club` constraint must allow admin without
  club_id (rule becomes: club required only for advisor/board_member).

Seed:
- All baseline permissions.
- The current effective role permissions, so behavior is unchanged on day 1.
- One admin user from env (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
