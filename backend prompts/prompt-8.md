# Prompt 8 — Social Sign-in with Multiple OAuth Providers

Add OAuth 2.0 sign-in support for Google, GitHub, Microsoft, and Facebook using the Authlib
library. The backend should expose endpoints that initiate the flow and handle the provider
callback, find-or-create a `User` plus an `OAuthAccount` link, and finally issue the same JWT
that the password login already returns.

## Dependencies

Add to `requirements.txt`: `authlib`, `httpx`, `itsdangerous`.

## Configuration

All providers are env-driven. A provider is considered "configured" only when both the client
id and secret are present; otherwise the corresponding button must not show up on the
frontend. Read from environment:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT` (default `common`)
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`
- `OAUTH_REDIRECT_BASE` (e.g. `http://localhost:8000`)
- `OAUTH_FRONTEND_REDIRECT` (e.g. `http://localhost:5173/oauth/callback`)

Add `SessionMiddleware` to the FastAPI app so Authlib can keep OAuth state across redirects.

## Endpoints

- `GET /auth/oauth/providers` — return the list of providers that are *actually configured*.
- `GET /auth/oauth/{provider}/login` — 302 redirect to the provider's authorize URL.
- `GET /auth/oauth/{provider}/callback` — finalize the flow:
  - normalize provider profile into `{provider_account_id, email, name}`,
  - find existing user by `(provider, provider_account_id)`, otherwise by email, otherwise
    create a new user with a random unusable password and `role=member`,
  - persist the link in `oauth_account(provider, provider_account_id, email, user_id)` with
    a unique `(provider, provider_account_id)` constraint,
  - issue an access JWT and redirect to `OAUTH_FRONTEND_REDIRECT?token=...`.

## Acceptance

- With no provider env vars set, `/auth/oauth/providers` returns an empty list.
- Setting only `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` adds GitHub to the list.
- A successful GitHub callback creates the `User` and `OAuthAccount` rows, redirects to the
  frontend with `?token=...`, and `/auth/me` works with that token.
