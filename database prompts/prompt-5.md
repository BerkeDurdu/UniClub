Extend the existing UniClub API with PostgreSQL depth, migration discipline, and database-evidence outputs. Keep architecture unchanged.

Focus:
Make the backend look technically mature and database-focused for presentation.

Required improvements:
1) Alembic migration support
- Ensure Alembic is configured and usable.
- Generate initial migration aligned with current schema.
- Document migration commands in README.

2) Config module hardening
- Use config.py with env-driven settings (DATABASE_URL, APP_ENV, DEBUG).

3) PostgreSQL-oriented schema quality
- Enum types for event status and board role
- Index frequently queried columns
- Check constraints for:
  - non-negative money fields
  - date ordering
  - positive capacity

4) Partial unique index strategy
- Implement or document PostgreSQL partial unique index for one active President per club.
- Keep service-layer enforcement as fallback.

5) Health and diagnostics
- GET /health
- GET /health/db with safe connectivity check

6) Global error behavior
- Consistent internal error shape
- Clear distinction between validation, business, and unexpected errors

7) Database relationship evidence artifacts
Create a markdown file: database_relationship_proof.md including:
- ERD-style Mermaid diagram
- At least 10 SQL verification queries using JOINs and aggregates
- Example expected outputs (short table-like samples)
- A checklist showing each of 11 entities and how it connects

8) Add utility script
Create check.py or scripts/check_relationships.py to run selected SQL checks and print pass/fail style output.

9) Screenshots evidence in repository
- Create a screenshots/ directory at repo root.
- Add at least 2 critical screenshots of the running web app.
- At minimum include:
  - one screenshot showing a key list/detail page using real backend data
  - one screenshot showing Swagger /docs with successful request/response examples
- Update README.md with a "Screenshots" section linking these images.

10) README rubric mapping
- Add a short section that maps implemented features to grading dimensions:
  - code correctness and topic inclusions
  - robustness and edge-case handling
  - technical documentation and prompt quality
  - technical depth
- Explicitly mention PostgreSQL usage and 10+ entity relational model as extra-credit evidence.

Expected result:
- Strong PostgreSQL credibility
- Migrations + constraints + diagnostics
- Concrete artifacts that prove relational DB setup.