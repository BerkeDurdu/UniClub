Extend the existing UniClub Web registration flow with a dual club onboarding path for users who are signing up as advisor or board member and need to manually declare their club.

IMPORTANT:
- Do not rebuild from scratch.
- Modify existing pages/components/services in place.
- Keep TypeScript strict mode.
- Keep backend API compatibility with existing auth endpoints.
- Keep all UI text in English by default.

GOAL:
Prompt 12 should support a new registration path where a new user can either:
1) continue normal registration by selecting an existing club, or
2) manually type a club name (example: "HSD Istinye") and then complete required club profile details.

If manual club entry is chosen, registration must not behave like the default quick flow. User must provide club details and should be redirected to club information completion instead of direct dashboard entry.

1) REGISTER PAGE: ADD CLUB INPUT MODE SWITCH
Add a clear switch in register form for advisor/board_member roles:
- Mode A: Select existing club (current dropdown behavior)
- Mode B: Enter club manually

Requirements:
- Keep existing role and validation logic.
- Manual club mode should be available at least for `advisor` and `board_member`.
- For `member`, keep current normal registration flow unchanged unless explicitly needed.

2) MANUAL CLUB ENTRY FIELDS
When manual club mode is selected, show these fields:
- manual_club_name (required)
- category (required)
- description (required)
- founded_date (required)
- contact_email (required, valid email)
- contact_phone (optional)
- communication_channel (optional)
- social_link (optional valid URL)
- sponsor_contact_name (optional)
- sponsor_contact_role (optional)

Validation:
- manual_club_name must be non-empty and min 2 chars.
- contact_email must be valid.
- social_link, if provided, must be valid URL.
- founded_date must be valid date.

3) CONDITIONAL FLOW RULES
Normal flow (existing club selected):
- Keep current behavior.
- On successful register, redirect to `/dashboard`.

Manual club flow:
- Do NOT immediately finish as standard dashboard-first registration.
- Either:
  - create/register user with pending club setup flag, then redirect to club onboarding page, OR
  - register user and directly route to club profile completion page with prefilled manual club name.

Required redirect target:
- Use a dedicated route like `/onboarding/club` or `/clubs/new?source=register`.
- Prefill entered manual club data in that page/form.

4) CLUB ONBOARDING PAGE (POST-REGISTER CONTINUATION)
Add/extend a page that collects and persists full club information after manual entry.

Behavior:
- User lands here right after manual-club registration success.
- User cannot skip to dashboard until required club fields are completed (or show explicit "Finish later" warning flow if project policy allows).
- On successful completion, redirect to `/dashboard`.

5) API INTEGRATION STRATEGY
Because backend may not yet support "manual new club during register" natively:
- Keep auth register payload compatible.
- Use safe fallback strategy if needed:
  - store manual club draft in local/session storage,
  - then submit to club create/update endpoints during onboarding step.
- Add explicit TODO comments where backend contract extension is needed.

6) UX REQUIREMENTS
- Keep form clean; only show relevant fields based on selected mode.
- Add helper text for manual flow:
  - "If your club is not listed, enter it manually and complete club profile setup."
- Show clear progress feedback between register and onboarding steps.
- Do not lose entered data on validation errors.

7) ERROR HANDLING
- If manual club onboarding submission fails, keep user on onboarding page with actionable error.
- Do not silently drop manual club inputs.
- Keep existing toast/error conventions.

8) DOCUMENTATION UPDATE
Update frontend README with:
- dual club registration mode
- manual club onboarding redirect behavior
- fallback strategy when backend does not support full club creation in register endpoint

9) FRONTEND TEST SCENARIOS (ADD/UPDATE)
Add Prompt 12 test cases to frontend test scenarios file:
- Advisor selects existing club and gets normal dashboard redirect
- Advisor selects manual club mode and sees additional required fields
- Manual club mode rejects empty/invalid club fields
- Manual club mode redirects to onboarding page (not dashboard)
- Onboarding page pre-fills manual club name
- Onboarding completion redirects to dashboard
- Manual flow data persists across validation errors

EXPECTED RESULT:
- New advisor/board_member can either select an existing club or manually declare a new club.
- Manual club declaration triggers extended club-info onboarding.
- Existing-club registration keeps current simple flow.
- UX remains clear and build-clean.