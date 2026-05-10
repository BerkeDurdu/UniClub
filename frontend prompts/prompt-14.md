# Prompt 14 — Admin Dashboard for Users and Permissions

Once the backend exposes admin endpoints for dynamic authorization, add a matching admin area
to the frontend that is only visible to users whose `role === "admin"`.

## Pages

- **`/admin/users`** — `AdminUsersPage`
  - Table of every user: email, full name, role, club, active.
  - Role column is an inline `<select>` with `member | advisor | board_member | admin`
    options. Changing the dropdown calls `PUT /admin/users/{id}/role` and toasts the result.
  - Active column is a checkbox bound to `PUT /admin/users/{id}/active`.

- **`/admin/permissions`** — `AdminPermissionsPage`
  - Matrix UI: rows are permissions, columns are roles, cells are checkboxes.
  - Local draft state diffed against the server-side matrix so that "Save changes" is enabled
    only when something is dirty. Dirty cells get a soft highlight before save.
  - Save posts the entire matrix to `PUT /admin/role-permissions`.

## Routing and visibility

- Add a `permissions.ts` helper `isAdmin(role)` that returns `role === "admin"`.
- Wrap the two admin routes in an `AdminRoute` guard that redirects non-admins to `/`.
- Sidebar gets a new "Admin" group with the two links; it only renders when the current user
  is admin.

## Data layer

Add `src/api/services/adminService.ts` with strongly-typed wrappers for the admin endpoints
and reuse the existing axios client / React Query patterns from the rest of the app.
