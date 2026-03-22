Perform a focused correction pass for UniClub auth persistence and club-scope authorization behavior. Do not rebuild from scratch. Patch existing backend and frontend code in place.

IMPORTANT:
- Keep current architecture (FastAPI + SQLModel + React + TypeScript).
- Preserve all working features from previous prompts.
- This prompt fixes regressions and requirement mismatches.
- Backend must remain final authority for security-critical rules.

GOAL:
Fix three concrete issues:
1) Password persistence confusion (verify real storage in app users table, not DB connection user confusion).
2) Advisor/board_member club scope regression (they should be read-all, manage-own-club only).
3) Sponsorship visibility policy (names visible cross-club, financial amounts hidden for non-owned clubs).
4) Message routing policy (role-targeted messaging only, no self-message).

SETUP CONTEXT (for clean installs)
- `postgres` in DATABASE_URL is only the PostgreSQL connection account. It is NOT an application login user.
- Application auth users are stored in `app_user` table.
- If models changed and DB is empty/misaligned, run backend startup sync once so tables and seed users are created.
- Seed expectation after successful startup sync:
  - member@uniclub.com / member123
  - advisor@uniclub.com / advisor123
  - board@uniclub.com / board123

REGISTER BUTTON PITFALL (must be prevented)
- The register submit must not fail silently due to hidden-field validation.
- If a field is optional and hidden in current mode (example: `contactEmail` outside manual club mode), empty string must not block submit.
- Invalid submit should produce visible feedback toast (example: "Please fix the highlighted form errors.") so users understand why submit did not proceed.

1) PASSWORD PERSISTENCE: VERIFY AND HARDEN
Current symptom:
- User thinks passwords are not saved, or sees only "postgres" and assumes auth user is wrong.

Required:
- Confirm password is saved to `User.hashed_password` on register/seed using bcrypt hash (never plaintext).
- Confirm login verifies with bcrypt against `User.hashed_password`.
- Add an explicit backend diagnostics note in README:
  - `postgres` is the database connection account from `DATABASE_URL`.
  - application accounts are rows in `app_user` table.
- Add a safe validation script or documented SQL checks (without exposing hashes in API responses):
  - count users
  - list email, role, club_id, is_active
  - show that hashed_password is non-empty and not equal to plaintext.

Do not:
- return password/hash in API responses
- log plaintext password

2) CLUB-SCOPE AUTHORIZATION MODEL (CORRECTED)
Current regression:
- Advisor/board_member were over-restricted by hiding/filtering all foreign-club resources entirely.

Required behavior (advisor and board_member):
- Read/list/detail: allowed across all clubs (unless endpoint is explicitly private for another reason).
- Create/update/delete: allowed only when target resource belongs to current user's own club.
- If target club does not match: block mutation with clear 403 and frontend toast.

Apply this read-all/manage-own split consistently to:
- Clubs
- Events
- Budgets
- Sponsorships
- Registrations/Participants management flows
- Advisor/Board management actions

Frontend adjustments:
- Do NOT globally filter out foreign-club items from lists for advisor/board_member.
- Show foreign-club records in read-only mode.
- Keep edit/create/delete controls enabled only for own-club resources.
- On foreign-club detail pages, keep view accessible but hide/disable mutation controls.

Backend adjustments:
- Keep/implement ownership checks in mutation endpoints (POST/PUT/DELETE).
- Do not enforce own-club restriction on read endpoints unless specifically required.

3) SPONSORSHIP VISIBILITY POLICY
Business rule:
- Sponsor names can be visible across clubs.
- Financial amounts must not be visible for other clubs.

Required matrix:
- member:
  - sponsor names visible
  - sponsorship amounts hidden everywhere
- advisor/board_member:
  - own club sponsorship amounts visible
  - foreign club sponsorship amounts hidden

Implementation guidance:
- Prefer backend-safe response shaping for amount visibility where feasible.
- If frontend masking is used, still enforce server-side constraints for any sensitive aggregate/report endpoints.
- Ensure event detail and sponsorship list follow the same masking rule.

4) MESSAGE ROUTING POLICY (STRICT)
Business rule:
- `member` can send messages only to `advisor` or `board_member` users.
- `advisor` and `board_member` can send messages only to other `advisor` or `board_member` users.
- No user can send a message to themselves.

Required validation matrix:
- sender=`member` -> receiver in {`advisor`, `board_member`} only
- sender in {`advisor`, `board_member`} -> receiver in {`advisor`, `board_member`} only
- sender_id != receiver_id always

Backend requirements:
- Enforce these checks in message create endpoint before insert.
- Return `403 Forbidden` for invalid sender/receiver role combinations.
- Return `400 Bad Request` (or `409 Conflict`) for self-message attempts.
- Keep backend as final authority even if frontend is bypassed.

Frontend requirements:
- In message form receiver dropdown, only show allowed roles according to sender role.
- Exclude current user from selectable recipients.
- If form state is tampered, block submit client-side and show a clear toast.

Data/contract note:
- If current message schema only stores `member_id`/`club_id`, extend API contract to support explicit receiver user/profile identity so role-based recipient validation is possible.
- Prefer explicit `sender_user_id` + `receiver_user_id` validation path.

4) DONT BREAK PROMPT 10/11/12 BASELINES
Must remain true:
- member self-registration only
- member cannot perform management mutations
- member financial restrictions remain
- manual club onboarding flow remains functional

5) TEST SCENARIOS TO ADD/UPDATE
Update frontend and backend test scenario docs with at least:
- Password register/login roundtrip uses hashed password persistence
- Advisor can view foreign club event/club but cannot edit/delete it
- Board member can view foreign club sponsorship names but not amounts
- Advisor sees amount for own-club sponsorship, hidden for foreign-club sponsorship
- Member sees sponsor names but never amount
- Foreign-club mutation attempts are blocked both client-side and server-side
- Member can send message to advisor/board_member
- Member cannot send message to member
- Advisor/board_member can send message to advisor/board_member
- Advisor/board_member cannot send message to member
- Self-message attempt is blocked both client-side and server-side

5.1) PRE-FIX DIAGNOSTIC + ACTION CHECKLIST (MUST RUN BEFORE PATCH)
- Reproduce failing create flow from UI and capture request/response for `POST /advisors`.
- Confirm if backend returns `403` with detail similar to: "Advisor creation is not allowed through this endpoint".
- Verify expected auth model for Prompt 5: advisor/board_member should be able to manage own-club resources.
- Ensure fix plan is documented before code change:
  - Allow advisor creation for advisor/board_member roles only.
  - Enforce own-club scope (`require_same_club_or_forbid`) for create mutation.
  - Keep read-all/list behavior unchanged.
  - Improve frontend error visibility for `403` responses so failures are not silent.
- After patch, retest create flow with:
  - allowed same-club payload -> success (201)
  - foreign-club payload -> forbidden (403)
  - duplicate advisor-per-club constraint -> conflict (409)

5.2) PRE-FIX CHECKLIST: BUDGETS + STARTUP STABILITY
- Reproduce Budgets page issue where foreign-club financial data should not be visible and identify current output behavior.
- Confirm if Budgets page is triggering noisy `404 Budget not found for event` toasts due per-event budget probing.
- Add explicit fix plan before code change:
  - For advisor/board_member, keep cross-club event rows visible but mask foreign-club financial columns as `Restricted`.
  - Avoid backend calls for foreign-club budget detail rows.
  - For own-club events without a budget row, avoid user-facing error toast spam.
- Inspect backend terminal traceback and capture root cause if startup fails.
- If startup failure includes `UniqueViolation` on `app_user.email` during seed/backfill, harden seed logic to be idempotent under concurrent reload starts.
- Retest after patch:
  - Budgets page shows `Restricted` for foreign-club rows.
  - No repeated `Budget not found for event` toast storm.
  - Backend startup succeeds without duplicate-email crash.

6) ACCEPTANCE CRITERIA
- `npm run build` passes for frontend.
- Backend auth endpoints still work for seeded and newly registered users.
- No password/hash leaks in API payloads.
- Advisor/board_member can browse all clubs/events without losing own-club mutation boundaries.
- Sponsorship names remain visible while sensitive amounts are correctly masked by ownership policy.
