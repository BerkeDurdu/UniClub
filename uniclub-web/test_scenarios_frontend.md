# Frontend Test Scenarios

## Authentication

1. Login invalid email
- Steps:
  - Open `/auth/login`
  - Enter `invalid-email` and any 8+ char password
  - Submit
- Expected:
  - Email validation message is shown
  - No redirect happens

2. Register password mismatch
- Steps:
  - Open `/auth/register`
  - Fill full name and valid email
  - Enter different `password` and `confirm password`
  - Submit
- Expected:
  - `Passwords do not match.` message is shown
  - No account is created

## Event Details Safety

3. Event details with invalid ID
- Steps:
  - Open `/events/abc` or `/events/-1`
- Expected:
  - `Invalid event ID.` message is shown
  - App does not crash

4. Event details with non-existing ID
- Steps:
  - Open a valid numeric URL that does not exist (example: `/events/999999`)
- Expected:
  - Friendly `Event not found.` message is shown
  - Error boundary is not triggered

## Editable Components

5. EditableField save/cancel
- Steps:
  - Open Clubs page
  - Use edit on category/description
  - Click `Cancel` first
  - Edit again and click `Save`
- Expected:
  - Cancel restores previous value
  - Save updates value locally and shows success toast

6. AddItemBox validation failure and success
- Steps:
  - Open Clubs or Event Details
  - Click add with empty value
  - Add a valid value
  - Try adding the same value again (duplicate)
- Expected:
  - Empty input shows validation toast
  - Valid input is added and listed
  - Duplicate input is rejected with validation toast

## Prompt 8 Scenarios

7. Create club with invalid contact email
- Steps:
  - Open Create Club modal
  - Fill required fields with `contact_email=invalid`
  - Submit
- Expected:
  - Contact email validation error is shown
  - Club is not created

8. Create club with invalid social link
- Steps:
  - Open Create Club modal
  - Fill required fields
  - Set `social_link=not-a-url`
  - Submit
- Expected:
  - URL validation error is shown
  - Club is not created

9. Edit sponsor contact and save
- Steps:
  - Open a Club Detail page
  - Set sponsor contact name/role
  - Save
- Expected:
  - Success toast appears
  - Values stay visible after refresh (local fallback persistence)

10. Sponsor contact empty state rendering
- Steps:
  - Open a club with no local sponsor/contact profile
- Expected:
  - Sponsor Communication empty state message appears
  - User can still add sponsor contact fields

11. Members page with zero active participants
- Steps:
  - Use period filter where no registrations exist
- Expected:
  - `No Active Participation` empty state is shown
  - Page remains stable

12. Members page with 100+ members
- Steps:
  - Load dataset with many members and active registrations
- Expected:
  - Page does not render noisy full list by default
  - Limited row view is shown first
  - Toggle `Show all active members` reveals full active list

13. Participation sorting correctness
- Steps:
  - Set sort to `Sort by event count`
  - Observe list order
- Expected:
  - Rows are sorted descending by `attended_event_count`
  - Ties are sorted by member name
