Extend the existing UniClub Web authorization model with strict club-scope enforcement for advisor and board_member roles.

IMPORTANT:
- Do not rebuild from scratch.
- Modify existing pages/components/routes/services in place.
- Keep TypeScript strict mode.
- Keep backend API compatibility with current role-based endpoints.
- Keep all UI text in English by default.
- Reuse centralized permission utilities (no duplicated ad-hoc checks).

GOAL:
Prompt 13 should ensure advisor and board_member users can only view/manage data for their own club context. They must not control or edit anything belonging to other clubs.

1) CLUB-SCOPE PRINCIPLE (ADVISOR + BOARD_MEMBER)
For `advisor` and `board_member` roles:
- Allowed: operations where `resource.club_id === currentUser.clubId`
- Blocked: operations where `resource.club_id !== currentUser.clubId`
- Blocked: operations where target resource club is unknown/unresolved

Applies to at least these domains:
- Clubs (update local/profile fields, club communication/sponsor fields)
- Events (create/update/delete, event metadata edits)
- Budgets
- Sponsorships
- Registrations managed by staff
- Participants (especially external participant management)
- Messages sent on behalf of club
- Board/advisor/member management operations where club ownership matters

2) UI VISIBILITY FILTERING BY CLUB
When advisor/board_member is logged in:
- Lists should default to own-club resources only.
- Hide or disable action controls for non-owned records.
- If read-only viewing of non-owned records is allowed by product decision, enforce NO mutations.

Minimum expected behavior:
- Events list/detail: non-owned events cannot be edited/deleted.
- Clubs list/detail: only own club has editable controls.
- Budgets/sponsorships: only own club event rows are actionable.

3) ROUTE + DETAIL PAGE SAFETY
If advisor/board_member manually opens detail URL of another club/event:
- Block edit/mutation controls entirely.
- Show clear message: "You can only manage your own club resources."
- For strictly restricted pages, redirect to safe route (`/dashboard` or own-club page).

4) MUTATION PRE-CHECKS (CLIENT SIDE)
Before each mutation call in advisor/board_member flows:
- Resolve target `club_id`.
- Compare against current user `clubId`.
- If mismatch, short-circuit and show toast error; do not call API.

Examples:
- create/update event with foreign `club_id`
- add budget/sponsorship to event from another club
- register members to event from another club
- add external participant to foreign event
- edit foreign club communication/sponsor fields

5) KEEP MEMBER RULES INTACT
Do not regress previous member restrictions (Prompt 10/11/12).
- Member restrictions remain exactly as implemented.
- This prompt only tightens advisor/board_member cross-club boundaries.

6) CENTRAL PERMISSION API UPDATE
Extend permission helpers (or add scoped helper) to support club ownership checks, e.g.:
- `canManageClubResource(user, resourceClubId)`
- `isSameClub(user.clubId, resourceClubId)`

Requirements:
- Strong typing.
- No `any`.
- No duplicated club-match logic across many pages.

7) DOCUMENTATION UPDATE
Update frontend README authorization section with:
- advisor/board_member own-club-only rule
- behavior for foreign-club detail routes
- note that frontend pre-checks improve UX, backend remains final authority

8) FRONTEND TEST SCENARIOS (ADD/UPDATE)
Add Prompt 13 test cases to frontend test scenarios file:
- Advisor cannot edit another club's profile fields
- Board member cannot edit another club's profile fields
- Advisor cannot manage event from another club via direct URL
- Board member cannot add sponsorship to another club event
- Advisor cannot register participants for another club event
- Advisor/board_member can still fully manage own-club resources
- Foreign-club mutation attempt is blocked client-side before API call

EXPECTED RESULT:
- Advisor and board_member roles are strictly scoped to their own club.
- Cross-club management is blocked at UI, route, and mutation layers.
- Existing member restrictions stay intact.
- Frontend remains build-clean and demo-ready.