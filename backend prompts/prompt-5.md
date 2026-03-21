Extend the existing `UniClub API` backend with PostgreSQL-specific technical depth, migration support, health checks, and presentation-ready backend documentation. Keep all previous functionality intact.

IMPORTANT:
- Use the existing files and modify them in place.
- This phase pushes the backend toward a stronger final architecture.
- Prefer maintainable improvements over unnecessary complexity.
- Use PostgreSQL in ways that are genuinely relevant.
- Do not break previous routers, services, schemas, or seed logic.

1. ADD ALEMBIC-BASED MIGRATION SUPPORT
Introduce migrations for the PostgreSQL project.

Requirements:
- add Alembic to the project
- create migration configuration and folder structure
- create an initial migration for the current schema
- ensure future schema changes can be generated cleanly
- document how to run:
  - `alembic revision --autogenerate -m "..."`
  - `alembic upgrade head`

2. ADD CONFIGURATION MODULE
Create a proper configuration module, for example `config.py`, using environment-driven settings.

Include:
- `DATABASE_URL`
- optional `APP_ENV`
- optional `DEBUG`

Add comments explaining:
- why config should not be hardcoded
- how local development differs from deployment

3. ADD POSTGRESQL-ORIENTED IMPROVEMENTS
Where reasonable, improve the schema with PostgreSQL-aware features:
- enum types for:
  - event status
  - board member role
- indexes on frequently queried columns:
  - club name
  - advisor email
  - member email
  - member student_id
  - event status
  - event_start
  - foreign key columns
- check constraints for:
  - non-negative monetary fields
  - valid date ordering
  - positive venue capacity

4. PARTIAL UNIQUE INDEX OR DOCUMENTED STRATEGY
If the current stack supports it cleanly, implement a PostgreSQL-aware strategy for:
- only one active President per club
- optionally only one active advisor assignment per club

If partial unique indexes are too complex for the current setup:
- clearly document the intended PostgreSQL solution
- keep runtime enforcement in the service layer

5. HEALTH AND DIAGNOSTICS ENDPOINTS
Add:
- `GET /health`
- `GET /health/db`

Requirements:
- `/health` returns safe application status
- `/health/db` verifies DB connectivity
- do not leak credentials or stack traces

6. GLOBAL ERROR HANDLING
Improve global error handling:
- add custom exception handlers where useful
- keep business errors readable
- return consistent shape for internal server errors
- optionally add logging hooks
- explain in comments the difference between:
  - schema validation errors
  - business rule violations
  - unexpected server errors

7. CORS AND FINAL APP BOOTSTRAP
In `main.py`:
- add `CORSMiddleware`
- allow all origins for development
- keep the app frontend-friendly for later React integration
- include all routers cleanly
- keep `main.py` as an orchestration file, not a business-logic file

8. README IMPROVEMENTS
Create or improve `README.md` with:
- project overview
- setup instructions
- PostgreSQL setup steps
- environment variable setup
- how to run the backend
- how to run migrations
- API docs location
- screenshots placeholder section for later GitHub repo usage

9. CREATE `presentation_notes_backend.md`
Explain:
- the domain problem the backend solves
- why PostgreSQL adds value here
- how relationships map to real university club operations
- why service-layer validation matters
- where robustness is visible
- which advanced features should be highlighted in presentation
- a suggested live Swagger demo flow

10. UPDATE `test_scenarios.md`
Add scenarios for:
- failed database health check
- unsupported enum value
- invalid migration state or missing tables
- duplicate unique-field insertion
- internal server error fallback behavior

11. KEEP TABLE-CREATION VS MIGRATION STRATEGY CONSISTENT
If `create_db_and_tables()` still exists for convenience, clearly comment how it relates to Alembic.
Do not leave the architecture confusing.

EXPECTED RESULT:
- backend shows real PostgreSQL relevance
- migration support exists
- health/error handling is polished
- docs are presentation-ready
- architecture is stronger and more scalable