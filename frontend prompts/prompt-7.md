Extend the existing `UniClub Web` frontend with authentication UX, editable input modules, and a fix for the Event Details runtime error. Keep all previous functionality intact.

IMPORTANT:
- Do not rebuild from scratch.
- Use existing files and modify in place.
- Keep backend API compatibility.
- Keep TypeScript strict mode.
- The default language must be English across the entire UI.

GOAL:
Deliver a stable Prompt 7 upgrade that adds account creation + login screens, reusable editable/addable input boxes, and resolves the "Unexpected error occurred" issue when opening Event Details from `Events -> View details`.

1) DEFAULT LANGUAGE: ENGLISH
- Update all user-facing texts to English by default.
- Ensure page headings, button labels, empty states, error messages, and form labels are English.
- Keep a single language baseline (no mixed TR/EN text).

2) AUTHENTICATION SCREENS (UI + INTEGRATION-READY)
Create route-level pages:
- `/auth/login`
- `/auth/register`

Requirements:
- Clean form UI with validation (React Hook Form + Zod).
- `Login`: email, password.
- `Register`: full name, email, password, confirm password.
- Validation rules:
  - valid email format
  - password min length (8)
  - register confirm password must match
- Add clear success/error toasts.
- If backend auth endpoints are unavailable, use a temporary mock service layer with explicit TODO comments.
- Add navigation links: Login <-> Register and redirect to Dashboard after successful login (mock or real).

3) EDITABLE / ADDABLE INPUT BOXES
Add reusable editable components under `src/components/common/` or `src/components/forms/`:
- `EditableField` (inline edit text box)
- `AddItemBox` (add new item/input block)

Behavior requirements:
- Inline edit mode toggle (view -> edit -> save/cancel).
- Add box supports creating new values with validation.
- Use these components in at least:
  - Clubs page (editable club description/category locally or via API)
  - Event Details page (editable notes/metadata block)
- Keep non-crashing behavior on failed API calls.

4) FIX: EVENTS -> VIEW DETAILS CRASH
Current issue:
- Clicking `View details` in Events can show fallback "Something went wrong" / "Unexpected error occurred".

Required fix tasks:
- Identify and fix the root cause in Event Details route/component.
- Ensure route parameter parsing is safe (`id` validation).
- Guard queries against invalid IDs and missing data.
- Ensure all dependent queries handle null/undefined data without throwing.
- Ensure no unhandled promise rejections.
- If event not found, show a friendly `Not Found`/`ErrorMessage` UI instead of crashing.

5) ROUTER + ACCESS FLOW
- Add auth routes to router config.
- If user is not authenticated (or mock-auth false), optionally guard protected pages (`/dashboard`, `/events`, `/clubs`, etc.) and redirect to `/auth/login`.
- Keep this implementation simple and presentation-friendly.

6) OPENAPI / FRONTEND INTEGRATION SAFETY
- Ensure all event detail data fetches use typed service methods.
- Do not use `any`.
- Keep query keys stable for React Query.
- Preserve existing API base URL environment behavior.

7) DOCUMENTATION UPDATE
Update frontend `README.md` with:
- New auth routes
- How mock auth works (if used)
- Where editable/addable components are used
- A short troubleshooting section for Event Details errors

8) TEST SCENARIOS (FRONTEND)
Add/update a frontend test scenarios markdown section/file including:
- Login form invalid email
- Register password mismatch
- Event details route with invalid ID
- Event details for non-existing event
- EditableField save/cancel behavior
- AddItemBox validation failure and success

EXPECTED RESULT:
- Authentication pages exist and are usable.
- UI text is English by default everywhere.
- Editable/addable input boxes are integrated and functional.
- `Events -> View details` no longer crashes and handles edge cases gracefully.
- Frontend remains build-clean and presentation-ready.
