Extend the existing UniClub Web frontend with full CRUD pages for all remaining entities, React Query mutations, and structured API error handling. Keep all existing code intact.

IMPORTANT:
- Do not rebuild from scratch.
- Modify existing files in place.
- Keep TypeScript strict mode.
- Keep backend API compatibility.
- Use React Query for all data fetching and mutations.
- Reuse form components created in prompt-2.

GOAL:
Add missing entity pages so every backend entity is accessible and manageable from the frontend. Implement proper mutation hooks and structured error handling for 422 validation responses.

1) CREATE REACT QUERY HOOKS (`src/hooks/`)
Create custom hooks for all entities using React Query:

useClubs.ts:
- useClubs(params?) - query for listing clubs
- useClub(id) - query for single club
- useCreateClub() - mutation
- useDeleteClub() - mutation with cache invalidation

useEvents.ts:
- useEvents(params?) - query for listing events
- useEvent(id) - query for single event
- useCreateEvent() - mutation
- useUpdateEvent() - mutation
- useDeleteEvent() - mutation with cache invalidation

useMembers.ts:
- useMembers(params?) - query for listing members
- useMember(id) - query for single member
- useCreateMember() - mutation

useAdvisors.ts:
- useAdvisors() - query for listing
- useAdvisor(id) - query for single
- useCreateAdvisor() - mutation

useBoardMembers.ts:
- useBoardMembers() - query for listing
- useBoardMember(id) - query for single
- useCreateBoardMember() - mutation

useVenues.ts:
- useVenues() - query for listing
- useVenue(id) - query for single
- useCreateVenue() - mutation

useBudgets.ts:
- useBudgetByEvent(eventId) - query
- useCreateBudget() - mutation
- useUpdateBudget() - mutation

useRegistrations.ts:
- useRegistrations(eventId?) - query
- useRegisterForEvent() - mutation

useMessages.ts:
- useMessages() - query for all
- useMessagesByClub(clubId) - query
- useCreateMessage() - mutation

useSponsorships.ts:
- useSponsorships() - query for all
- useSponsorshipsByEvent(eventId) - query
- useCreateSponsorship() - mutation

useParticipants.ts:
- useEventParticipants(eventId) - query
- useCreateParticipant() - mutation

useReports.ts:
- useClubNetwork(clubId) - query
- useEventNetwork(eventId) - query
- useMemberNetwork(memberId) - query

All mutation hooks must:
- Invalidate related query keys on success
- Show success toast on completion
- Return typed error for form-level handling

2) STRUCTURED ERROR HANDLING
Update `src/api/client.ts` response interceptor to parse 422 validation errors:
- Extract field-level errors from FastAPI's 422 response format: `{ detail: [{ loc: [...], msg: string, type: string }] }`
- Create a utility function `parseValidationErrors(error)` that returns `Record<string, string>` mapping field names to error messages
- Export this utility from `src/api/errors.ts`

Create `src/api/errors.ts`:
- parseValidationErrors(error): extracts field-level errors from 422 responses
- isApiError(error): type guard for API errors
- getErrorMessage(error): extracts user-friendly error message from any error type

3) ADD MISSING PAGES
Create new page components in `src/pages/`:

AdvisorsPage.tsx:
- List all advisors in a table/card grid
- Show full_name, email, department, assigned_date, club name (resolved)
- "Add Advisor" button opens modal with AdvisorForm
- Search/filter by department
- Loading skeleton and empty state

BoardMembersPage.tsx:
- List all board members in a table
- Show name, email, role (badge), club name, join_date
- "Add Board Member" button opens modal with BoardMemberForm
- Filter by role and club
- Loading skeleton and empty state

VenuesPage.tsx:
- List all venues in cards
- Show name, location, capacity, venue_type
- "Add Venue" button opens modal with VenueForm
- Loading skeleton and empty state

BudgetsPage.tsx:
- List budgets grouped by event
- Show event title, planned_amount, actual_amount, variance (planned - actual)
- "Add Budget" button opens modal with BudgetForm
- Color code: green if under budget, red if over budget
- Loading skeleton and empty state

SponsorshipsPage.tsx:
- List all sponsorships
- Show sponsor_name, amount (formatted as currency), agreement_date, event title (resolved)
- "Add Sponsorship" button opens modal with SponsorshipForm
- Loading skeleton and empty state

MessagesPage.tsx:
- List all messages
- Show subject, content (truncated), club name, member name, sent_at
- "Send Message" button opens modal with MessageForm
- Loading skeleton and empty state

RegistrationsPage.tsx:
- List all registrations
- Show member name (resolved), event title (resolved), registered_at
- "Register" button opens modal with RegistrationForm
- Filter by event
- Loading skeleton and empty state

4) UPDATE ROUTING
Update `src/App.tsx` to add routes for new pages:
- /advisors -> AdvisorsPage
- /board-members -> BoardMembersPage
- /venues -> VenuesPage
- /budgets -> BudgetsPage
- /sponsorships -> SponsorshipsPage
- /messages -> MessagesPage
- /registrations -> RegistrationsPage

All new routes must be inside the ProtectedRoute wrapper and AppLayout.

5) UPDATE NAVIGATION
Update the sidebar/navigation in `src/components/layout/AppLayout.tsx`:
- Add navigation links for all new pages
- Group navigation logically:
  - Main: Dashboard, Clubs, Events
  - People: Members, Advisors, Board Members
  - Operations: Venues, Budgets, Registrations, Sponsorships, Messages

6) UPDATE EXISTING DETAIL PAGES
Enhance ClubDetailPage.tsx:
- Use useClubNetwork(clubId) to show related data
- Display advisor info, member count, board members, recent events in sections
- Add delete button with confirmation dialog

Enhance EventDetailPage.tsx:
- Use useEventNetwork(eventId) to show related data
- Display venue, budget, registrations, participants, sponsorships in sections
- Add edit button (opens EventForm pre-filled)
- Add delete button with confirmation dialog

7) MODAL COMPONENT
If not already present, create `src/components/common/Modal.tsx`:
- Overlay with centered content
- Close on backdrop click or Escape key
- Title prop and children slot
- Smooth enter/exit animation with Tailwind
- Used by all "Add" buttons across pages

EXPECTED RESULT:
- Every entity has a dedicated page with list view, create modal, and appropriate filters
- React Query hooks manage all data fetching and mutations with cache invalidation
- Structured 422 error parsing feeds field-level errors back to forms
- Navigation covers all 11 entities logically grouped
- Detail pages show cross-entity relationships using report endpoints
- Consistent loading/empty/error states across all pages
