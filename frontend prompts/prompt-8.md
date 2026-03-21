Extend the existing UniClub Web frontend with Club Management + Sponsor Contact UX improvements and a cleaner Members analytics view.

IMPORTANT:
- Do not rebuild from scratch.
- Modify existing pages/components in place.
- Keep TypeScript strict mode.
- Keep backend API compatibility (FastAPI + current endpoints).
- Keep all UI text in English by default.

GOAL:
Prompt 8 should solve three UX problems:
1) Club creation does not ask enough management/contact fields.
2) Club detail does not allow editing those fields later.
3) Members page is too crowded with full account list; we need active event participation visibility.

1) CLUB CREATE: ADD MISSING MANAGEMENT/CONTACT FIELDS
Update Club create flow (modal/form) to collect practical communication and sponsor-ready information.

Required fields to add in club create form:
- contact_email (required, valid email)
- contact_phone (optional)
- communication_channel (optional, ex: Discord/WhatsApp/Telegram)
- social_link (optional URL)
- sponsor_contact_name (optional)
- sponsor_contact_role (optional)

Validation rules:
- contact_email must be valid format.
- social_link, if provided, must be valid URL.
- Keep existing club fields and validations unchanged.

Persistence:
- If backend endpoint supports these fields, send them in create payload.
- If backend does not support them yet, implement local fallback state with explicit TODO comments for API integration.

2) CLUB DETAIL: MAKE THESE FIELDS EDITABLE
In Club Detail page, add an editable management section where all fields above can be edited after creation.

Requirements:
- Reuse existing editable patterns/components (EditableField/AddItemBox where meaningful).
- Support Save/Cancel per field or section.
- Show clear success/error toasts.
- Never crash if API update fails; keep previous value safely.

Nice-to-have structure:
- Club Profile section: category, description, founded date.
- Club Communication section: contact_email, contact_phone, communication_channel, social_link.
- Sponsor Contact section: sponsor_contact_name, sponsor_contact_role.

3) SPONSOR CONTACT AREA
Add a Sponsor Communication block so sponsors can quickly understand how to contact the selected club.

Minimum content in this block:
- Primary contact person
- Contact email
- Contact phone (if exists)
- Preferred channel
- Quick copy action for email/phone/channel (copy-to-clipboard buttons)

Behavior:
- If no sponsor contact data exists, show a clear empty-state message with CTA like "Add sponsor contact info".
- If user has permission (or current mock-auth user), allow editing sponsor contact details.

4) MEMBERS PAGE: REMOVE CROWD, SHOW ACTIVE PARTICIPATION
Current issue: listing all members creates noise in large datasets.

Required redesign:
- Replace default full list emphasis with participation analytics.
- Show "Active Participation" centered metrics:
  - total active participants
  - average events per active member
  - top participants (by attended event count)

Data logic:
- Compute event participation count using existing registrations/participants/event relations.
- A member is "active" if attended/registered count > 0 in selected period.

UI requirements:
- Add period filter (ex: Last 30 days / This semester / All time).
- Add sortable table/card list with columns:
  - member name
  - department
  - attended_event_count
- Keep pagination or limit to avoid 100+ row clutter.
- Optional toggle: "Show all members" for admin-level deep view.

5) PERFORMANCE + SAFETY
- Keep React Query keys stable.
- Avoid N+1 style frontend calls when possible.
- Handle empty/null data without runtime errors.
- Ensure all async mutations/queries have error handling.

6) DOCUMENTATION UPDATE
Update frontend README with:
- New club management fields
- Sponsor communication block behavior
- Members analytics redesign logic
- Any backend schema dependency notes

7) FRONTEND TEST SCENARIOS (ADD/UPDATE)
Add Prompt 8 test cases to frontend test scenarios file:
- Create club with invalid contact_email
- Create club with invalid social_link
- Edit sponsor contact and save
- Sponsor contact empty-state rendering
- Members page with 0 active participants
- Members page with 100+ members and pagination/limit behavior
- Participation sorting correctness (highest attended_event_count first)

EXPECTED RESULT:
- Club creation collects sponsor-ready communication data.
- Club detail allows later editing of that data safely.
- Sponsor communication section exists and is practical.
- Members page focuses on active event participation, not noisy full account listing.
- Frontend remains build-clean and presentation-ready.
