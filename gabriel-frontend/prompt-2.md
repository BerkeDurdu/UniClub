Extend the existing `UniClub Web` frontend from the previous prompt. Keep all existing code intact.

IMPORTANT:
- Use the existing files and modify them in place.
- Move toward a cleaner architecture with separate TypeScript interfaces and API services.
- Ensure types strictly match the backend Pydantic schemas.

GOAL:
Refactor the project into a cleaner frontend architecture with:
- `src/types/` for all interfaces
- `src/api/services/` for modular data fetching

1. CREATE TYPES (`src/types/index.ts`)
Define TypeScript interfaces for the 11 core entities matching the backend:
- Club, Advisor, Member, BoardMember, Event, Message, Registration, Sponsorship, Venue, Budget, Participant.
- Ensure enums/literal types are used for `EventStatus` (Scheduled, Completed, Canceled) and `BoardRole` (President, Vice President, Secretary, Treasurer, Coordinator).

2. CREATE API SERVICES
Create separate service files using the Axios client for data fetching:
- `clubService.ts`: getClubs, getClubById, createClub
- `eventService.ts`: getEvents, getEventById, createEvent
- `memberService.ts`: getMembers, createMember

3. INTEGRATE WITH PAGES
Update the following pages to fetch and display actual data from the API:
- `ClubsPage`: Fetch and map over clubs. Display cards with Name, Category, and Description. Add a loading state and an error state.
- `EventsPage`: Fetch and map over events. Display lists with Title, Date, and Status badges.

4. COMPONENT MODULARIZATION
Extract reusable UI components into `src/components/common/`:
- `Button.tsx`
- `Card.tsx`
- `Badge.tsx` (for statuses)
- `LoadingSpinner.tsx`
- `ErrorMessage.tsx`

EXPECTED RESULT:
- Strong typing across the application
- Modular API services abstracting Axios calls
- Pages displaying real data fetched from the backend
- Reusable UI components