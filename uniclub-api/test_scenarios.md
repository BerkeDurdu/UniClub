# Test Scenarios
This file documents manual tests you can run using Swagger UI to ensure the validation and constraints are working properly.

1. **Creating a club with duplicate name**:
   - Database unique constraint error or 409 Conflict.

2. **Creating a venue with invalid capacity**:
   - `422 Unprocessable Entity` (gt=0).

3. **Creating an event with invalid dates (event_end < event_start)**:
   - `400 Bad Request` "Event end cannot be before event start".

4. **Creating a budget with negative planned amount**:
   - `422 Unprocessable Entity` or `400 Bad Request`.

5. **Registering a member twice for the same event**:
   - `409 Conflict` "Member already registered for this event".

6. **Creating a participant with missing required name fields**:
   - `422 Unprocessable Entity`.

7. **Creating a message with blank content**:
   - `422 Unprocessable Entity`.

8. **Creating a sponsorship with negative amount**:
   - `422 Unprocessable Entity`.

9. **Assigning a second advisor to the same club**:
   - `409 Conflict` "Club already has an active advisor".

10. **Assigning one advisor to two clubs**:
    - `409 Conflict` "Advisor is already advising another club".

11. **Assigning a second president to the same club**:
    - `409 Conflict` "Club already has an active President". Postgres Partial Unique Index will reliably block this at the DB level, returning a 500 fallback in standard scenarios or caught and returned as a 409 logic error depending on where execution happens first.

12. **Adding a board member already active in another club**:
    - `409 Conflict` "Student is already an active board member in a club".

13. **Registering for canceled event**:
    - `400 Bad Request` "Cannot register for an event that is canceled or completed".

14. **Registering for completed event**:
    - `400 Bad Request` "Cannot register for an event that is canceled or completed".

15. **Registering for past event**:
    - `400 Bad Request` "Cannot register for a past event".

16. **Registration when venue capacity is already full**:
    - `400 Bad Request` "Registration full. Venue capacity reached."

17. **Duplicate participant by member_id**:
    - `409 Conflict` "Member is already a participant in this event".

18. **Duplicate participant by email**:
    - `409 Conflict` "Participant with this email already exists in this event".

19. **Invalid sort field**:
    - Try to GET `/events` with `sort_by` set to `random_field`. Should get 400.

20. **Paginated member query**:
    - Try to GET `/members` with `skip=0` and `limit=2`. Ensures only 2 return.

21. **Filtering events by status**:
    - GET `/events` with `status="Scheduled"`. Ensures only Scheduled events return.

22. **Filtering clubs by category**:
    - GET `/clubs` with `category="Sports"`. Ensures only Sports clubs return.

23. **Listing participants for one event**:
    - GET `/events/{e1.id}/participants`. Allows passing `linked_member_only` boolean to filter.

24. **Failed database health check**:
    - Temporarily stop Postgres/misconfigure `.env`, try `GET /health/db`. Should return `503 Service Unavailable`.

25. **Unsupported Enum value**:
    - Send `status`: `NotARealStatus` in POST `/events`. Should return `422` Pydantic error because it strictly maps to the Enum.

26. **Internal server error fallback behavior**:
    - A critical failure deep inside python code intentionally won't crash the uvicorn worker, rather returns a clean JSON response: `500 Internal Server error occurred`.
