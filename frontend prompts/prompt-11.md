Extend the existing UniClub Web frontend authorization with stricter member-specific business rules for registrations, financial visibility, and management actions.

IMPORTANT:
- Do not rebuild from scratch.
- Modify existing pages/components/routes in place.
- Keep TypeScript strict mode.
- Keep backend API compatibility with current auth + role model.
- Keep all UI text in English by default.
- Reuse centralized permission utilities introduced in Prompt 10 (do not duplicate role checks).

GOAL:
Prompt 11 should refine member behavior so member users can register themselves to events but cannot perform actions for others, cannot view financial amounts, and cannot perform additional management actions.

1) MEMBER REGISTRATION RULE: SELF ONLY
Member users must be able to register to an event only for themselves.

Required behavior:
- Keep a self-registration action for member users on event detail (if registration is open).
- Member must NOT be able to pick another member from a member dropdown.
- Member must NOT be able to create/delete/update registrations on behalf of other members.
- If a member is already registered, show disabled state or clear message (e.g., "You are already registered.").

Implementation notes:
- If frontend needs member profile linkage, use authenticated session + available member data lookup.
- Keep backend as final authority; frontend must prevent invalid UI paths first.

2) FINANCIAL PRIVACY FOR MEMBER
Member users should not see financial amounts.

Budget visibility:
- Member must not see budget totals/amount values (`planned_amount`, `actual_amount`, variance value).
- If budget card remains visible on event detail, show non-sensitive placeholder (e.g., "Financial details are restricted for member role.").

Sponsorship visibility:
- Member can see sponsor names.
- Member must NOT see sponsorship amount values.
- In sponsorship tables/lists, hide/mask amount columns for member role.

3) MEMBER CANNOT ADD ADVISOR
For member role:
- Hide `Add Advisor` button and advisor creation form/modal.
- Guard advisor creation mutation in frontend (short-circuit with permission message; do not call API).

4) MEMBER CANNOT ADD VENUE
For member role:
- Hide `Add Venue` button and venue creation form/modal.
- Guard venue creation mutation in frontend (short-circuit with permission message; do not call API).

5) MEMBER CANNOT ADD TAGS
Tag-like add actions must be blocked for member role.

Required blocks:
- Clubs page: hide/disable `Quick Category Tag` add action.
- Event detail metadata: hide/disable metadata label add action.
- Any similar `AddItemBox` tag add control used for management metadata should be blocked for member.

6) KEEP EXISTING PROMPT 10 RESTRICTIONS
Do not remove previously implemented Prompt 10 behavior.

Must remain true:
- Member cannot access restricted management routes via direct URL.
- Member cannot add external participant.
- Member cannot register another member from event detail controls.
- Member cannot create/edit clubs and other management mutations already restricted.

7) UX CONSISTENCY
- For blocked financial sections, show a clean read-only explanation instead of empty/broken layouts.
- Avoid showing disabled controls when hiding is cleaner, unless context requires explanation.
- Keep toast messages concise and non-repetitive.

8) DOCUMENTATION UPDATE
Update frontend README authorization section with:
- Member self-registration only rule
- Financial visibility rule (names visible, amounts hidden)
- Member restrictions for advisor/venue/tag creation

9) FRONTEND TEST SCENARIOS (ADD/UPDATE)
Add Prompt 11 test cases to frontend test scenarios file:
- Member can self-register to event
- Member cannot register another member
- Member cannot see budget amounts on event detail
- Member can see sponsor names but not sponsorship amounts
- Member cannot open/add advisor form
- Member cannot open/add venue form
- Member cannot add quick category tag
- Member cannot add metadata label tag
- Advisor/board_member still see financial amounts and can perform allowed management actions

EXPECTED RESULT:
- Member can register only themselves to events.
- Member cannot perform registrations for others.
- Member cannot view budget/sponsorship monetary amounts.
- Member can still see sponsor names.
- Member cannot add advisor, venue, or management tags.
- Existing Prompt 10 protections remain intact.
- Frontend remains build-clean and demo-ready.