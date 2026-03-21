# Presentation Notes: UniClub API

## Domain Problem Solved
Managing a university's club ecosystems involves dense data relations mapping students (Members) to clubs, taking on dynamic leadership roles (Board Members) overseen by Faculty (Advisors). Orchestrating their events safely includes budgeting, tracking external attendance (Participants) against limited capacity (Venues), and handling financial backing (Sponsorships). 
The `UniClub API` solves this by delivering a stable, centralized platform tracking all of these entities in real-time.

## Value of PostgreSQL
PostgreSQL isn't just a basic datastore; it natively supports:
- **Enumerations Types**: The `EventStatus` or `BoardRole` enums are locked at the DB schema context preventing bad programmatic logic from corrupting tables.
- **Partial Unique Indexes**: We mandate logic at the DB engine: "A club can have only ONE active President". Even with race conditions across parallel web requests, the DB constraint safely handles it.
- **Robustness at Scale**: For large campuses with thousands of simultaneous students checking in to Hackathons, Postgres scales reliably.

## Mapping Relationships
- **Member** links to an **Event** via the **Registration** junction (Many-to-Many).
- **Advisors** provide a 1:1 mentorship tracking, strictly preventing an advisor from juggling multiple active clubs.
- **Events** link to **Venues**. If participants exceed venue limits, the system blocks registration proactively via business constraint checking.

## Service-Layer Validation & Robustness
All queries and business rule validations exist inside the Service layer:
- The APIs (`routers/`) don't execute raw database loops. 
- Fast Pydantic models validate fundamental constraints cleanly (e.g. `amount < 0` instantly fails).
- If Pydantic permits it, the Service queries context (e.g., checking if the candidate has a conflicting board role, making sure they aren't registering for a past event).

## Recommended Demo Flow
1. Load `/docs` (Swagger UI).
2. Hit the `/health/db` endpoint to show instant database validation.
3. List Clubs with `category="Sports"` to demonstrate backend filtering (paginated capabilities).
4. Attempt to create a conflicting registration duplicate—showcase a `409 Conflict`.
5. Trigger a deliberate validation violation (like a negative budget) to see `422 Unprocessable Entity` response structure reliably block it.

## 3-Minute Live Swagger Flow (Exact Endpoint Order)

1. `GET /health`
2. `GET /health/db`
3. `GET /reports/club-network/{club_id}`
4. `GET /reports/event-network/{event_id}`
5. `GET /reports/member-network/{member_id}`
6. `POST /registrations` (duplicate or invalid state case)

## Speaking Points per Relationship Proof

- Club network: advisor, members, board members, events, messages are all linked and counted.
- Event network: venue, budget, registrations, participants, sponsorships prove deep event context.
- Member network: member activity shows club relation, messaging, registration, and participation traces.

## Rehearsal Checklist

- Time management:
	- 0:00-0:30 architecture overview
	- 0:30-1:30 relationship report endpoints
	- 1:30-2:20 validation/conflict demos
	- 2:20-3:00 Q&A buffer and summary
- Technical depth terminology: use FK, constraints, enum, partial unique index, migration, service-layer validation.
- Fluency and engagement: avoid reading directly, explain what each endpoint proves.
