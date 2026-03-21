# Backend Design Notes

## Project Structure
The backend uses a layered architecture to cleanly separate concerns:
- **Models** (`models.py`): SQLModel declarations that define the database schema and table relationships.
- **Schemas** (`schemas.py`): Pydantic classes defining HTTP request/response payloads, ensuring data validation (e.g. constraints on string lengths or numeric constraints).
- **Services** (`services.py`): Contains all business logic, constraints, and query assembly (e.g. paginated and filtered queries). Routes invoke these services instead of executing queries themselves.
- **Routers** (`routers/`): Keeps endpoint configurations modular, allowing `main.py` to be simple and focus solely on FastAPI setup, startup logic, and middleware.

## Why PostgreSQL?
We use PostgreSQL to ensure:
- Advanced relational queries and constraints.
- Real-world production parity (unlike SQLite, which allows concurrent writes but has lock struggles at scale).
- Reliable execution of strict references such as foreign keys in complex relations (like budgets, sponsorships, and participants).

## Constraints: DB vs Service-level
- **DB-level constraints**: Enforced by SQLModel fields (like unique emails, primary keys). Handled by DB for reliable concurrent protection.
- **Schema-level**: Enforced natively by Pydantic before hitting the service (`gt=0`, `min_length=1`, `EmailStr`). Returns `422 Unprocessable Entity` immediately.
- **Service-level rules**: Enforced in pure Python. Use database queries to validate if a constraint requires looking at other data sets, returning `400 Bad Request` or `409 Conflict`.
  - Example: Prevent registering for a past/completed/canceled event.

## Why this architecture is strong for a club management system
A university context typically involves multiple layers of permissions, overlapping associations (students playing multiple roles in various clubs), and dynamic reporting queries. A modular Service Layer ensures that rules are enforced globally (no matter which route invokes it). Keeping schemas separate from DB models enables us to respond with tailored data shapes, protecting underlying database internals from leaking unintentionally.
