# Bonus: Social Login — 4 Providers (+15)

Add OAuth 2.0 sign-in for **Google, GitHub, Microsoft, and Facebook**. Use the Authlib library
(`authlib`) on FastAPI side. Frontend handles the redirect button and consumes the resulting JWT.

## Backend
- Add `authlib`, `httpx`, `itsdangerous` to `requirements.txt`.
- New module `oauth.py` that registers the four providers using env vars:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT` (default `common`)
  - `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`
  - `OAUTH_REDIRECT_BASE` (default `http://localhost:8000`)
  - `OAUTH_FRONTEND_REDIRECT` (default `http://localhost:5173/oauth/callback`)
- New router `routers/oauth.py`:
  - `GET /auth/oauth/{provider}/login` → 302 redirect to provider's authorize URL.
  - `GET /auth/oauth/{provider}/callback` → finishes flow, finds-or-creates `User`,
    finds-or-creates `OAuthAccount(provider, provider_account_id, user_id, email)`,
    issues a JWT, redirects to `OAUTH_FRONTEND_REDIRECT?token=...`.
- New model `OAuthAccount(id, provider, provider_account_id, email, user_id)` with
  unique `(provider, provider_account_id)`.
- For users created via OAuth: hashed_password is a random unusable string, role defaults
  to `member`, club_id null. Email is taken from the IdP profile.
- Sessions are needed for OAuth state → add `SessionMiddleware` with `SECRET_KEY`.
- `/auth/oauth/providers` endpoint returns the list of *configured* providers (only those
  with a client id present in env) so the frontend can render the right buttons.

## Frontend
- `LoginPage` and `RegisterPage` show a row of social buttons — only providers returned
  by `/auth/oauth/providers`.
- New route `/oauth/callback` reads `?token=` from URL, stores it via the existing auth store,
  and redirects to dashboard.

## Env file additions
Update `uniclub-api/.env.example` with stub values and a comment that providers without a
client id will simply not be exposed.
