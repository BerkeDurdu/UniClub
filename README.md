# UniClub

UniClub is a full-stack university club management platform that centralizes club operations in one system.

It brings together:
- Backend API and business logic
- Frontend management interface
- Relational database modeling
- Role-based access control
- Validation and integration workflows

## What Problem This Project Solves

University club operations are often fragmented across spreadsheets, chat groups, and manual tracking.
This creates inconsistent records, weak access control, and low visibility into events, registrations, budgets, and sponsorships.

UniClub solves this by providing a role-aware, centralized platform where members, advisors, and board members can work with consistent data and controlled permissions.

## Core Modules

- Authentication and user roles
- Clubs, members, advisors, board members
- Events and venues
- Registrations and participants
- Budgets and sponsorships
- Messaging
- Relationship/network reports

## Tech Stack

### Backend
- FastAPI
- SQLModel
- PostgreSQL
- Alembic
- Pydantic
- passlib + bcrypt
- python-jose

### Frontend
- React
- TypeScript
- Vite
- React Router
- TanStack React Query
- Axios
- React Hook Form + Zod
- Tailwind CSS

## Repository Structure

- uniclub-api: Backend service
- uniclub-web: Frontend application
- api integration & validation prompts: Integration and validation prompt history
- backend prompts: Backend-oriented prompt history
- database prompts: Database-oriented prompt history
- frontend prompts: Frontend-oriented prompt history
- responsibilities: Team responsibility notes
- screenshots: Visual evidence assets

## Backend Setup

1. Go to backend folder.
2. Create and activate virtual environment.
3. Install dependencies.
4. Configure environment variables in a .env file.
5. Run API server.

Windows example:

```powershell
cd uniclub-api
python -m venv ..\.venv
..\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Default backend URL:
- http://127.0.0.1:8000

API docs:
- http://127.0.0.1:8000/docs

## Frontend Setup

1. Go to frontend folder.
2. Install dependencies.
3. Set API base URL in .env.
4. Run development server.

```powershell
cd uniclub-web
npm install
npm run dev
```

Build:

```powershell
npm run build
```

Default frontend URL:
- http://localhost:5173

## Environment Variables

### Backend (uniclub-api/.env)

Required:
- DATABASE_URL
- SECRET_KEY

Optional:
- ACCESS_TOKEN_EXPIRE_MINUTES
- SEED_MEMBER_EMAIL
- SEED_ADVISOR_EMAIL
- SEED_BOARD_EMAIL
- SEED_MEMBER_PASSWORD
- SEED_ADVISOR_PASSWORD
- SEED_BOARD_PASSWORD

### Frontend (uniclub-web/.env)

Required:
- VITE_API_BASE_URL

## Security Notes

- Passwords are stored as hashes (bcrypt), never plaintext.
- JWT is used for authentication.
- Role and club-scope checks are enforced server-side.
- Seed credentials are environment-driven to reduce secret exposure risks.

## Documentation

- Backend details: uniclub-api/README.md
- Frontend details: uniclub-web/README.md
- Full technical explanation: FULL_PROJECT_EXPLANATION.md
- Project report: REPORT.md
- 2-minute presentation prompt: PRESENTATION_PROMPT_2MIN.md

## Current Status

- Frontend build passes.
- Backend health endpoint is available.
- Auth and role-based flows are integrated.

## License

This project is for educational and demonstration purposes.
