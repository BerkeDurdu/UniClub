Extend the existing UniClub Web frontend to achieve complete API service coverage for all 11 backend entities. Keep all existing code intact.

IMPORTANT:
- Do not rebuild from scratch.
- Modify existing files in place.
- Keep TypeScript strict mode.
- Keep backend API compatibility (FastAPI + current endpoints).
- Every backend endpoint must have a corresponding frontend service function.
- Every entity must have complete Create and Update payload types.

GOAL:
Ensure the frontend API layer has full CRUD coverage matching every backend route. Currently only clubs, events, members, and participants have partial service functions. The remaining 7 entities (Advisor, BoardMember, Venue, Budget, Registration, Message, Sponsorship) have minimal read-only services.

1) COMPLETE TYPESCRIPT TYPES (`src/types/index.ts`)
Add missing Create and Update payload interfaces for all entities:

- AdvisorCreatePayload: full_name, email, department, assigned_date, club_id (optional)
- AdvisorUpdatePayload: partial version of create fields
- MemberUpdatePayload: partial fields including leave_date
- BoardMemberCreatePayload: student_id, first_name, last_name, email, role (BoardRole), join_date, club_id
- BoardMemberUpdatePayload: partial version
- VenueCreatePayload: name, location, capacity, venue_type (optional), description (optional)
- VenueUpdatePayload: partial version
- BudgetCreatePayload: event_id, planned_amount, actual_amount, notes (optional)
- BudgetUpdatePayload: planned_amount (optional), actual_amount (optional), notes (optional)
- RegistrationCreatePayload: event_id, member_id
- MessageCreatePayload: subject, content, club_id, member_id
- SponsorshipCreatePayload: sponsor_name, amount, agreement_date, event_id

Ensure all types match backend Pydantic schemas exactly (field names, types, optional/required).

2) COMPLETE API SERVICES
Update each service file to cover all backend endpoints:

advisorService.ts:
- getAdvisors() - GET /advisors (already exists)
- getAdvisorById(id) - GET /advisors/{advisor_id}
- createAdvisor(payload) - POST /advisors

boardMemberService.ts:
- getBoardMembers() - GET /board-members (already exists)
- getBoardMemberById(id) - GET /board-members/{board_member_id}
- createBoardMember(payload) - POST /board-members

venueService.ts:
- getVenues() - GET /venues (already exists)
- getVenueById(id) - GET /venues/{venue_id}
- createVenue(payload) - POST /venues

budgetService.ts:
- getBudgetByEvent(eventId) - GET /budgets/{event_id} (already exists)
- createBudget(payload) - POST /budgets
- updateBudget(eventId, payload) - PUT /budgets/{event_id}

registrationService.ts:
- getRegistrations(eventId?) - GET /registrations (already exists)
- registerForEvent(payload) - POST /registrations (already exists)
(these are complete, no changes needed)

messageService.ts:
- getMessagesByClub(clubId) - GET /clubs/{club_id}/messages (already exists)
- getAllMessages() - GET /messages
- createMessage(payload) - POST /messages

sponsorshipService.ts:
- getSponsorshipsByEvent(eventId) - GET /events/{event_id}/sponsorships (already exists)
- getAllSponsorships() - GET /sponsorships
- createSponsorship(payload) - POST /sponsorships

memberService.ts:
- getMembers(params) - GET /members (already exists)
- getMemberById(id) - GET /members/{member_id} (MISSING - add this)
- createMember(payload) - POST /members (already exists)

clubService.ts:
- getClubs(params) - GET /clubs (already exists)
- getClubById(id) - GET /clubs/{club_id} (already exists)
- createClub(payload) - POST /clubs (already exists)
- deleteClub(id) - DELETE /clubs/{club_id} (MISSING - add this)

eventService.ts:
- getEvents(params) - GET /events (already exists)
- getEventById(id) - GET /events/{event_id} (already exists)
- createEvent(payload) - POST /events (already exists)
- updateEvent(id, payload) - PUT /events/{event_id} (MISSING - add this)
- deleteEvent(id) - DELETE /events/{event_id} (MISSING - add this)

3) ADD REPORT SERVICE
Create a new file `src/api/services/reportService.ts`:
- getClubNetwork(clubId) - GET /reports/clubs/{club_id}/network
- getEventNetwork(eventId) - GET /reports/events/{event_id}/network
- getMemberNetwork(memberId) - GET /reports/members/{member_id}/network

Add matching TypeScript interfaces for report responses:
- ClubNetworkReport, EventNetworkReport, MemberNetworkReport
These should match the backend report schemas exactly.

4) UPDATE API CLIENT
In `src/api/client.ts`:
- Add a request interceptor that attaches auth token from localStorage if present (key: "token")
- Keep existing response error interceptor unchanged

5) VERIFICATION CHECKLIST
After changes, every backend endpoint must have a matching frontend service function:
- 3 club endpoints (GET list, GET by id, POST, DELETE)
- 3 advisor endpoints (GET list, GET by id, POST)
- 3 member endpoints (GET list, GET by id, POST)
- 3 board-member endpoints (GET list, GET by id, POST)
- 3 venue endpoints (GET list, GET by id, POST)
- 5 event endpoints (GET list, GET by id, POST, PUT, DELETE)
- 3 budget endpoints (GET by event, POST, PUT)
- 2 registration endpoints (GET list, POST)
- 2 participant endpoints (GET by event, POST)
- 3 message endpoints (GET all, GET by club, POST)
- 3 sponsorship endpoints (GET all, GET by event, POST)
- 3 report endpoints (club network, event network, member network)

EXPECTED RESULT:
- Every backend route has a corresponding typed frontend service function
- All Create/Update payloads are properly typed
- Report service is ready for use
- Auth token is automatically attached to requests
- No existing functionality is broken
