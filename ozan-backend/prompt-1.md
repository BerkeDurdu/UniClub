Create a complete backend-only FastAPI project called "UniClub API" for a university club and event management system.

IMPORTANT:
- This is backend-only. Do not create any frontend code.
- Use FastAPI for the backend.
- Use PostgreSQL, not SQLite.
- The project must be runnable from zero, including setup files.
- Swagger UI must work so endpoints can be tested from the browser.
- Generate real working code, not pseudo-code.
- Use Python type hints everywhere.
- Keep the implementation professional, extensible, and safe to build on in later prompts.

GOAL:
Generate the initial backend project so that after setup:
- the FastAPI server runs successfully
- PostgreSQL is connected
- tables are created
- seed data is inserted safely
- Swagger UI is available at `/docs`
- ReDoc is available at `/redoc`
- initial GET/POST/PUT/DELETE-style backend endpoints can be tested from the browser

PROJECT STRUCTURE:
Create a folder called `uniclub-api` with at least these files:

- `main.py`
- `models.py`
- `database.py`
- `requirements.txt`
- `.env.example`
- `.gitignore`
- `README.md`

If needed, also create:
- `__init__.py`

DEPENDENCIES:
Put these in `requirements.txt`:
- fastapi
- uvicorn[standard]
- sqlmodel
- psycopg[binary]
- python-dotenv
- pydantic
- pydantic-settings
- email-validator

ENVIRONMENT SETUP:
Create `.env.example` with:
- `DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/uniclub_db`

Create `.gitignore` with:
- `__pycache__/`
- `.venv/`
- `.env`
- `*.pyc`

README REQUIREMENTS:
In `README.md`, include a beginner-friendly setup guide with:
1. How to create the project folder
2. How to create and activate a virtual environment

Windows:
- `python -m venv .venv`
- `.venv\Scripts\activate`

macOS/Linux:
- `python3 -m venv .venv`
- `source .venv/bin/activate`

3. How to install dependencies:
- `pip install -r requirements.txt`

4. How to create PostgreSQL database:
- database name: `uniclub_db`

5. How to copy `.env.example` to `.env` and update credentials

6. How to run the app:
- `uvicorn main:app --reload`

7. What URLs to open:
- API root: `http://127.0.0.1:8000/`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

Also explain clearly that:
- FastAPI automatically provides Swagger UI at `/docs`
- Swagger UI will be used to inspect and test endpoints
- This screen can be used for adding, updating, deleting, and listing records

DATABASE SETUP:
In `database.py`:
- use PostgreSQL with SQLModel
- load `DATABASE_URL` from environment variables
- create the SQLModel engine
- enable `echo=True` for learning/debugging
- implement:
  - `create_db_and_tables()`
  - `get_session()` generator for FastAPI dependency injection

Add comments explaining:
- why PostgreSQL was selected
- why credentials should not be hardcoded
- how dependency injection works with `get_session()`

MODELS:
In `models.py`, create SQLModel models with proper relationships, foreign keys, `back_populates`, constraints, and type hints.

Create these entities:
- Club
- Advisor
- Member
- BoardMember
- Event
- Message
- Registration
- Sponsorship
- Venue
- Budget
- Participant

REQUIRED CORE FIELDS:

Club:
- id
- name
- description
- category
- founded_date
- relationships to members, board members, events, messages, and advisor

Advisor:
- id
- full_name
- email
- department
- assigned_date
- relationship to one club

Member:
- id
- student_id
- first_name
- last_name
- email
- department
- join_date
- optional leave_date
- optional club_id
- relationships to club, messages, registrations, and participant records

BoardMember:
- id
- student_id
- first_name
- last_name
- email
- role
- join_date
- optional leave_date
- club_id
- relationship to club

Event:
- id
- title
- description
- status
- event_start
- event_end
- club_id
- optional venue_id
- relationships to club, venue, registrations, sponsorships, budget, and participants

Message:
- id
- subject
- content
- sent_at
- club_id
- member_id
- relationships to club and member

Registration:
- id
- registered_at
- event_id
- member_id
- relationships to event and member

Sponsorship:
- id
- sponsor_name
- amount
- agreement_date
- event_id
- relationship to event

Venue:
- id
- name
- location
- capacity
- optional venue_type
- optional description
- relationship to events

Budget:
- id
- event_id
- planned_amount
- actual_amount
- optional notes
- relationship to one event

Participant:
- id
- event_id
- optional member_id
- first_name
- last_name
- optional email
- optional phone
- optional checked_in_at
- relationships to event and optional member

DATABASE-LEVEL CONSTRAINTS:
Implement reasonable DB-level constraints:
- club name unique
- advisor email unique
- member email unique
- member student_id unique
- board member email unique
- registration unique on `(event_id, member_id)`
- budget one-to-one with event using unique `event_id`
- venue capacity > 0
- sponsorship amount >= 0
- budget planned_amount >= 0
- budget actual_amount >= 0
- leave_date >= join_date where applicable
- event_end >= event_start
- event status restricted to:
  - Scheduled
  - Completed
  - Canceled

MAIN APP:
In `main.py`:
- create `app = FastAPI(...)` with:
  - title `"UniClub API"`
  - version `"1.0.0"`
  - description for a university club and event management backend
- keep Swagger UI enabled
- keep ReDoc enabled
- use default docs URLs:
  - `/docs`
  - `/redoc`

STARTUP LOGIC:
Add startup logic that:
- creates tables
- seeds starter data only if main tables are empty

SEED DATA:
Create idempotent seed logic.
Seed at least:
- 3 clubs: IEEE, Music Club, Sports Club
- 3 advisors
- several members
- several board members
- at least 3 events with mixed statuses
- at least 2 venues
- at least 2 budgets
- at least 3 sponsorships
- at least 4 registrations
- at least 4 participants

Seed requirements:
- do not duplicate records on repeated startup
- use stable lookups like name, email, or student_id instead of assuming numeric IDs
- ensure seeded data respects all DB constraints

INITIAL ENDPOINTS:
Create working endpoints directly in `main.py` for this first phase.

GENERAL:
- `GET /`
  - returns welcome message
  - returns docs link
  - returns redoc link

CLUBS:
- `GET /clubs`
- `GET /clubs/{club_id}`
- `POST /clubs`

MEMBERS:
- `GET /members`
- `GET /members/{member_id}`
- `POST /members`

EVENTS:
- `GET /events`
- `GET /events/{event_id}`
- `POST /events`
- `PUT /events/{event_id}`
- `DELETE /events/{event_id}`

VENUES:
- `GET /venues`
- `GET /venues/{venue_id}`

IMPORTANT FOR SWAGGER UI:
- make sure these endpoints appear cleanly in `/docs`
- add route summaries and descriptions
- add response descriptions where reasonable
- use proper status codes:
  - `201 Created` for POST
  - `200 OK` for GET and PUT
  - `204 No Content` for DELETE

REQUEST/RESPONSE MODELS:
For this first phase, if needed, define simple request models in `main.py` so POST/PUT endpoints work correctly in Swagger UI.
Later prompts will move these into `schemas.py`.

COMMENTS AND DOCSTRINGS:
- add docstrings to functions
- explain in comments:
  - what SQLModel does
  - why PostgreSQL is used here
  - why relationships matter
  - why seed logic must be idempotent
  - why FastAPI Swagger UI is useful during backend development

RUNNING NOTES:
At the top of `main.py`, add a comment block explaining:
- how to create and activate a virtual environment
- how to install dependencies
- how to create PostgreSQL database `uniclub_db`
- how to set `DATABASE_URL`
- how to run:
  `uvicorn main:app --reload`
- where to access:
  - root endpoint
  - Swagger UI
  - ReDoc

EXPECTED RESULT:
- a working PostgreSQL-backed FastAPI backend
- more than 10 entities/tables
- proper relationships
- starter data
- working GET/POST/PUT/DELETE endpoints
- Swagger UI visible at `/docs`
- endpoints testable visually from the browser