# UniClub API Setup Guide

**Production:** https://uniclub-production.up.railway.app · Swagger UI at `/docs`

## Architecture Overview
A layered FastAPI + SQLModel backend on top of PostgreSQL. Authentication covers email/password, Google + GitHub OAuth (Authlib), and three independent 2FA methods (TOTP, Email OTP, WebAuthn). Transactional email goes through the Resend HTTP API in production with SMTP and console fallbacks. Schema is created via SQLModel `create_all` for fast iteration; `alembic` is wired up for production-grade migrations once schemas stabilize.

## 1. Create and activate a virtual environment

**Windows:**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 2. Install dependencies:
```bash
pip install -r requirements.txt
```

## 3. Database setup:
Ensure you have PostgreSQL installed. Create a database named `uniclub_db`.
```sql
CREATE DATABASE uniclub_db;
```

## 4. Environment Variables:
Copy `.env.example` to `.env`. Update the `DATABASE_URL` as needed inside the `.env` file.

## 5. Migrations (Alembic):
If you make any changes to the models, you should generate an Alembic migration:
```bash
alembic revision --autogenerate -m "Add new field"
```
To apply migrations against your PostgreSQL database:
```bash
alembic upgrade head
```
*Note*: During startup, `main.py` explicitly calls `create_db_and_tables()` for convenience to automatically deploy tables when migrations are non-essential for a rapid setup. However, once schemas stabilize, use Alembic correctly!

## 6. Run the app:
```bash
uvicorn main:app --reload
```

## 7. URLs to open:
- API Docs: `http://127.0.0.1:8000/docs`
- Redoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health/db`

## Seed Demo Accounts

Seed account emails and passwords are configurable via environment variables and should not be committed in plaintext.

Recommended variables:

- `SEED_MEMBER_EMAIL`
- `SEED_ADVISOR_EMAIL`
- `SEED_BOARD_EMAIL`
- `SEED_MEMBER_PASSWORD`
- `SEED_ADVISOR_PASSWORD`
- `SEED_BOARD_PASSWORD`

If seed passwords are not provided, backend generates deterministic fallback values from `SECRET_KEY` at startup.

## Auth Storage Diagnostics

- `postgres` in `DATABASE_URL` is only the PostgreSQL connection account.
- Application login accounts are stored as rows in `app_user` table.
- Passwords are stored as bcrypt hashes in `app_user.hashed_password`.

Safe SQL checks (no plaintext exposure):

```sql
-- Count application users
SELECT COUNT(*) AS user_count FROM app_user;

-- List non-sensitive account fields
SELECT email, role, club_id, is_active FROM app_user ORDER BY id;

-- Verify hash is present and not plaintext-like
SELECT
	email,
	LENGTH(hashed_password) AS hash_len,
	CASE WHEN hashed_password LIKE '$2%' THEN 'bcrypt' ELSE 'unexpected' END AS hash_format
FROM app_user;
```

[Screenshot place folder here for future reference]

## Database Relationship Proof

You can verify relationship integrity using SQL JOINs after seeding:

```sql
SELECT c.name AS club, a.full_name AS advisor
FROM club c
LEFT JOIN advisor a ON a.club_id = c.id;

SELECT e.title, v.name AS venue, COUNT(r.id) AS registration_count
FROM event e
LEFT JOIN venue v ON v.id = e.venue_id
LEFT JOIN registration r ON r.event_id = e.id
GROUP BY e.id, e.title, v.name;
```

For full evidence, see `database_relationship_proof.md`.

## Screenshots

- `../screenshots/screenshot-backend-data.png`: backend-driven list/detail sample
- `../screenshots/screenshot-swagger-success.png`: Swagger `/docs` success responses

Replace placeholders with real captures before final submission.

## Rubric Mapping

- Code correctness & topic inclusion: 11-entity relational backend with PostgreSQL and modular FastAPI architecture.
- Robustness & edge-case handling: service-layer business rules, conflict checks, and health diagnostics.
- Technical documentation quality: architecture notes, relationship proof markdown, and test scenarios.
- Technical depth: PostgreSQL constraints, enum modeling, partial unique index strategy, Alembic support.

## Authentication endpoints

| Path | Purpose |
| --- | --- |
| `POST /auth/register`, `POST /auth/login` | Email + password with bcrypt; returns JWT or a 2FA challenge token. |
| `GET /auth/oauth/{google,github}/login` and `/callback` | OpenID Connect via Authlib. |
| `GET /auth/me` | Current user, role, and effective permissions. |
| `POST /auth/password/forgot`, `POST /auth/password/reset` | Self-service password reset. Forgot endpoint returns 200 unconditionally to prevent enumeration. Tokens are 32-byte urlsafe, SHA-256 hashed at rest, single-use, 1-hour TTL. |
| `POST /2fa/totp/setup`, `/confirm`, `/disable` | TOTP enrollment. |
| `POST /2fa/email/enable`, `/disable`, `/login/email/send`, `/verify` | Email OTP enrollment and login. |
| `POST /2fa/webauthn/register/*`, `/login/webauthn/*` | WebAuthn / passkey enrollment and login. |
| `GET/PUT /admin/permissions` | Live editing of role-to-permission grants (admin only). |

## Final Submission

- GitHub URL: https://github.com/BerkeDurdu/UniClub
- Presentation file: `UniClub.pptx` (in repository root or `presentations/`)
- Screenshot location: `screenshots/`
- Repository report file: `REPORT.md`
