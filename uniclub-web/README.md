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

## Features

- Client-side routing (Dashboard, Clubs, Events, Members, and detail pages)
- Auth pages with validation:
  - `/auth/login`
  - `/auth/register`
- Route protection for dashboard pages
- Mock auth service (integration-ready replacement point)
- Reusable editable UI components:
  - `EditableField`
  - `AddItemBox`
- Event Details safety guards for invalid/missing IDs
- Caching and sync with React Query
- Global error handling (Axios interceptor + ErrorBoundary)
- Footer API health indicator (polls every 30 seconds)
- Skeleton loading and empty state UI

## Prompt 7 Additions

### Authentication Flow

- Login form fields: email, password
- Register form fields: full name, email, password, confirm password
- Validation:
  - valid email format
  - password minimum length = 8
  - confirm password must match
- Success and error toasts are shown for login/register actions
- Redirect behavior:
  - On successful auth, users are redirected to `/dashboard`
  - Protected routes redirect unauthenticated users to `/auth/login`

### Mock Auth Behavior

Current auth is implemented as a local mock in `src/api/services/authService.ts`.

- Registered users are stored in `localStorage`
- Active session is stored in `localStorage`
- Logout clears session data
- Includes a TODO in code to replace with backend endpoints later

## Editable/Addable Components

Reusable components:

- `EditableField`:
  - inline edit mode
  - save/cancel controls
  - simple non-empty validation
- `AddItemBox`:
  - add new text items
  - optional custom validation callback

Integrated usage:

- Clubs page:
  - editable local category and description fields per club card
  - addable local category tag box
- Event Details page:
  - editable local event note block
  - addable local metadata labels

## Event Details Stability Notes

To prevent crashes when opening `Events -> View details`, the page now includes:

- Strict route parameter validation (`id` must be a positive integer)
- Query `enabled` guards for ID-dependent fetches
- Null-safe fallbacks for all list/data sections
- Friendly error rendering for invalid IDs and missing events
- Mutation error handling with toasts to avoid unhandled async flow

## Prompt 8 Additions

### Club Management Fields

Club create flow now collects sponsor-ready communication fields:

- `contact_email` (required)
- `contact_phone` (optional)
- `communication_channel` (optional)
- `social_link` (optional URL)
- `sponsor_contact_name` (optional)
- `sponsor_contact_role` (optional)

Backend note:

- Current backend club schema does not yet persist these fields.
- Frontend uses local fallback persistence in `src/api/services/clubProfileService.ts`.
- There is an explicit TODO in code to move these fields to backend API once supported.

### Club Detail Editable Management

Club Detail now includes editable sections for:

- Club Profile: category, description, founded date
- Club Communication: contact email/phone/channel/social link
- Sponsor Communication: contact person and role

All edits are save/cancel driven and toast-supported. Failed save actions do not crash the UI.

### Sponsor Communication Block

Sponsor Communication block includes:

- Primary contact person and role
- Contact email, phone, preferred channel
- Quick copy buttons for email/phone/channel
- Empty state when no sponsor contact info exists

### Members Analytics Redesign

Members page now focuses on active event participation instead of a full noisy member list:

- Active Participants metric
- Average Events per Active Member
- Top Participants panel
- Period filter: Last 30 days / This semester / All time
- Sort options: event count or name
- Limited list by default, optional toggle to show all active members

## Project Structure

```text
uniclub-web/
  src/
    api/
      client.ts
      services/
    components/
      common/
      feedback/
      forms/
      layout/
    hooks/
    pages/
    types/
```

## Environment Variables

1. Copy `.env.example` to `.env`.
2. Verify backend URL.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
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

## Troubleshooting

### Event detail shows an error message

- Confirm backend is running.
- Check the event ID in URL is valid (positive integer).
- If event does not exist, the UI will show `Event not found.` instead of crashing.

### Login fails

- Ensure account exists in mock auth store.
- Register first, then log in with the same email/password.

### API is offline in footer

- Verify `VITE_API_BASE_URL` in `.env`.
- Confirm backend health endpoint returns `200`.

## Screenshots

Replace these placeholders with real screenshots from the running app:

- `./screenshots/screenshot-1.png`
- `./screenshots/screenshot-2.png`
- `./screenshots/screenshot-3.png`
- `./screenshots/screenshot-4.png`

## Build

```bash
npm run build
```

This runs TypeScript checks and creates a production bundle.
