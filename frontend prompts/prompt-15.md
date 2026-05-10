# Prompt 15 — Social Sign-in Buttons and OAuth Callback Page

Now that the backend exposes OAuth endpoints, surface the providers on the login screen and
handle the redirect back from the provider.

## Login screen

Below the password form on `LoginPage`:

- Fetch `GET /auth/oauth/providers` once on mount and cache it.
- Render a button per returned provider name. Each button is a plain anchor pointing to
  `${VITE_API_BASE_URL}/auth/oauth/{provider}/login`.
- Use `lucide-react` icons (Github, Mail-shaped for Google, generic for Microsoft, Facebook).
- Hide the whole row when the list is empty so the UI stays clean before any provider is
  configured in the backend env.

## OAuth callback route

Add a new route `/oauth/callback` (`OAuthCallbackPage`) that:

1. Reads `?token=...` from `window.location.search`.
2. Persists the token via the existing auth service.
3. Calls `/auth/me` to hydrate the user store.
4. Navigates to `/dashboard`.
5. Shows an error toast and routes back to `/auth/login` if the token is missing.

## Auth service changes

The existing `login()` should be promoted to a union return type so it can return either the
final `AuthUser` or a `{ kind: "challenge", ... }` payload (see the 2FA prompt). Add a
`finalizeTokenLogin(token)` helper that wraps "store token + fetch /auth/me + return user".
The callback page uses it.
