Perform a final integration and validation pass on the UniClub Web frontend. Do not rebuild anything. Only fix mismatches, broken paths, missing imports, and integration gaps between frontend and backend.

IMPORTANT:
- Use the existing files and modify them in place.
- This is a patch-and-align phase.
- Preserve all previous functionality.
- Do not rewrite the project from scratch.
- Focus on making the whole frontend-backend integration work cleanly end-to-end.

CHECK AND FIX THE FOLLOWING:

1) FRONTEND-BACKEND TYPE ALIGNMENT
Verify every TypeScript interface in `src/types/index.ts` matches the corresponding backend Pydantic schema in `schemas.py`:
- Field names must match exactly (snake_case)
- Field types must match (string vs number, required vs optional)
- Enum values must match exactly (EventStatus, BoardRole)
- Date fields: backend uses `date` or `datetime`, frontend should handle both as string (ISO format)
- Fix any mismatches found

2) API ENDPOINT PATH ALIGNMENT
Verify every frontend service function calls the correct backend endpoint path:
- Check router prefixes in `routers/__init__.py` and each router file
- Ensure frontend paths include correct prefixes (e.g., /clubs, /members, /board-members)
- Check that routers using absolute paths (like `/participants`, `/messages`, `/sponsorships`) are called correctly
- Fix any path mismatches

3) QUERY PARAMETER ALIGNMENT
Verify frontend query parameters match backend endpoint signatures:
- Club filters: category, search, skip, limit
- Event filters: status, club_id, venue_id, upcoming_only, sort_by, skip, limit, search
- Member filters: department, club_id, search, skip, limit
- Registration filters: event_id
- Fix any parameter name mismatches

4) RESPONSE HANDLING
Ensure all frontend service functions handle responses correctly:
- POST endpoints returning 201 should work with the typed response
- DELETE endpoints returning 204 (no content) should not try to parse response body
- PUT endpoints returning updated object should type correctly
- List endpoints returning arrays should handle empty arrays gracefully

5) FORM-TO-API PAYLOAD MAPPING
Verify form submissions send payloads that match backend Create schemas:
- Date fields: forms use `<input type="date">` (YYYY-MM-DD) or `<input type="datetime-local">` - ensure correct format for backend
- Number fields: ensure form values are numbers not strings (parseInt/parseFloat where needed)
- Optional fields: ensure null/undefined is sent correctly (not empty strings for optional fields)
- Enum fields: ensure select dropdowns send exact enum values matching backend

6) CROSS-ENTITY REFERENCE RESOLUTION
Verify that pages displaying related entity names (not just IDs) work correctly:
- Events page should show club name, not just club_id
- Budget page should show event title, not just event_id
- Registration page should show member name and event title
- Sponsorship page should show event title
- Message page should show club name and member name
- Board member page should show club name
- Use report endpoints or additional queries where needed

7) AUTH INTEGRATION CHECK
Verify:
- Login page sends credentials correctly to backend (if auth endpoint exists)
- Auth token is stored in localStorage on login
- Auth token is sent in Authorization header on all requests
- ProtectedRoute redirects to login when no token exists
- If backend has no auth endpoints, ensure the frontend mock-auth flow works without crashes

8) HEALTH CHECK INTEGRATION
Verify DashboardPage:
- Calls GET /health and GET /health/db
- Displays backend status (connected/disconnected)
- Shows meaningful error if backend is unreachable
- Dashboard analytics use real data from API (club count, event count, member count)

9) ERROR BOUNDARY CHECK
Verify:
- ErrorBoundary component catches rendering errors
- Network errors show user-friendly messages via toast
- 404 errors on detail pages show "not found" state instead of crashing
- 422 validation errors display field-level messages in forms
- 500 errors show generic error message

10) BUILD AND LINT SAFETY
Ensure:
- No TypeScript errors (strict mode)
- No unused imports
- No missing imports
- No circular dependencies
- All components properly export
- All route paths are valid
- Build completes without errors: `npm run build`

11) NAVIGATION COMPLETENESS
Ensure:
- Every page is reachable from the sidebar navigation
- Active page is highlighted in navigation
- Breadcrumb or page title updates for each route
- Back navigation works on detail pages

12) README UPDATE
Update `uniclub-web/README.md` with:
- Complete list of all pages and their URLs
- API integration summary (which endpoints are used)
- How to configure backend URL (VITE_API_BASE_URL)
- Authentication flow explanation
- Known limitations or TODO items

EXPECTED RESULT:
- Frontend and backend communicate without type mismatches or path errors
- Every form submission produces a valid backend request
- Every list/detail page displays real data correctly
- Error states are handled gracefully throughout the application
- The application builds cleanly with no TypeScript errors
- Navigation is complete and functional
- README accurately documents the integration
