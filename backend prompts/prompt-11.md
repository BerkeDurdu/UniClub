# Prompt 11 — Enable real SMTP delivery for Email OTP in production

The Email OTP path in `email_utils.py` already supports a real SMTP transport, but on
Railway the service is running with no SMTP credentials configured, so it falls back to
console logging. For the live demo we need real emails to arrive in the user's inbox.

## What needs to happen

- Use Gmail SMTP (`smtp.gmail.com:587`, STARTTLS) as the delivery transport. The sender
  account must have 2-Step Verification enabled and an app password generated for this
  service — regular account passwords will not work.
- Configure the following environment variables on the Railway service so the existing
  code picks the SMTP branch instead of the console fallback:
  - `SMTP_HOST=smtp.gmail.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=<sender gmail address>`
  - `SMTP_PASSWORD=<16-character app password, no spaces>`
  - `SMTP_FROM=UniClub <sender gmail address>`
  - `SMTP_USE_TLS=true`
- Trigger a redeploy so the new variables are loaded by the running process.

## Verification

After redeploy, log in as a member with Email OTP enabled, request the login challenge
code, and confirm that:

1. The code arrives in the configured Gmail inbox within a few seconds.
2. Entering the code completes the 2FA challenge and issues a session token.
3. The Railway logs no longer print the `[EMAIL OTP] ... Your one-time login code is:`
   line — that line is only emitted by the console fallback and its absence confirms the
   SMTP branch is being taken.

## Non-goals

- Do not change `email_utils.py`. The console fallback must stay intact so local
  development and CI keep working without SMTP credentials.
- Do not commit the app password to the repository. It lives only in Railway's variable
  store.
