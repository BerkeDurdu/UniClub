Add authentication and role-based authorization to the UniClub API. Passwords must be stored securely using bcrypt hashing — never in plaintext.

Do not make assumptions for any missing parts. Implement everything explicitly and consistently across models, schemas, services, routers, seed data, and authorization dependencies.

Important:
- This builds on the existing FastAPI + PostgreSQL + SQLModel stack.
- Do not break or rebuild existing models/routers/services.
- All new code must integrate cleanly with the current architecture (models.py, schemas.py, services.py, routers/, database.py).

---

## 1) User Account Model

Create a `User` table in models.py with the following columns:
- `id`: primary key (integer, auto-increment)
- `email`: string, unique, indexed, not null — used as login identifier. Must be normalized to lowercase before storage.
- `hashed_password`: string, not null — stores the bcrypt-hashed password (never store plaintext)
- `full_name`: string, not null, cannot be empty
- `role`: enum, not null — must use a proper Python `Enum` class named `UserRole` with exactly three values: `member`, `advisor`, `board_member`. No other values are allowed. Enforce at both the schema validation level and as a database constraint.
- `club_id`: foreign key to Club. Optional for `member` role. Required for `advisor` and `board_member` roles. Must reference an existing club — return 404 if the club does not exist.
- `is_active`: boolean, default True
- `created_at`: datetime, default now

### Relationship to Domain Tables

Add a `user_id` foreign key column to each of the following existing tables:
- `Member.user_id` → Foreign key to `User.id`, nullable, unique
- `Advisor.user_id` → Foreign key to `User.id`, nullable, unique
- `BoardMember.user_id` → Foreign key to `User.id`, nullable, unique

Enforce a **one-to-one** relationship between `User` and the role-specific table. Do not rely on email matching — use `user_id` as the explicit link.

On registration:
- If a role-specific record already exists for that person (matched by email), link it by setting `user_id` instead of creating a duplicate.
- If no existing record is found, create a new role-specific row and set `user_id`.
- Prevent duplicate role-profile creation: a `User` may only have one linked role-specific record. Return 409 Conflict if a link already exists.

### No Admin Role

There is **no admin or superuser role** in this system. Only the three listed roles exist: `member`, `advisor`, `board_member`. System-level management (creating advisors, fixing mismatches) is handled via seed data or direct database access, not through the API.

---

## 2) Registration Endpoint

Create `POST /auth/register` that accepts:
- `email` (validated format, normalized to lowercase)
- `password` (minimum 8 characters)
- `full_name` (non-empty string)
- `role` (must be one of: `member`, `advisor`, `board_member` — validated strictly via the `UserRole` enum)
- `club_id` (optional for members, required for advisor and board_member)

### Registration Rules Per Role

- **Members** may self-register freely. A member may register **without** a `club_id` (they can join a club later). If `club_id` is provided, it must reference an existing club.
- **Advisors** may self-register, but `club_id` is **mandatory**. The club must exist (404 if not). If the club already has an advisor linked to a different user, return 409 Conflict.
- **Board members** may self-register, but `club_id` is **mandatory**. The club must exist (404 if not).

### Registration Logic

1. Normalize email to lowercase
2. Check if email already exists in User table → return 409 Conflict with message "Email already registered"
3. If `club_id` is provided, verify the club exists → return 404 "Club not found" if not
4. Hash the password using passlib bcrypt
5. Create the User record
6. Link or create the role-specific record:
   - Check if an existing Member/Advisor/BoardMember row with matching email exists
   - If yes: set its `user_id` to the new User's id (link it)
   - If no: create a new role-specific row with `user_id` set
   - If a role-specific record is already linked to another user → return 409 Conflict
7. Return user info (without password) and a success message

---

## 3) Login Endpoint

Create `POST /auth/login` that accepts:
- `email` (normalized to lowercase)
- `password`

Logic:
- Look up user by email → return 401 Unauthorized with message "Invalid email or password" if not found
- Check `is_active` → return 401 if account is deactivated
- Verify password against stored hash using passlib bcrypt → return 401 "Invalid email or password" if mismatch (same message for both cases to prevent user enumeration)
- Generate a JWT token and return it with user profile info

---

## 4) JWT Token Specification

Use `python-jose` with the following exact configuration:
- **Algorithm**: HS256
- **Secret key**: loaded from `SECRET_KEY` environment variable (required, app must fail to start if missing)
- **Token expiration**: configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` env var, default 1440 (24 hours)
- **Refresh tokens**: out of scope — not implemented

### Required JWT Claims
- `sub`: the user's `id` (as string)
- `user_id`: integer
- `email`: string
- `role`: string (enum value)
- `club_id`: integer or null
- `exp`: expiration timestamp

### Token Error Handling
- Missing `Authorization` header → 401 "Not authenticated"
- Malformed token (not valid JWT) → 401 "Could not validate credentials"
- Expired token → 401 "Token has expired"
- Token with invalid/unknown user_id → 401 "User not found"
- Token for deactivated user → 401 "Account is deactivated"

---

## 5) Role-Based Access Control (Authorization)

### Authorization Dependencies (Centralized)

Create a dedicated `auth.py` utility module (e.g., `uniclub-api/auth.py`) with the following reusable dependencies. These must be centralized — do not duplicate authorization logic inside individual route handlers.

1. **`get_current_user(token)`** — Extracts and validates the JWT from the `Authorization: Bearer <token>` header. Returns the `User` object. Raises 401 on any failure.

2. **`require_roles(*roles: UserRole)`** — Returns a dependency that checks the current user has one of the specified roles. Raises 403 Forbidden with message "Insufficient permissions" if not.

3. **`require_same_user_or_forbid(user_id: int)`** — Checks that the current user's id matches the given `user_id`. Used for "own profile" edits. Ownership is determined by `user_id`, not by email or name. Raises 403 if mismatch.

4. **`require_same_club_or_forbid(club_id: int)`** — Checks that the current user's `club_id` matches the given `club_id`. Used for club-scoped operations. If the current user has no `club_id` (e.g., a member without a club), raises 403. Raises 403 if mismatch.

### Public vs. Protected Endpoints

Not all GET endpoints require authentication. The following are **public** (no token required):
- `GET /clubs` — public club listing
- `GET /clubs/{id}` — public club detail
- `GET /events` — public event listing
- `GET /events/{id}` — public event detail

All other GET endpoints require authentication (any role).
All POST/PUT/DELETE endpoints require authentication and role-specific authorization as defined below.

---

## 6) Full Authorization Matrix

For every entity, the following rules apply. "Own club" means the resource's `club_id` matches `user.club_id`. "Own profile" means the role-specific record's `user_id` matches the current `user.id`.

### Club
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read (list/detail) | Public | Public | Public |
| Create | No | No | No |
| Update | No | Own club only | Own club only |
| Delete | No | No | No |

### Event
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read (list/detail) | Public | Public | Public |
| Create | No | Own club only | Own club only |
| Update | No | Own club only | Own club only |
| Delete | No | Own club only | Own club only |

Advisors and board members can manage **all events belonging to their club**, not just events they personally created.

### Member
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read | Yes (auth required) | Yes | Yes |
| Create | No | Own club only | Own club only |
| Update | Own profile only | Own club members | Own club members |
| Delete | No | Own club only | Own club only |

### Advisor
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read | Yes (auth required) | Yes | Yes |
| Create | No | No | No |
| Update | No | Own profile only | No |
| Delete | No | No | No |

### BoardMember
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read | Yes (auth required) | Yes | Yes |
| Create | No | Own club only | Own club only |
| Update | No | No | Own profile only |
| Delete | No | Own club only | Own club only |

### Venue
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read | Yes (auth required) | Yes | Yes |
| Create | No | Yes | Yes |
| Update | No | Yes | Yes |
| Delete | No | No | No |

### Budget
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read | Yes (auth required) | Yes | Yes |
| Create | No | Own club events only | Own club events only |
| Update | No | Own club events only | Own club events only |
| Delete | No | Own club events only | Own club events only |

### Message
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read | Yes (auth required) | Yes | Yes |
| Create | Own club only | Own club only | Own club only |
| Update | No | No | No |
| Delete | No | Own club only | Own club only |

### Registration
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read | Yes (auth required) | Yes | Yes |
| Create | Self-register for events | Own club events | Own club events |
| Update | No | No | No |
| Delete | Own registration only | Own club events | Own club events |

### Sponsorship
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read | Yes (auth required) | Yes | Yes |
| Create | No | Own club events only | Own club events only |
| Update | No | Own club events only | Own club events only |
| Delete | No | Own club events only | Own club events only |

### Participant
| Action | Member | Advisor | Board Member |
|--------|--------|---------|--------------|
| Read | Yes (auth required) | Yes | Yes |
| Create | No | Own club events only | Own club events only |
| Update | No | Own club events only | Own club events only |
| Delete | No | Own club events only | Own club events only |

---

## 7) Pydantic Schemas

Add to schemas.py:
- `UserRegister`: email (EmailStr), password (min 8 chars), full_name (non-empty), role (UserRole enum), club_id (optional int)
- `UserLogin`: email (EmailStr), password (string)
- `UserResponse`: id, email, full_name, role, club_id, is_active, created_at — **never include hashed_password**
- `UserMeResponse`: all fields from UserResponse, plus a nested `profile` field containing the linked Member, Advisor, or BoardMember data (using existing response schemas)
- `TokenResponse`: access_token (string), token_type (string, always "bearer"), user (UserResponse)

---

## 8) Auth Router

Create `routers/auth.py` with:
- `POST /auth/register` → registration logic
- `POST /auth/login` → login logic
- `GET /auth/me` → return current user profile from JWT, including role-specific profile data

### /auth/me Response

`GET /auth/me` must return:
- `id`, `email`, `full_name`, `role`, `club_id`, `is_active`, `created_at`
- A nested `profile` object containing the linked role-specific record (Member, Advisor, or BoardMember data)
- If no linked profile exists, `profile` should be `null`

Register this router in main.py.

---

## 9) Password Security

- Use **passlib with bcrypt only**. No hashlib fallback. No alternative hashing.
- Create centralized utility functions in `auth.py`:
  - `hash_password(plain: str) -> str` — hashes with bcrypt via passlib
  - `verify_password(plain: str, hashed: str) -> bool` — verifies with passlib
- Bcrypt handles salt generation automatically
- Minimum password length: 8 characters (validated at schema level)
- Never return `hashed_password` in any API response
- Never log passwords in any form
- Exclude `hashed_password` from all Pydantic response models

---

## 10) Error Response Standards

All error responses must use consistent HTTP status codes and JSON body format `{"detail": "message"}`:

| Code | When |
|------|------|
| 400 Bad Request | Invalid payload, validation failure (missing fields, bad email format, password too short, empty name, invalid role) |
| 401 Unauthorized | Invalid credentials, missing/invalid/expired token, deactivated account |
| 403 Forbidden | Valid authentication but insufficient permissions for the requested action |
| 404 Not Found | Referenced resource does not exist (club_id, user, event, etc.) |
| 409 Conflict | Duplicate email registration, duplicate role-profile link |

---

## 11) Migration and Backward Compatibility

The existing database uses `create_db_and_tables()` on startup with seeded sample data. Since this is a development/demo project:

- **Drop and recreate** the database when applying this change. Do not attempt incremental migration.
- Update `create_db_and_tables()` to include the new `User` table
- Update all existing seed data to also create corresponding `User` records with hashed passwords
- Ensure the new `user_id` columns on Member, Advisor, and BoardMember are nullable (to remain compatible if old records exist without users)
- All newly seeded records must have proper `user_id` links

No Alembic migration script is required for this change. A clean database recreation is acceptable.

---

## 12) Dependencies to Add

Add to requirements.txt:
- `passlib[bcrypt]` — password hashing (bcrypt only, no fallback)
- `python-jose[cryptography]` — JWT token creation and verification
- `bcrypt` — bcrypt backend for passlib

Add to .env:
- `SECRET_KEY=your-secret-key-change-in-production`
- `ACCESS_TOKEN_EXPIRE_MINUTES=1440`

Update `config.py` to load `SECRET_KEY` and `ACCESS_TOKEN_EXPIRE_MINUTES` from environment.

---

## 13) Seed Data

Update the seed logic in main.py to create exactly three test user accounts:

| Role | Email Source | Password Source | Linked To |
|------|--------------|-----------------|-----------|
| member | environment variable | environment variable | First seeded Member record |
| advisor | environment variable | environment variable | First seeded Advisor record |
| board_member | environment variable | environment variable | First seeded BoardMember record |

Requirements:
- All passwords must be hashed with bcrypt before insertion
- Each user must have a valid `club_id` matching the linked role-specific record's club
- Each role-specific record must have its `user_id` set to the corresponding User
- These credentials must work immediately for login after app startup
- Seed logic must be idempotent (check if users exist before creating)

---

## Expected Result

- Users can register with email + password; passwords are stored as bcrypt hashes in PostgreSQL
- Users can log in and receive a JWT token (HS256, 24h expiry)
- The `UserRole` enum is enforced at Python, Pydantic, and database levels
- User ↔ Member/Advisor/BoardMember linked via `user_id` foreign key (one-to-one)
- Public endpoints (club/event listing) work without authentication
- Members can only read data (all other GET endpoints require auth)
- Advisors and board members can read everything, plus edit their own profile and manage their club's events and related resources
- Full authorization matrix is enforced per entity with centralized, reusable dependencies
- All error responses follow consistent HTTP status codes
- No plaintext passwords anywhere in the database, API responses, or logs
- Seed data includes working test accounts for all three roles
