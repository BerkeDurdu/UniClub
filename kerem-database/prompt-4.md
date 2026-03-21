Refactor the existing UniClub API for modular routing and advanced query usability. Preserve all behavior.

Focus:
Improve API readability and prove relationship queries in a reviewer-friendly way.

Router modularization:
Create routers package and split routes:
- routers/clubs.py
- routers/advisors.py
- routers/members.py
- routers/board_members.py
- routers/events.py
- routers/venues.py
- routers/registrations.py
- routers/participants.py
- routers/messages.py
- routers/sponsorships.py
- routers/budgets.py

main.py should only:
- create app
- configure middleware
- include routers
- startup/lifespan
- global exception handling
- health endpoints

Advanced filtering:
- GET /clubs: category, search, skip, limit
- GET /members: department, club_id, search, skip, limit
- GET /events: status, club_id, venue_id, upcoming_only, sort_by, skip, limit
- GET /registrations: event_id, member_id
- GET /events/{event_id}/participants with linked/external filter

Rules:
- Validate sort_by allowlist and return 400 for unsupported field.
- Put query construction in services.

OpenAPI quality:
- Add tags, summary, description for all endpoints.
- Add Query/Path parameter descriptions.

Relationship-proof endpoints (must exist):
- GET /reports/club-network/{club_id}
- GET /reports/event-network/{event_id}
- GET /reports/member-network/{member_id}

Each report endpoint should return nested relational data and counts so it is obvious that DB links are established.

Expected result:
- Modular clean routes
- Better Swagger quality
- Rich filtered queries
- Dedicated report endpoints for relationship demonstration.