Extend the existing UniClub Web frontend authentication flow with role-aware registration integrated to backend JWT auth.

IMPORTANT:
- Do not rebuild from scratch.
- Modify existing pages/services in place.
- Keep TypeScript strict mode.
- Keep backend API compatibility with current `/auth/register`, `/auth/login`, and `/auth/me` behavior.
- Do not execute terminal commands in this task.

GOAL:
Prompt 9 should solve the registration flow gap where users are created with only email/password and no role-aware onboarding details.

1) REGISTER PAGE: ENFORCE ROLE-AWARE ACCOUNT CREATION
Update register form so account creation requires role selection and role-dependent fields.

Required fields:
- fullName
- email
- password
- confirmPassword
- role (member | advisor | board_member)
- club_id (optional for member, required for advisor/board_member)

Validation rules:
- fullName: min 2 chars
- email: valid email
- password: min 8 chars
- confirmPassword must match password
- role: strict enum validation
- club_id required when role is advisor or board_member

UI behavior:
- If role is member, club_id is optional.
- If role is advisor/board_member, club_id is required with visible helper/error state.
- Prefer a clubs dropdown fetched from backend.
- If dropdown cannot load, provide numeric club_id fallback input.

2) AUTH SERVICE: REMOVE MOCK FLOW, USE BACKEND AUTH
Replace local mock-user registration/login storage flow with backend auth endpoints.

Required changes:
- register -> POST `/auth/register`
- login -> POST `/auth/login`
- get current user from `/auth/me` when needed

Payload mapping:
- `fullName` -> `full_name`
- `role` unchanged
- `club_id` numeric or omitted for optional member case

Token/session handling:
- Save `access_token` to localStorage key `token`
- Save authenticated user payload to existing auth session key
- `logout()` must clear both token and session keys
- `isAuthenticated()` should rely on backend-token session logic, not mock user list

3) ERROR UX: SHOW BACKEND AUTH FAILURES CLEARLY
Display backend auth errors using toast + field-level messages where meaningful.

Must handle these cases clearly:
- `Email already registered`
- `club_id is required for advisor and board_member roles`
- `Club not found`
- `Invalid email or password`

Do not silently fail. Keep user on form with actionable message.

4) LOGIN/REGISTER NAVIGATION BEHAVIOR
Keep auth page flow consistent:
- Register success -> redirect to `/dashboard`
- Login success -> redirect to previous protected route or `/dashboard`
- If already authenticated -> visiting `/auth/login` or `/auth/register` should redirect to dashboard

5) TYPE SAFETY AND MODELS
- Define shared auth role type (or enum) and reuse across form and service layers.
- Add explicit request/response types for register/login/me endpoints.
- Do not use `any`.

6) API CLIENT COMPATIBILITY
- Ensure token continues to be sent as `Authorization: Bearer <token>` via request interceptor.
- Do not break existing API client error interceptor behavior.

7) DOCUMENTATION UPDATE
Update frontend README auth section to reflect:
- Role-aware registration fields and rules
- Backend endpoints used (`/auth/register`, `/auth/login`, `/auth/me`)
- Removal of mock local user list behavior

8) FRONTEND TEST SCENARIOS (ADD/UPDATE)
Add Prompt 9 test cases to frontend test scenarios file:
- Register fails when role is missing
- Register fails when advisor/board_member has no club_id
- Register succeeds for member without club_id
- Register succeeds for advisor/board_member with valid club_id
- Login stores token and enables protected route access
- Invalid credentials show proper error message
- Existing authenticated user is redirected away from auth pages

EXPECTED RESULT:
- Registration no longer proceeds with just email/password.
- Role selection is mandatory and role-specific data requirements are enforced.
- Frontend auth flow uses backend JWT endpoints instead of mock local user storage.
- Token/session behavior remains stable with protected routing.
- UI clearly communicates auth and validation errors.
- Frontend remains build-clean and demo-ready.
