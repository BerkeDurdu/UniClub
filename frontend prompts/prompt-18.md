# Prompt 18 — Forgot password & reset UI

Wire the frontend to the new `/auth/password/forgot` and `/auth/password/reset`
endpoints. Two new pages, one new link on the login screen, two routes.

## Pages

- **`ForgotPasswordPage`** at `/auth/forgot-password`. A single email input with the same
  validation as the login form (zod, react-hook-form). On submit, calls
  `forgotPassword(email)` from `authService`. Always shows a generic success message —
  *"If an account exists for this email, a reset link has been sent."* — regardless of
  the response, so the UI does not leak whether the email is registered.
- **`ResetPasswordPage`** at `/auth/reset-password`. Reads the `token` query parameter on
  mount; if missing, shows an error state with a link back to login. Otherwise renders
  two password inputs (new password + confirm), validates `min_length=8` and that both
  match. On submit, calls `resetPassword(token, newPassword)`. On success, toast "Password
  updated" and `navigate("/auth/login", { replace: true })`. On failure (expired/invalid
  token), surface the backend error message and offer a link back to the forgot-password
  page.

## Login page link

Add a **"Forgot password?"** link below the password field on `LoginPage.tsx`, styled to
match the existing "No account yet? Create one" link. Routes to `/auth/forgot-password`.

## Service layer

Extend `src/api/services/authService.ts` with:

- `async function forgotPassword(email: string): Promise<void>` — POSTs `{ email }` and
  swallows any error message back to the caller via `getErrorMessage`. The page never
  surfaces backend errors here; it always shows the generic success copy.
- `async function resetPassword(token: string, newPassword: string): Promise<void>` —
  POSTs `{ token, new_password: newPassword }` and rethrows the API error message so the
  page can render it.

## Routing

Register both new pages in `App.tsx` outside `ProtectedRoute` (the user is, by
definition, logged out when they reach them):

```tsx
<Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/auth/reset-password" element={<ResetPasswordPage />} />
```

## Visual style

Both pages reuse the same `Card` + `Button` + Tailwind classes already used by
`LoginPage` and `RegisterPage` — single centered card on a `min-h-screen` page. No new
component primitives.
