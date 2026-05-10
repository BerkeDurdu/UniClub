# Bonus: Authentication & 2FA — 4 Methods (+15)

Existing system already supports method 1 (email + password). Add three more methods so the user
can pick any combination as a second factor:

1. **Password** (already implemented) — primary credential.
2. **TOTP** (Google Authenticator / Authy / 1Password) — RFC 6238 30s codes.
3. **Email OTP** — 6-digit code emailed to the registered address. Console-mode fallback when
   no SMTP env vars are set (the code is logged to stdout for development & demo).
4. **WebAuthn / Passkey** — hardware-key or platform authenticator (Windows Hello, Touch ID).

## Backend
- New deps: `pyotp`, `qrcode[pil]`, `webauthn`, `aiosmtplib`.
- New tables:
  - `UserTOTP(user_id PK, secret, confirmed_at, recovery_codes_json)`
  - `EmailOTPChallenge(id, user_id, code_hash, expires_at, consumed_at)`
  - `WebAuthnCredential(id, user_id, credential_id, public_key, sign_count, label)`
- New router `routers/twofa.py`:
  - `POST /2fa/totp/setup` → returns provisioning URI + base64 QR PNG.
  - `POST /2fa/totp/confirm` body `{code}` → marks TOTP confirmed.
  - `DELETE /2fa/totp` → disable.
  - `POST /2fa/email/enable`, `DELETE /2fa/email`.
  - `POST /2fa/webauthn/register/start` → registration options.
  - `POST /2fa/webauthn/register/verify` → store credential.
  - `DELETE /2fa/webauthn/{credential_id}`.
  - `GET /2fa/status` → which methods are enabled.
- Login flow change:
  - `POST /auth/login` returns either a final token (no 2FA) **or**
    `{ "challenge_token": "...", "methods": ["totp","email","webauthn"] }`.
  - `POST /auth/2fa/verify` body `{challenge_token, method, code/assertion}` → final token.
  - Challenge tokens are short-lived (5 min) JWTs with claim `purpose=2fa`.
- Email sending utility: tries SMTP if `SMTP_HOST` is set, otherwise prints to stdout
  with a clear `[EMAIL OTP]` prefix.

## Frontend
- New `SecurityPage` (`/settings/security`) with sections:
  - TOTP: show QR + manual secret, confirm with 6-digit code, allow disable.
  - Email OTP: enable/disable toggle.
  - WebAuthn: list registered devices + "Add device" button using `@simplewebauthn/browser`.
- `LoginPage` is updated:
  - If response contains `challenge_token`, show a method picker.
  - Each method has its own challenge UI (TOTP/email-code input or WebAuthn prompt).

## Acceptance
- A user can enable any subset of methods independently and log in with whichever they choose.
- Disabling all 2FA methods reverts to plain password login.
- Email OTP works in console mode without any SMTP config.
