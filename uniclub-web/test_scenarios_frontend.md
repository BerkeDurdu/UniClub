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

## Prompt 9 Scenarios

14. Register fails when role is not selected
- Steps:
  - Open `/auth/register`
  - Fill full name, email, password, confirm password
  - Leave role as `Select a role`
  - Submit
- Expected:
  - Role validation error is shown
  - No account is created

15. Register fails when advisor has no club_id
- Steps:
  - Open `/auth/register`
  - Select role `advisor`
  - Fill other required fields
  - Keep club empty
  - Submit
- Expected:
  - Club requirement error is shown
  - Backend request is rejected with clear message if sent

16. Register fails when board member has no club_id
- Steps:
  - Open `/auth/register`
  - Select role `board_member`
  - Fill other required fields
  - Keep club empty
  - Submit
- Expected:
  - Club requirement error is shown
  - No successful redirect

17. Register succeeds for member without club_id
- Steps:
  - Open `/auth/register`
  - Select role `member`
  - Fill required fields and submit without club
- Expected:
  - Registration succeeds
  - User is redirected to `/dashboard`
  - Token is stored in localStorage

18. Register succeeds for advisor/board_member with valid club_id
- Steps:
  - Open `/auth/register`
  - Select `advisor` or `board_member`
  - Select a valid club and submit
- Expected:
  - Registration succeeds
  - User is redirected to `/dashboard`

19. Login stores token and enables protected routes
- Steps:
  - Open `/auth/login`
  - Login with valid credentials
- Expected:
  - Token exists in localStorage key `token`
  - Access to protected routes works

20. Invalid credentials show backend message
- Steps:
  - Open `/auth/login`
  - Enter wrong password and submit
- Expected:
  - Error toast shows `Invalid email or password`
  - No redirect to dashboard

21. Auth pages redirect when already authenticated
- Steps:
  - Login successfully
  - Navigate to `/auth/login` or `/auth/register`
- Expected:
  - User is redirected to `/dashboard`

## Prompt 10 Scenarios

22. Member cannot see create/edit controls on clubs
- Steps:
  - Login as a `member`
  - Open `/clubs` and `/clubs/:id`
- Expected:
  - `Create Club` button is hidden
  - Club edit controls are hidden
  - Read-only indicator is visible

23. Member cannot access budgets route directly
- Steps:
  - Login as a `member`
  - Open `/budgets` directly from address bar
- Expected:
  - User is redirected to `/dashboard`
  - Permission toast is shown

24. Member cannot access sponsorships route directly
- Steps:
  - Login as a `member`
  - Open `/sponsorships` directly from address bar
- Expected:
  - User is redirected to `/dashboard`
  - Permission toast is shown

25. Member cannot add external participant on event detail
- Steps:
  - Login as a `member`
  - Open `/events/:id`
- Expected:
  - External participant form is hidden
  - Participant list remains visible in read-only mode

26. Member cannot register another member from event detail
- Steps:
  - Login as a `member`
  - Open `/events/:id`
- Expected:
  - Member selection dropdown is hidden
  - `Register for Event` control for other users is hidden

27. Advisor and board member management actions remain available
- Steps:
  - Login as `advisor` or `board_member`
  - Open `/clubs`, `/events/:id`, `/budgets`, `/sponsorships`
- Expected:
  - Management buttons and forms remain visible and usable

28. Unauthorized mutation is blocked before API call
- Steps:
  - Force-trigger a restricted action from UI state as `member` (if reachable)
- Expected:
  - Frontend shows permission error
  - Mutation call is not executed

## Prompt 11 Scenarios

29. Member can self-register to event
- Steps:
  - Login as `member`
  - Open `/events/:id` for a schedulable event
  - Click `Register Myself`
- Expected:
  - Registration succeeds
  - Member appears in registration list

30. Member cannot register another member
- Steps:
  - Login as `member`
  - Open `/events/:id`
- Expected:
  - No member selection dropdown exists
  - No action allows registering another member id

31. Member cannot view budget amounts on event detail
- Steps:
  - Login as `member`
  - Open `/events/:id`
- Expected:
  - Budget amount values are hidden
  - Restricted financial message is shown

32. Member sees sponsor names but not amounts
- Steps:
  - Login as `member`
  - Open `/events/:id`
- Expected:
  - Sponsor names are visible
  - Sponsor amount values are hidden

33. Member cannot add advisor
- Steps:
  - Login as `member`
  - Open `/advisors`
- Expected:
  - `Add Advisor` button is hidden
  - Advisor create modal cannot be opened

34. Member cannot add venue
- Steps:
  - Login as `member`
  - Open `/venues`
- Expected:
  - `Add Venue` button is hidden
  - Venue create modal cannot be opened

35. Member cannot add tags
- Steps:
  - Login as `member`
  - Open `/clubs` and `/events/:id`
- Expected:
  - Quick category tag add control is hidden
  - Event metadata add label control is hidden

## Prompt 12 Scenarios

36. Advisor existing-club registration keeps normal flow
- Steps:
  - Open `/auth/register`
  - Select role `advisor`
  - Keep club input mode `Select existing club`
  - Choose club and complete registration
- Expected:
  - Registration succeeds
  - Redirect goes to `/dashboard`

37. Advisor manual-club mode shows extra required fields
- Steps:
  - Open `/auth/register`
  - Select role `advisor`
  - Switch club input mode to `Enter club manually`
- Expected:
  - Manual club fields are visible
  - Existing club selector is no longer required

38. Manual mode validation blocks empty club fields
- Steps:
  - Select `advisor` + manual mode
  - Leave manual club fields empty
  - Submit
- Expected:
  - Validation errors shown for manual club required fields
  - Registration is not submitted

39. Manual mode redirects to onboarding page
- Steps:
  - Complete advisor/board_member registration in manual mode with valid inputs
- Expected:
  - Registration succeeds
  - Redirect goes to `/onboarding/club` instead of `/dashboard`

40. Onboarding pre-fills manual club data
- Steps:
  - Land on `/onboarding/club` after manual-mode registration
- Expected:
  - Club name and collected values are prefilled

41. Onboarding completion redirects to dashboard
- Steps:
  - Complete required fields on `/onboarding/club`
  - Submit
- Expected:
  - Success feedback shown
  - Redirect to `/dashboard`

42. Manual flow preserves inputs on validation errors
- Steps:
  - In manual registration mode, enter values
  - Trigger a validation error
- Expected:
  - Entered values remain in form
  - User can fix and resubmit without retyping all fields

## Prompt 13 Scenarios

43. Advisor only sees own club on clubs page
- Steps:
  - Login as `advisor` linked to club A
  - Open `/clubs`
- Expected:
  - Only club A is listed
  - Club edit controls are available only for club A

44. Advisor cannot create event for another club
- Steps:
  - Login as `advisor` linked to club A
  - Open `/events` and click `Create Event`
- Expected:
  - Club selector contains only club A
  - Submit with another club is blocked by client-side check

45. Advisor cannot manage foreign event details
- Steps:
  - Open `/events/:id` for event belonging to club B
- Expected:
  - Edit/delete and management controls are hidden/disabled
  - Metadata and external participant actions are blocked

46. Board member budgets/sponsorships scoped to own club events
- Steps:
  - Login as `board_member` linked to club A
  - Open `/budgets` and `/sponsorships`
- Expected:
  - Tables show entries for club A events only
  - Add forms include only club A events

47. Board member registrations scoped to own club
- Steps:
  - Login as `board_member` linked to club A
  - Open `/registrations`
- Expected:
  - Event filter includes only club A events
  - Registration rows are filtered to club A
  - Register form shows only club A events and members

48. Advisor/board can create advisors and board members only for own club
- Steps:
  - Login as staff linked to club A
  - Open `/advisors` and `/board-members`
- Expected:
  - List and filters are scoped to club A
  - Create forms include only club A in club selector
  - Cross-club payload attempt is blocked client-side
