# Bonus (frontend): Social Login UI

Companion to `backend prompts/bonus-2-social-login.md`.

- `LoginPage` and `RegisterPage`
  - Below the form, render social buttons returned by `GET /auth/oauth/providers`.
  - Each button links to `${VITE_API_BASE_URL}/auth/oauth/{provider}/login`.
  - Use `lucide-react` icons (Github, Mail for Google, etc.).

- New route `/oauth/callback`
  - Reads `?token=` from `window.location.search`.
  - Persists token using the same auth store/hook used by the password login.
  - Calls `/auth/me` to populate user, then navigates to `/`.
  - Shows an error toast if no token is present.
