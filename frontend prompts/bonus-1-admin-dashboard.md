# Bonus (frontend): Admin Dashboard for Dynamic Authorization

Companion to `backend prompts/bonus-1-dynamic-authorization.md`.

Add a `/admin` section visible only to users whose role is `admin`. Implement:

- `AdminUsersPage` (`/admin/users`)
  - Table of every user (email, full name, role, club, active).
  - Inline role dropdown (member / advisor / board_member / admin) — calls `PUT /admin/users/{id}/role`.
  - Active toggle — calls `PUT /admin/users/{id}/active`.

- `AdminPermissionsPage` (`/admin/permissions`)
  - Matrix UI: rows are roles, columns are permissions, cells are checkboxes.
  - Save button posts the entire matrix to `PUT /admin/role-permissions`.
  - Lightweight diff highlight before save.

Auth + routing:
- Extend `permissions.ts` with `isAdmin(user)` helper.
- Wrap admin routes in a guard that redirects non-admins to `/`.
- Add an "Admin" entry in the sidebar that only renders for admins.

Use the existing axios client and React Query — pattern after the other pages so it feels native.
