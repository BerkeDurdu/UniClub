Create Phase 1 of a backend-only FastAPI project for a university club system called "UniClub API".

Important:
- Keep this backend-only. No frontend files.
- Use PostgreSQL (not SQLite).
- Generate real runnable code.
- Keep architecture clean for later phases.

Rubric alignment note:
- Instructor minimum requires SQLite + FastAPI + React/Vite + Pydantic + 5+ entities.
- This backend intentionally exceeds DB expectations with PostgreSQL for extra points.
- Frontend and presentation artifacts will be handled in later prompts/repo deliverables.

Goal:
Build the initial data model and database integration so 11 entities and their connections are clearly established in the database.

Entities (must all exist):
- Club
- Advisor
- Member
- BoardMember
- Event
- Venue
- Registration
- Participant
- Message
- Sponsorship
- Budget

Required relationship intent:
- Club has one Advisor (or optional until assignment)
- Club has many Members
- Club has many BoardMembers
- Club has many Events
- Club has many Messages
- Event belongs to one Club
- Event optionally belongs to one Venue
- Event has many Registrations
- Event has many Participants
- Event has many Sponsorships
- Event has one Budget
- Member belongs to one Club (optional)
- Member has many Registrations
- Member has many Messages
- Member can appear in Participants

Project files (minimum):
- main.py
- database.py
- models.py
- requirements.txt
- .env.example
- .gitignore
- README.md

Technical requirements:
- Use SQLModel for models and relationships.
- Use type hints everywhere.
- Use PostgreSQL connection from env variable.
- Include create_db_and_tables() and get_session().
- Add startup seed logic that inserts coherent sample data for all entities.
- Seed data must respect foreign keys and relationship consistency.

Seed requirements:
- At least 3 clubs
- At least 1 advisor per seeded club where possible
- At least 10 members distributed across clubs
- At least 6 events linked to clubs and some to venues
- At least 1 budget for multiple events
- At least 5 sponsorship rows
- At least 12 registration rows
- At least 12 participant rows (mix member-linked and external)
- At least 8 messages

Also provide:
- A short section in README named "Database Relationship Proof" with example SQL JOIN queries to verify links.
- Endpoints: /health, /docs, /redoc.

Expected result:
- Backend runs
- PostgreSQL tables are created
- Sample relational data exists
- Relationships can be demonstrated via SQL joins and API responses.