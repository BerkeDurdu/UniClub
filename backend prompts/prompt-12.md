# Prompt 12 — Switch Email OTP delivery to Resend HTTP API

The SMTP transport added in prompt 11 fails on Railway with `[Errno 101] Network is
unreachable` because the platform blocks outbound port 587 / 465 to discourage spam from
free-tier projects. Instead of fighting the platform, route Email OTP through an HTTP-based
mail provider so the request leaves over standard HTTPS that Railway already allows.

## Implementation

- Add a Resend HTTP client path to `email_utils.py` alongside the existing SMTP and console
  branches. The new send order in `send_email` is:
  1. Resend HTTP API if `RESEND_API_KEY` is set.
  2. SMTP if `SMTP_HOST` is set (kept for environments where SMTP is unblocked).
  3. Console fallback otherwise (used by local dev and CI).
- Use `httpx.post` against `https://api.resend.com/emails` with an 8-second timeout. The
  payload is `{from, to: [to_email], subject, text: body}` and the request is authorized
  with `Authorization: Bearer <RESEND_API_KEY>`. Any non-2xx response or network error is
  caught, logged, and the OTP code is also printed to stdout so demos can recover from a
  provider outage by reading the Railway logs.
- Extend `Settings` with two optional fields: `resend_api_key` and `resend_from`. The
  `from` value falls back to `smtp_from` and finally `onboarding@resend.dev` (Resend's
  shared sandbox sender) so the integration works without a verified domain.

## Rollout

1. Sign up at resend.com, generate an API key, and copy it.
2. On the Railway service, add `RESEND_API_KEY` and (optionally) `RESEND_FROM`. Leaving
   the SMTP_* variables in place is fine — the Resend branch takes precedence — but they
   can also be removed to simplify the variable list.
3. Push the code change. After redeploy, request a 2FA login email and confirm the
   message arrives in the configured inbox within a few seconds. The Railway logs should
   no longer print `SMTP send failed: [Errno 101]` and the `[EMAIL OTP fallback]` block
   should not appear.

## Why not stick with SMTP

Railway, Heroku, Vercel functions, and several other PaaS providers all rate-limit or
fully block outbound SMTP. Switching to a transactional mail HTTP API removes that class
of platform-specific failure entirely while keeping the local console fallback intact for
development.
