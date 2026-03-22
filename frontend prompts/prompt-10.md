Extend the existing UniClub Web frontend with strict Member role UI authorization so member users cannot access sensitive management areas and cannot perform restricted mutations.

IMPORTANT:
- Do not rebuild from scratch.
- Modify existing pages/components/routes in place.
- Keep TypeScript strict mode.
- Keep backend API compatibility with current JWT auth (`/auth/login`, `/auth/register`, `/auth/me`) and existing resource endpoints.
- Keep all UI text in English by default.
- Role source of truth is authenticated user session role (`member | advisor | board_member`).

GOAL:
Prompt 10 should ensure a user registered as `member` cannot see and/or edit management features shown in the current UI (e.g., add/edit controls for clubs, budgets, sponsorships, registrations, participant management), while advisor/board_member behavior remains intact.

1) CENTRALIZE FRONTEND PERMISSION MODEL
Create a single role-permission map and reusable helpers (no duplicated inline role checks).

Required:
- Add a role-permission utility (e.g., `src/auth/permissions.ts` or similar).
- Export helpers such as:
  - `canViewSection(role, section)`
  - `canPerformAction(role, action)`
  - `isMember(role)`
- Keep permission constants strongly typed (no `any`).

Suggested sections/actions to model explicitly:
- Sections: clubs_manage, budgets, sponsorships, registrations_manage, participants_manage, venues_manage, board_manage
- Actions: create_club, update_club, create_budget, update_budget, create_sponsorship, update_sponsorship, register_other_member, add_external_participant, edit_event_metadata

2) NAVIGATION + ROUTE VISIBILITY FOR MEMBER
Member users should not see management-oriented routes/tabs/buttons.

For `member` role:
- Hide or disable nav entries for pages that are management-only in the UI context:
  - Budgets
  - Sponsorships
  - Board (if currently management-only)
- Keep allowed pages (dashboard, clubs/events read-only views, own profile related pages).

Route guard requirements:
- If member manually enters a restricted URL, redirect safely (e.g., to `/dashboard`) and show a non-intrusive toast/message: "You do not have permission to access this page."
- Do not rely only on hidden buttons; enforce route-level guard too.

3) CLUBS PAGE: MEMBER MUST NOT MANAGE
On clubs list/detail pages, member should not be able to create or edit club data.

For `member` role:
- Hide `Create Club` button.
- Hide all club `Edit` controls.
- Keep read-only viewing (`View details`) if route is public/allowed.

4) EVENT DETAIL: MEMBER MUST NOT MANAGE REGISTRATION/PARTICIPANTS FOR OTHERS
Current issue in UI: member can access management-like controls in event detail.

For `member` role:
- Registrations block:
  - Hide member selection dropdown used to register other users.
  - Hide any add/remove registration actions not scoped to self.
- Participants block:
  - Hide "Add External Participant" controls.
  - Hide participant edit/delete controls.
- Event metadata/admin edit controls:
  - Hide edit actions and management labels/buttons.

If member self-registration is supported by backend rules:
- Keep only self-registration action (if implemented), clearly labeled.
- Prevent selecting another member id.

5) BUDGETS + SPONSORSHIPS PAGES: MEMBER MUST NOT SEE OR EDIT
For `member` role:
- Remove/hide access from navigation.
- Block direct route access via guard.
- Hide all mutation controls (`Add Budget`, `Add Sponsorship`, edit/delete actions).

If business decision is read-only visibility instead of full hide:
- Keep list/table visible in read-only mode.
- Absolutely disable all mutation actions.
- Make this behavior controlled by a single permission flag for easy switching.

6) API CALL SAFETY IN FRONTEND
Even with hidden UI, prevent forbidden mutations from being triggered.

Required:
- Before mutation calls, check permission helper.
- If not allowed, short-circuit with a user-friendly error toast and do not call API.
- Keep existing backend 403 handling and error interceptor behavior unchanged.

7) UX CONSISTENCY
- Do not leave empty gaps where buttons were removed; adjust layout spacing.
- Where useful, show subtle read-only badge/text: "Read-only for member role".
- Avoid noisy repeated toasts on every render.

8) DOCUMENTATION UPDATE
Update frontend README auth/authorization section with:
- Member visibility restrictions
- Route-guard behavior for restricted pages
- Which pages are hidden vs read-only for member
- Note that backend remains final authority and frontend guard is UX + safety layer

9) FRONTEND TEST SCENARIOS (ADD/UPDATE)
Add Prompt 10 scenarios to frontend test scenarios file:
- Member cannot see `Create Club` and club edit controls
- Member cannot access budgets route via direct URL
- Member cannot access sponsorships route via direct URL
- Member cannot add external participant on event detail
- Member cannot register another member from dropdown
- Advisor/board_member still sees and can use management actions
- Unauthorized mutation is blocked client-side before API call

EXPECTED RESULT:
- A user with role `member` no longer sees or uses sensitive management controls.
- Member cannot access restricted management pages via nav or direct URL.
- Member experience is clean read-only where intended, without broken layout.
- Advisor and board_member capabilities remain unchanged.
- Frontend remains build-clean and demo-ready.