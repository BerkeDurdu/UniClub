# Prompt 16 — Security Settings Page and 2FA Login Challenge UI

Build the frontend UX for the multi-method authentication backend: a settings page where the
user manages second factors, and a challenge step embedded in the login flow.

## `/settings/security` — `SecurityPage`

Three independent cards, each with their own enable / disable controls:

- **Authenticator app (TOTP).** On first setup, render the base64 QR PNG returned by the API
  plus the manual secret string. Confirm with a 6-digit code. Once enabled, show a "Disable"
  action. Use the existing `Button` and `Card` components.
- **Email OTP.** A simple status indicator with enable / disable toggle.
- **Security keys / passkeys (WebAuthn).** List currently registered credentials (label +
  registration date). A label input + "Add device" button drives the browser-native
  `navigator.credentials.create` flow against the backend's start/verify endpoints. A small
  base64url ↔ ArrayBuffer helper pair belongs in the same file.

## `LoginPage` challenge step

When `POST /auth/login` returns `{ kind: "challenge", challenge_token, methods }`:

- Switch from the password form to a tabbed UI with one tab per available method.
- TOTP tab: 6-digit input + Verify.
- Email tab: "Send code" button (calls `/2fa/login/email/send`) then code input + Verify.
- WebAuthn tab: a single "Use security key / passkey" button driving
  `navigator.credentials.get`, posting the chosen credential id back to the verify endpoint.
- On success, the final access token is stored and the user lands on `/dashboard`.
- A "Cancel" link resets back to the password form.

## Service layer

Add `src/api/services/twoFactorService.ts` covering all `/2fa/...` endpoints, typed end to
end so the page components stay short.
