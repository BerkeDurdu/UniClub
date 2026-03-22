# UniClub Web

UniClub Web is a React-based management interface for the UniClub FastAPI backend.
It provides a single dashboard for clubs, events, members, registrations, and sponsorship flows.

## Tech Stack

- React 19 + Vite + TypeScript
- Tailwind CSS
- React Router DOM
- Axios
- React Hook Form + Zod
- TanStack React Query
- React Hot Toast

## Pages and Routes

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/dashboard` | Health check, stats overview, event capacity pulse |
| Clubs | `/clubs` | List, search, filter, create clubs |
| Club Detail | `/clubs/:id` | Club profile, advisor, members, board, events, messages |
| Events | `/events` | List, filter by status, create events |
| Event Detail | `/events/:id` | Event info, budget, registrations, participants, sponsorships |
| Members | `/members` | Member participation analytics |
| Advisors | `/advisors` | List, search, create advisors |
| Board Members | `/board-members` | List, filter by role/club, create board members |
| Venues | `/venues` | List and create venues |
| Budgets | `/budgets` | Budget tracking per event |
| Registrations | `/registrations` | Event registration management |
| Sponsorships | `/sponsorships` | Sponsorship tracking |
| Messages | `/messages` | Club message management |
| Login | `/auth/login` | Email/password login |
| Register | `/auth/register` | Account creation |
| 404 | `*` | Not found page |

## API Integration Summary

### Backend Endpoints Used

| Frontend Service | Backend Endpoints |
|-----------------|-------------------|
| clubService | `GET /clubs`, `GET /clubs/:id`, `POST /clubs`, `DELETE /clubs/:id` |
| advisorService | `GET /advisors`, `GET /advisors/:id`, `POST /advisors` |
| memberService | `GET /members`, `GET /members/:id`, `POST /members` |
| boardMemberService | `GET /board-members`, `GET /board-members/:id`, `POST /board-members` |
| venueService | `GET /venues`, `GET /venues/:id`, `POST /venues` |
| eventService | `GET /events`, `GET /events/:id`, `POST /events`, `PUT /events/:id`, `DELETE /events/:id` |
| budgetService | `GET /budgets/:eventId`, `POST /budgets`, `PUT /budgets/:eventId` |
| registrationService | `GET /registrations`, `POST /registrations` |
| participantService | `GET /events/:eventId/participants`, `POST /participants` |
| messageService | `GET /messages`, `GET /clubs/:clubId/messages`, `POST /messages` |
| sponsorshipService | `GET /sponsorships`, `GET /events/:eventId/sponsorships`, `POST /sponsorships` |
| reportService | `GET /reports/club-network/:clubId`, `GET /reports/event-network/:eventId`, `GET /reports/member-network/:memberId` |
| Health checks | `GET /health`, `GET /health/db` |

### Query Parameters

- **Clubs**: `category`, `search`, `skip`, `limit`
- **Events**: `status`, `club_id`, `venue_id`, `upcoming_only`, `sort_by`, `skip`, `limit`
- **Members**: `department`, `club_id`, `search`, `skip`, `limit`
- **Registrations**: `event_id`, `member_id`
- **Participants**: `linked_member_only`

## Configuring Backend URL

Set the `VITE_API_BASE_URL` environment variable to point to your backend:

1. Copy `.env.example` to `.env`
2. Edit the value:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The default value (when not set) is `http://127.0.0.1:8000`.

## Authentication Flow

The frontend uses a **mock authentication** system stored in `localStorage`:

1. User registers via `/auth/register` (full name, email, password)
2. User logs in via `/auth/login` (email, password)
3. On successful login/register, session data and a mock token are stored in `localStorage`
4. The API client's request interceptor reads the token from `localStorage` and attaches it as a `Bearer` token in the `Authorization` header on all API requests
5. `ProtectedRoute` component checks authentication state and redirects unauthenticated users to `/auth/login`
6. Logout clears session data and token from `localStorage`

**Note**: The backend currently has no auth endpoints. The mock auth flow works without crashes and is ready to be replaced with real backend authentication when available.

## Cross-Entity Name Resolution

Pages display human-readable names instead of raw IDs:

- **Events page**: Shows club name for each event
- **Budget page**: Shows event title for each budget row
- **Registration page**: Shows member name and event title
- **Sponsorship page**: Shows event title
- **Messages page**: Shows club name and member name
- **Board Members page**: Shows club name
- **Advisors page**: Shows club name
- **Club Detail page**: Uses report endpoint for full club network (advisor, members, board, events, messages)
- **Event Detail page**: Uses report endpoint for full event network (venue, budget, registrations, participants, sponsorships)

## Error Handling

- **ErrorBoundary** component wraps the entire app to catch rendering errors
- **API client interceptor** shows toast notifications for 400, 404, 409, 422, and 500+ errors
- **422 validation errors** are parsed into field-level messages via `parseValidationErrors()`
- **404 on detail pages** shows a "not found" state instead of crashing
- **Network errors** (backend unreachable) show user-friendly toast messages
- **Health indicator** in the footer polls `/health` every 30 seconds
- **Dashboard** shows backend API and database connection status

## Known Limitations / TODO

- Authentication is mock-only (localStorage). Replace with backend JWT auth when endpoints are available.
- Club communication fields (contact email, phone, channel, social link, sponsor contact) are stored in localStorage only. Move to backend when club schema supports them.
- Events backend does not support a `search` query parameter; event search is done client-side.
- No pagination on advisors, board members, venues, messages, or sponsorships list endpoints (backend returns all).
- No update/delete endpoints for advisors, members, board members, venues, registrations, participants, messages, or sponsorships.
- Bundle size is above 500 KB; consider code splitting for production.

## Project Structure

```text
uniclub-web/
  src/
    api/
      client.ts          # Axios instance with interceptors
      errors.ts          # Error parsing utilities
      services/          # One service per entity
    components/
      common/            # Button, Card, Badge, Modal, etc.
      feedback/          # ErrorBoundary
      forms/             # Form components per entity
      layout/            # AppLayout, ProtectedRoute, HealthIndicator
    hooks/               # React Query hooks per entity
    pages/               # Page components
    types/               # TypeScript interfaces
    validation/          # Zod schemas
```

## Run Frontend

```bash
npm install
npm run dev
```

Default frontend URL: `http://localhost:5173`

## Run Backend Together

```powershell
cd C:\Users\Berke\Desktop\UniClub
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --app-dir C:\Users\Berke\Desktop\UniClub\uniclub-api --reload
```

Backend endpoints:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`

## Build

```bash
npm run build
```

This runs TypeScript checks and creates a production bundle in `dist/`.
