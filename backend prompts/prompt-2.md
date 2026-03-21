Extend the existing `UniClub API` backend from the previous prompt. Keep all existing code intact. Do NOT rebuild from scratch.

IMPORTANT:
- Use the existing files and modify them in place.
- Keep PostgreSQL setup unchanged.
- Keep seed logic working.
- Keep backend-only.
- Do not remove working endpoints from Prompt 1.
- Move toward a cleaner architecture with separate schemas and services.
- Routes should become thinner; business logic should move into services.

GOAL:
Refactor the project into a cleaner backend architecture with:
- `schemas.py`
- `services.py`
- `main.py` still containing routes in this phase
- all major domain entities covered consistently

1. CREATE `schemas.py`
Create separate request/response Pydantic schemas. Keep them separate from SQLModel models.

Required schemas:

Club:
- `ClubCreate`
- `ClubResponse`
- `ClubUpdate`

Advisor:
- `AdvisorCreate`
- `AdvisorResponse`

Member:
- `MemberCreate`
- `MemberResponse`
- `MemberUpdateLeaveDate`

BoardMember:
- `BoardMemberCreate`
- `BoardMemberResponse`

Venue:
- `VenueCreate`
- `VenueResponse`

Event:
- `EventCreate`
- `EventUpdate`
- `EventResponse`

Budget:
- `BudgetCreate`
- `BudgetResponse`
- `BudgetUpdate`

Registration:
- `RegistrationCreate`
- `RegistrationResponse`

Participant:
- `ParticipantCreate`
- `ParticipantResponse`

Message:
- `MessageCreate`
- `MessageResponse`

Sponsorship:
- `SponsorshipCreate`
- `SponsorshipResponse`

2. FIELD-LEVEL VALIDATION
Use proper Pydantic validation:
- names, descriptions, subject, title, content: `min_length=1` where appropriate
- email fields use `EmailStr`
- `capacity: int = Field(gt=0)`
- financial fields use `Field(ge=0)`
- if using Pydantic v2 and returning SQLModel/ORM instances directly from routes, response schemas must support attribute-based parsing (e.g. `model_config = ConfigDict(from_attributes=True)` or an equivalent shared response base class)
- validate event status against:
  - Scheduled
  - Completed
  - Canceled
- validate board member role against:
  - President
  - Vice President
  - Secretary
  - Treasurer
  - Coordinator
- optional regex validation for `student_id`
- make update schemas partial where appropriate

3. CREATE `services.py`
Create a service layer and move business/data-access logic there.

Create these service classes:
- `ClubService`
- `AdvisorService`
- `MemberService`
- `BoardMemberService`
- `VenueService`
- `EventService`
- `BudgetService`
- `RegistrationService`
- `ParticipantService`
- `MessageService`
- `SponsorshipService`

4. REQUIRED SERVICE RESPONSIBILITIES

ClubService:
- create club
- get club by id
- list clubs
- delete club if allowed

AdvisorService:
- create advisor
- assign advisor to club
- get advisor
- list advisors

MemberService:
- create member
- get member
- list members
- assign member to club
- update leave date

BoardMemberService:
- create board member
- get board member
- list board members
- assign board role to club

VenueService:
- create venue
- get venue
- list venues

EventService:
- create event
- get event
- list events
- update event
- delete event

BudgetService:
- create budget
- get budget by event
- update budget

RegistrationService:
- register member to event
- list registrations
- cancel registration if needed

ParticipantService:
- add participant
- list participants by event

MessageService:
- create message
- get message
- list messages
- list messages by club

SponsorshipService:
- create sponsorship
- get sponsorship
- list sponsorships
- list sponsorships by event

5. ROUTES IN `main.py`
Refactor `main.py` so routes call services instead of directly using database logic.

Add or update these endpoints:

- `POST /clubs`
- `GET /clubs`
- `GET /clubs/{club_id}`
- `DELETE /clubs/{club_id}`

- `POST /advisors`
- `GET /advisors`
- `GET /advisors/{advisor_id}`

- `POST /members`
- `GET /members`
- `GET /members/{member_id}`

- `POST /board-members`
- `GET /board-members`
- `GET /board-members/{board_member_id}`

- `POST /venues`
- `GET /venues`
- `GET /venues/{venue_id}`

- `POST /events`
- `GET /events`
- `GET /events/{event_id}`
- `PUT /events/{event_id}`
- `DELETE /events/{event_id}`

- `POST /budgets`
- `GET /budgets/{event_id}`
- `PUT /budgets/{event_id}`

- `POST /registrations`
- `GET /registrations`

- `POST /participants`
- `GET /events/{event_id}/participants`

- `POST /messages`
- `GET /messages`
- `GET /clubs/{club_id}/messages`

- `POST /sponsorships`
- `GET /sponsorships`
- `GET /events/{event_id}/sponsorships`

6. HTTP STATUS CODES
Use proper status codes:
- `201 Created` for successful POST
- `200 OK` for GET and PUT
- `204 No Content` for DELETE

7. SWAGGER / OPENAPI QUALITY
Make request and response models appear cleanly in `/docs`.
Use `summary` and `description` for routes where reasonable.
Ensure response models serialize real SQLModel instances without runtime `ValidationError`.

8. DOCUMENTATION
- add docstrings to every service method
- add docstrings to every route
- explain the separation between:
  - database models
  - schemas
  - services
  - routes

9. CREATE `test_scenarios.md`
Document at least:
- creating a club with duplicate name
- creating a venue with invalid capacity
- creating an event with invalid dates
- creating a budget with negative planned amount
- registering a member twice for the same event
- creating a participant with missing required name fields
- creating a message with blank content
- creating a sponsorship with negative amount

EXPECTED RESULT:
- PostgreSQL remains in place
- schemas are separate from models
- services contain logic
- routes are thinner
- Swagger shows clean request/response models
- message and sponsorship flows already exist before later refactors