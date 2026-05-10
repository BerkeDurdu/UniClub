# Bonus: Dynamic Authorization + Admin Dashboard (+10)

Extend the existing FastAPI backend so authorization is no longer hardcoded to three fixed roles
(member / advisor / board_member). Introduce a fourth role `admin` plus a database-driven permission
system, and expose endpoints that let an admin dynamically change role permissions and user roles.

## Goals
- Add `admin` to `UserRole` enum (super-user, no club scope required).
- Create `Permission` and `RolePermission` tables. A permission is a string code such as
  `events.create`, `clubs.delete`, `users.manage`, `permissions.manage`, `messages.send`, etc.
- Seed a default permission matrix for member/advisor/board_member/admin so the live behavior
  matches what the app already does today.
- Replace `require_roles(...)` based gating in security-sensitive routers with a new
  `require_permission("events.create")` dependency that:
  1. Loads the user's role.
  2. Checks the role has the permission in `RolePermission` (cached per request).
  3. `admin` short-circuits and is allowed everywhere.
- Expose admin-only routes:
  - `GET /admin/permissions` — list all permissions.
  - `GET /admin/role-permissions` — current role x permission matrix.
  - `PUT /admin/role-permissions` — replace the matrix (atomic).
  - `GET /admin/users` — list all users with role + club.
  - `PUT /admin/users/{id}/role` — change a user's role.
  - `PUT /admin/users/{id}/active` — activate / deactivate user.
- Add startup seed: an `admin@uniclub.local` user with `SEED_ADMIN_PASSWORD` env var (default
  `admin12345`).

## Non-goals
- Do not break the existing club-scoped checks — they stay alongside the new permission system.
- Do not migrate every router at once; cover the highest-value ones (events, clubs, budgets,
  sponsorships, members CRUD, messages send) and keep the rest using `require_roles` until later.

## Acceptance
- Admin user can sign in, hit `/admin/role-permissions`, and toggle e.g. `events.create` for
  `member`. After toggling, a member token is allowed/denied accordingly without restart.
- Non-admin users get 403 on every `/admin/...` route.
- Existing tests/scenarios still pass.
