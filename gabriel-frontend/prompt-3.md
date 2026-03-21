Extend the existing `UniClub Web` frontend. Keep all previous functionality intact.

IMPORTANT:
- This phase is focused on frontend robustness, defensive validation, and user experience.
- Add robust form handling using React Hook Form and Zod.
- Add user feedback using toast notifications.

1. NEW DEPENDENCIES
Add to package.json:
- `react-hook-form`
- `zod`
- `@hookform/resolvers`
- `react-hot-toast` (or similar for toast notifications)

2. GLOBAL TOAST NOTIFICATIONS
- Add the Toast provider to `App.tsx` or `main.tsx`.
- Update the Axios client interceptor to trigger a red error toast on `400`, `404`, `409`, and `422` error responses, displaying the backend's error message.

3. CREATE FORMS WITH ZOD VALIDATION
Create reusable form components in `src/components/forms/`:

`ClubForm`:
- Fields: name, description, category, founded_date.
- Zod rules: name and description min 1 char.

`EventForm`:
- Fields: title, description, event_start, event_end, status.
- Zod rules: title required, `event_end` must be after `event_start`.

`ParticipantForm`:
- Fields: first_name, last_name, email.
- Zod rules: proper email format, names cannot be blank.

4. IMPLEMENT CREATION MODALS/PAGES
- Add a "Create Club" button on the Clubs page that opens a form (modal or new route). On successful submission, trigger a success toast and refresh the list.
- Add a "Create Event" button on the Events page with similar logic.

5. ERROR HANDLING BEHAVIOR
Ensure the UI gracefully handles API rejections:
- If a user tries to create a club with an existing name (Backend returns 409), the UI must not crash; it should display the toast notification and keep the form open so the user can fix it.

EXPECTED RESULT:
- Forms are strictly validated on the client side before hitting the API.
- Backend business rule violations surface as clear, user-friendly toast notifications.
- The application never crashes from unhandled promise rejections.