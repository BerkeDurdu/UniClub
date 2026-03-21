Perform a final consistency pass on the existing `UniClub API` backend. Do not rebuild anything. Do not change architecture direction. Only fix inconsistencies, missing imports, broken references, schema/service/router mismatches, and integration gaps.

IMPORTANT:
- Use the existing files and modify them in place.
- This is a patch-and-align phase.
- Preserve all previous functionality.
- Do not rewrite the project from scratch.
- Focus on making the whole backend run cleanly end-to-end.

CHECK AND FIX THE FOLLOWING:

1. ARCHITECTURE CONSISTENCY
Ensure the project consistently uses:
- `models.py` for SQLModel models
- `schemas.py` for request/response validation
- `services.py` for business logic
- `routers/` for endpoints
- `database.py` for session/engine
- `config.py` for environment settings if it exists

2. MAIN APP CONSISTENCY
Ensure `main.py`:
- initializes FastAPI
- includes CORS middleware
- includes global exception handling
- includes all routers exactly once
- exposes `/health` and `/health/db`
- does not contain duplicate route definitions left over from earlier phases

3. SCHEMA COMPLETENESS
Ensure all route inputs/outputs have matching schemas and imports, especially:
- Club
- Advisor
- Member
- BoardMember
- Venue
- Event
- Budget
- Registration
- Participant
- Message
- Sponsorship

If response models are Pydantic v2 and routes return SQLModel objects directly, ensure response schemas support attribute-based validation (for example `from_attributes=True`) so response serialization does not fail at runtime.

4. SERVICE COMPLETENESS
Ensure all services exist and are used by routers:
- ClubService
- AdvisorService
- MemberService
- BoardMemberService
- VenueService
- EventService
- BudgetService
- RegistrationService
- ParticipantService
- MessageService
- SponsorshipService

5. ROUTER/SERVICE ALIGNMENT
Ensure each router calls the correct service methods and uses `Depends(get_session)` correctly.

6. VALIDATION ALIGNMENT
Ensure schema-level validation and service-level validation do not contradict each other.
Examples:
- negative money blocked consistently
- blank strings blocked consistently
- invalid statuses blocked consistently
- capacity rules handled consistently
- enum usage is consistent across schemas/services/models (avoid string-vs-enum mismatches)

7. IMPORT AND SYNTAX CHECK
Fix:
- missing imports
- circular imports if any
- broken references
- invalid typing
- mismatched response models
- duplicated helper names
- any syntax issue that would prevent startup

8. STARTUP SAFETY
Ensure startup works without crashing:
- tables can be created or migrations can be used consistently
- seed logic remains idempotent
- seed data respects current constraints

9. SWAGGER / DOCS SAFETY
Ensure `/docs` stays usable:
- no broken request models
- no broken response models
- no duplicated endpoint names
- route summaries and tags still render cleanly

10. FINAL QUALITY
Add brief comments/docstrings only where they improve clarity.
Do not bloat the code.

EXPECTED RESULT:
- the backend starts cleanly
- routers, schemas, services, and models align correctly
- no duplicate routes remain
- no missing schema/service exists for Message or Sponsorship
- final code is stable and presentation-ready