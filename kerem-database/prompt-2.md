Extend the existing UniClub API from Phase 1. Do not rebuild from scratch.

Focus:
Move toward a clean layered architecture and expose relationship-heavy API responses that make the database links visibly correct.

Architecture requirements:
- Keep SQLModel entities in models.py
- Create schemas.py for request/response models
- Create services.py for business logic
- Keep routes in main.py for this phase

Schema requirements:
Create create/response/update schemas where relevant for all 11 entities.
If returning ORM/SQLModel objects directly, ensure Pydantic v2 compatibility with from_attributes.

Service layer requirements:
Create service classes for all domains:
- ClubService
- AdvisorService
- MemberService
- BoardMemberService
- EventService
- VenueService
- RegistrationService
- ParticipantService
- MessageService
- SponsorshipService
- BudgetService

Route requirements (minimum):
- CRUD-style coverage for all entities
- Strong GET endpoints to show relations, for example:
  - GET /clubs/{club_id}/full-profile
  - GET /events/{event_id}/full-details
  - GET /members/{member_id}/activity

Relationship response expectations:
- club full-profile should include advisor, members, board members, events, messages
- event full-details should include venue, budget, sponsorships, participants, registrations
- member activity should include club, messages, registrations, participated events

Validation:
- Email fields use EmailStr
- Numeric amounts non-negative
- Venue capacity > 0
- Text fields not blank

Expected result:
- Thin routes, reusable services, explicit schemas
- API outputs clearly prove relational integrity to reviewers.