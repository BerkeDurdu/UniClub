# Bonus (frontend): 2FA UI (TOTP, Email OTP, WebAuthn)

Companion to `backend prompts/bonus-3-multi-factor-auth.md`.

- `SecurityPage` at `/settings/security`:
  - TOTP card: shows QR + secret on first setup, confirm with 6-digit code, then "Disable" button.
  - Email OTP card: simple enable/disable toggle.
  - WebAuthn card: list registered credentials, "Add device" button using `@simplewebauthn/browser`.

- `LoginPage` 2FA challenge:
  - When `/auth/login` returns `challenge_token`, render a method tab list.
  - TOTP / Email tabs accept a 6-digit code; "Send code" button for email triggers
    `/2fa/email/send` (issued on challenge for that method).
  - WebAuthn tab triggers `navigator.credentials.get` flow.
  - On success, store the final token and navigate.

- Add `@simplewebauthn/browser` to `package.json`.
