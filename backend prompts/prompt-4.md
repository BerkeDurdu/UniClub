Extend the existing `UniClub API` backend with better API usability, cleaner routing, and stronger technical documentation. Keep all previous functionality intact.

IMPORTANT:
- Use the existing files and modify them in place.
- This phase is a refactor and extension, not a rebuild.
- Do not remove working functionality.
- Do not duplicate existing route definitions.
- After this refactor, `main.py` should only handle app setup, startup/lifespan, middleware, exception handling, health endpoints, and router inclusion.
- Move route definitions cleanly into routers.
- Keep services responsible for query construction and business logic.

1. ADD ADVANCED QUERY CAPABILITIES

For `GET /clubs`:
- `category: Optional[str]`
- `search: Optional[str]` for case-insensitive search in club name
- `skip: int = 0`
- `limit: int = 100`

For `GET /members`:
- `department: Optional[str]`
- `club_id: Optional[int]`
- `search: Optional[str]` for first name, last name, or student_id
- `skip: int = 0`
- `limit: int = 100`

For `GET /events`:
- `status: Optional[str]`
- `club_id: Optional[int]`
- `venue_id: Optional[int]`
- `upcoming_only: bool = False`
- `sort_by: str = "event_start"`
- `skip: int = 0`
- `limit: int = 100`

For `GET /registrations`:
- `event_id: Optional[int]`
- `member_id: Optional[int]`

For `GET /events/{event_id}/participants`:
- optional filter for linked-member vs external attendee

2. QUERY LOGIC IN SERVICES
Implement filtering and pagination in service methods:
- build filtered queries safely
- use skip/limit pagination
- validate allowed `sort_by` fields
- reject unsupported sort fields with clear 400 errors

3. ADD ROUTE METADATA
Improve Swagger/OpenAPI using:
- `summary`
- `description`
- `tags`
- parameter descriptions via `Query(...)` and `Path(...)`

Use tags such as:
- Clubs
- Advisors
- Members
- Board Members
- Events
- Venues
- Budgets
- Registrations
- Participants
- Messages
- Sponsorships
- Health

4. ROUTER MODULARIZATION
Create a `routers/` package and move route logic into separate files:

- `routers/clubs.py`
- `routers/advisors.py`
- `routers/members.py`
- `routers/board_members.py`
- `routers/events.py`
- `routers/venues.py`
- `routers/budgets.py`
- `routers/registrations.py`
- `routers/participants.py`
- `routers/messages.py`
- `routers/sponsorships.py`

Update `main.py` so it:
- initializes FastAPI app
- creates tables and runs seed logic
- includes all routers
- does not keep old duplicated route definitions

5. MESSAGE ENDPOINTS
Ensure message endpoints still exist and work after refactor:
- `POST /messages`
- `GET /messages`
- `GET /clubs/{club_id}/messages`

6. SPONSORSHIP ENDPOINTS
Ensure sponsorship endpoints still exist and work after refactor:
- `POST /sponsorships`
- `GET /sponsorships`
- `GET /events/{event_id}/sponsorships`

7. CREATE `backend_design_notes.md`
Explain:
- project structure
- why PostgreSQL was chosen
- why schemas, services, and routers are separated
- how relationships are modeled
- where business rules are enforced
- which constraints are DB-level vs service-level
- why this architecture is strong for a university club management system

8. UPDATE `test_scenarios.md`
Add API behavior scenarios for:
- invalid sort field
- paginated member query
- filtering events by status
- filtering clubs by category
- listing participants for one event
- creating message with invalid member_id
- creating sponsorship for past event if blocked
- querying empty result sets successfully

EXPECTED RESULT:
- cleaner modular routing
- stronger OpenAPI docs
- safe query flexibility
- no duplicate routes left behind
- message and sponsorship flows preserved after refactor