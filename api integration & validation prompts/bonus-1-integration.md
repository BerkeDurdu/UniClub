# Bonus: Frontend ↔ Backend Integration for Auth Bonuses

Cross-cutting integration notes once backend bonuses (admin/2FA/OAuth) and frontend bonuses
(admin UI / 2FA UI / social login) are in place.

- Auth response shape becomes a discriminated union:
  `TokenResponse` (final token) **or** `TwoFactorChallengeResponse` (challenge token + methods).
  Frontend axios `authService.login` must check `kind`/presence of `challenge_token` and either
  store the token or surface the challenge to the UI.
- `/auth/me` payload gains `permissions: string[]` derived from the user's role x role_permission
  matrix. Frontend `permissions.ts` consumes this dynamically rather than hardcoded role checks.
- `/auth/oauth/providers` is queried once on app boot and cached; only enabled providers render.
- Admin endpoints under `/admin/*` go through the standard axios client; 403s are surfaced via
  the global toast handler already in `api/client.ts`.
- All new endpoints documented in Swagger under tags `Admin`, `2FA`, `OAuth`.
- Validation: zod schemas for the new forms (TOTP confirm code, email OTP code, role change).
