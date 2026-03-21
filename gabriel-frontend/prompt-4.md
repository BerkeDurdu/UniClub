Extend the existing `UniClub Web` frontend. Keep all previous functionality intact.

IMPORTANT:
- Introduce advanced data fetching, caching, and synchronization.
- Implement pagination, search, and filtering to match the backend's query capabilities.

1. NEW DEPENDENCIES
Add to package.json:
- `@tanstack/react-query`

2. REACT QUERY SETUP
- Wrap the application in `QueryClientProvider` in `main.tsx`.
- Replace direct `useEffect` API calls in `ClubsPage` and `EventsPage` with `useQuery`.
- Use `useMutation` for the form submissions created in the previous phase. Upon success, invalidate the respective queries to automatically refresh data.

3. ADVANCED UI CONTROLS
Update the `ClubsPage` and `EventsPage` to include:
- A Search Bar (debounced input mapped to the `search` API parameter).
- A Category/Status Dropdown filter.
- Pagination controls (Next/Previous buttons mapping to `skip` and `limit` API parameters).

4. ENTITY DETAIL PAGES
Create dynamic detail routes:
- `/clubs/:id`: Shows club details, its associated members, and its board members.
- `/events/:id`: Shows event details, budget info, registered members, and external participants.

5. REGISTRATION FLOW
On the `/events/:id` page:
- Add a "Register for Event" button.
- If the event status is 'Completed' or 'Canceled', disable the button and show a tooltip explaining why.
- Handle backend capacity errors gracefully if the venue is full.

EXPECTED RESULT:
- Seamless, fast data loading with caching.
- Advanced filtering and pagination working end-to-end with the backend.
- Complex nested entity views (Club -> Members, Event -> Participants).