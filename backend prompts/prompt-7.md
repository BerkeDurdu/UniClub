# Prompt 7 — Dynamic Authorization and Admin Role

Extend the FastAPI backend so authorization is no longer hardcoded to a fixed set of roles.
Introduce a new `admin` role and a database-driven permission system that an authorized user
can edit at runtime.

## Goals

- Add `admin` to the `UserRole` enum. The admin role is a super-user and does not require a
  `club_id`. Update the existing `ck_user_role_requires_club` check constraint so that the
  rule becomes: club is required only for `advisor` and `board_member`.
- Create two new tables:
  - `permission(id, code UNIQUE, description)`
  - `role_permission(id, role, permission_id)` with a unique constraint on `(role, permission_id)`
- Seed a baseline catalog of permission codes such as `events.create`, `clubs.delete`,
  `users.manage`, `permissions.manage`, `messages.send`, ... and a default role-to-permission
  matrix that mirrors the current effective behavior (so day-1 UX is unchanged).
- Replace `require_roles(...)` based gating on the most security-sensitive routes with a new
  `require_permission("...")` dependency that:
  1. Loads the current user's role.
  2. Looks up the role-permission matrix.
  3. Short-circuits `admin` so it is always allowed.
- Expose admin-only routes under `/admin`:
  - `GET /admin/permissions` — list all permission codes.
  - `GET /admin/role-permissions` — current role × permission matrix.
  - `PUT /admin/role-permissions` — replace the matrix atomically.
  - `GET /admin/users` — list every user with role and club.
  - `PUT /admin/users/{id}/role` — change a user's role (and club when applicable).
  - `PUT /admin/users/{id}/active` — activate / deactivate a user.
  - `POST /admin/users` — create a user (admin convenience).
- Add startup seed: an `admin` user whose email comes from `SEED_ADMIN_EMAIL` and password
  from `SEED_ADMIN_PASSWORD`.

## Non-goals

- Existing club-scope checks remain alongside the permission system.
- Migration of every router at once is unnecessary — cover the high-value endpoints first
  (events, clubs, budgets, sponsorships, members CRUD, messages).

## Acceptance

- An admin user can toggle any permission for any role and the change takes effect on the
  next request without restarting.
- Non-admin users get `403` on every `/admin/...` route.
- All existing scenarios pass.
