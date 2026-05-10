# Prompt 9 — Multi-Method Authentication and 2FA

Layer additional authentication methods on top of the existing password login so that a user
can opt into any combination of second factors:

1. **Password** — already implemented.
2. **TOTP** — RFC 6238 30-second codes (Google Authenticator / Authy / 1Password compatible).
3. **Email OTP** — 6-digit code sent to the user's email; falls back to a stdout log line when
   no SMTP env vars are set, so the feature is demoable without a real mail provider.
4. **WebAuthn / passkey** — hardware key or platform authenticator (Windows Hello, Touch ID).

## Dependencies

`pyotp`, `qrcode[pil]`, `webauthn`, `aiosmtplib`.

## New tables

- `user_totp(user_id PK, secret, confirmed_at NULLABLE)`
- `user_email_otp(user_id PK, enabled BOOL DEFAULT TRUE)`
- `email_otp_challenge(id, user_id, code_hash, purpose, expires_at, consumed_at NULL)`
- `webauthn_credential(id, user_id, credential_id UNIQUE, public_key, sign_count, label, created_at)`
- `webauthn_challenge(id, user_id, challenge, purpose, expires_at)` — short-lived

## Endpoints under `/2fa`

- TOTP: `POST /2fa/totp/setup`, `POST /2fa/totp/confirm`, `DELETE /2fa/totp`
- Email: `POST /2fa/email/enable`, `DELETE /2fa/email`
- WebAuthn registration: `POST /2fa/webauthn/register/start`, `POST /2fa/webauthn/register/verify`,
  `DELETE /2fa/webauthn/{credential_id}`
- Login challenge verification:
  - `POST /2fa/login/totp`
  - `POST /2fa/login/email/send`, `POST /2fa/login/email/verify`
  - `POST /2fa/login/webauthn/start`, `POST /2fa/login/webauthn/verify`
- `GET /2fa/status` — what is currently enabled for the user.

## Login flow changes

`POST /auth/login` returns either the regular access token (no 2FA enabled) **or**

```json
{ "kind": "challenge", "challenge_token": "<5-min JWT, purpose=2fa>", "methods": ["totp","email","webauthn"] }
```

The challenge token can only be exchanged for a final access token through one of the
`/2fa/login/...` endpoints.

## Email utility

A single `send_email(to, subject, body)` helper. When `SMTP_HOST` is set it sends via SMTP;
otherwise it prints a clearly tagged `[EMAIL OTP]` block to stdout. This keeps the feature
demoable in zero-config environments.

## Acceptance

- A user can enable any subset of TOTP / Email / WebAuthn independently.
- Disabling all factors falls back to plain password login.
- Email OTP works without any SMTP configuration (codes appear in the server log).
