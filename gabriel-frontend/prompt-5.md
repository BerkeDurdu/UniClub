Extend the existing `UniClub Web` frontend. Keep all previous functionality intact.

IMPORTANT:
- This phase pushes the frontend toward a presentation-ready state.
- Focus on edge cases, empty states, and technical depth.

1. ROBUST UI STATES
Implement throughout the app:
- **Skeleton Loaders:** Replace basic text loading spinners with Tailwind pulse skeleton loaders for data grids and lists.
- **Empty States:** If a query returns 0 results (e.g., no clubs found for a search), display a beautifully styled "No Results Found" illustration/message, not just a blank screen.

2. GLOBAL ERROR BOUNDARY
- Create a React `ErrorBoundary` component to catch fatal UI rendering crashes.
- If a component fails, display a safe fallback UI ("Something went wrong") with a button to reload the page, preventing a white screen of death.

3. DASHBOARD ANALYTICS
Upgrade the `Dashboard` page to fetch and display aggregate data (using multiple concurrent `useQuery` calls):
- Total Active Clubs
- Upcoming Events Count
- Total Registered Members
- Render a simple CSS/Tailwind bar chart or progress bar showing event capacities.

4. HEALTH CHECK INTEGRATION
- Add a tiny, unobtrusive indicator in the footer that pings the backend `GET /health` endpoint every 30 seconds. Show a green dot if the API is alive, and a red dot if it's down.

5. CREATE `presentation_notes_frontend.md`
Write a markdown file explaining:
- Why React Query was chosen over `useEffect` for data fetching (caching, stale-while-revalidate).
- How React Hook Form + Zod prevents bad data from reaching the backend.
- How Axios interceptors centralize error handling.
- A suggested live demo flow focusing on the UI's resilience.

EXPECTED RESULT:
- A highly polished, professional UI.
- Protection against edge cases and offline states.
- Documentation ready for academic presentation.