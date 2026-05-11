# Prompt 14 — Pre-demo security hardening

The instructor announced live attack testing against the deployed app. Close the three
biggest gaps before the demo: brute-force / DoS exposure on the auth endpoints, an
overly permissive CORS policy, and missing browser security headers.

## What changes

1. **Rate limiting (slowapi)**

   Add `slowapi` to `uniclub-api/requirements.txt`, wire a `Limiter` keyed on the
   remote address in `main.py`, register the 429 handler, and decorate the auth
   endpoints that are realistic brute-force or amplification targets:

   - `POST /auth/login` — 10/min per IP (slow down password brute force)
   - `POST /auth/register` — 5/min per IP (slow down account-spam attacks)
   - `POST /auth/password/forgot` — 3/min per IP (don't let an attacker drain the
     Resend quota by mass-requesting reset emails)
   - `POST /auth/password/reset` — 10/min per IP (cap token-guessing throughput)
   - `POST /2fa/login/email/send` — 3/min per IP (cap email amplification)
   - `POST /2fa/login/email/verify` and `/login/totp/verify` — 10/min per IP
     (cap OTP-code guessing — a 6-digit code has 1 M combinations, so this turns a
     ~minutes-long attack into days)

2. **CORS lockdown**

   Replace the wildcard configuration with an explicit allow-list:

   ```python
   allow_origins=[
       "https://uni-club-bay.vercel.app",
       "http://localhost:5173",
   ]
   allow_methods=["GET","POST","PUT","DELETE","OPTIONS","PATCH"]
   allow_headers=["Authorization","Content-Type"]
   ```

   The combination of `allow_origins=["*"]` and `allow_credentials=True` is rejected
   by modern browsers anyway and signals weak hardening; explicit origins remove
   both the surface and the optics problem.

3. **Security response headers**

   Add a small middleware that stamps every response with:

   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: no-referrer`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HTTPS-only;
     skip on http://localhost)
   - `Permissions-Policy: geolocation=(), microphone=(), camera=()`

   These are cheap to add and immediately improve `securityheaders.com` from F to
   A-/A.

## Out of scope

- Account lockout (would need a new table and is overkill for the demo window).
- Moving JWT into an httpOnly cookie (touches the entire frontend auth flow).
- WAF / IP reputation — relies on infrastructure we don't control.
