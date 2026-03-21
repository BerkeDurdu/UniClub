Extend the existing `UniClub API` backend. Keep all previous functionality intact.

IMPORTANT:
- Use the existing files and modify them in place.
- This phase is focused on robustness, defensive validation, and business rules.
- Do NOT move logic back into routes.
- Keep services as the main place for business rules.
- Do not remove any existing endpoints.
- Make validations explicit and readable.
- Use `HTTPException` with clear messages and correct status codes.

Implement the following rules:

1. MEMBERSHIP AND BOARD RULES
In `MemberService` and `BoardMemberService`:
- `leave_date` cannot be earlier than `join_date`
- a student cannot be an active board member in more than one club at the same time
- only one active `President` can exist per club at a time
- board member role must be one of:
  - President
  - Vice President
  - Secretary
  - Treasurer
  - Coordinator
- if possible in the current design, ensure a board member is logically associated with the same club context
- prevent duplicate active board entries for the same student in the same club

2. ADVISOR RULES
In `AdvisorService`:
- an advisor can advise only one club
- a club can have only one active advisor
- advisor email must remain unique
- assigning a second advisor to the same club must raise an error
- assigning the same advisor to multiple clubs must raise an error

3. EVENT RULES
In `EventService`:
- `event_end` cannot be before `event_start`
- event title cannot be blank
- optionally prevent duplicate events in the same club with the same `(title, event_start)`
- event status must be valid
- enum comparisons must be type-safe (compare against enum values, not raw strings if enum types are used in models/schemas)
- completed or canceled events must not allow new registration
- past events must not allow new registration

4. REGISTRATION RULES
In `RegistrationService`:
- a member cannot register twice for the same event
- a member cannot register for a canceled event
- a member cannot register for a completed event
- a member cannot register for a past event
- if the event has a venue, registration count must not exceed venue capacity
- if member does not exist, raise 404
- if event does not exist, raise 404

5. BUDGET AND SPONSORSHIP RULES
In `BudgetService` and `SponsorshipService`:
- budget planned amount cannot be negative
- budget actual amount cannot be negative
- sponsorship amount cannot be negative
- optionally block sponsorship creation for completed or past events
- each event can have at most one budget record

6. PARTICIPANT RULES
In `ParticipantService`:
- participant first and last names cannot be blank
- if `member_id` is present, prevent duplicate `(event_id, member_id)` participant rows
- if `member_id` is null and email is present, prevent duplicate `(event_id, email)` participant rows
- optionally prevent participant count from exceeding venue capacity
- if participant is linked to a member, validate that member exists

7. MESSAGE RULES
In `MessageService`:
- subject cannot be blank
- content cannot be blank
- member_id and club_id must reference existing rows
- optionally prevent a member from posting into a club they do not belong to

8. ERROR HANDLING BEHAVIOR
Use explicit status codes:
- `404 Not Found` for missing club/member/event/advisor/venue/etc.
- `400 Bad Request` for invalid business-rule actions
- `409 Conflict` for duplicates or conflicting unique active states
- `422 Unprocessable Entity` for schema validation from FastAPI/Pydantic

Additionally ensure create/update services validate foreign-key targets before commit (club/event/venue/member/advisor references) so failures surface as clear API errors instead of raw DB integrity errors.

9. DOCSTRINGS
Add service method docstrings that explain:
- what the method does
- what it validates
- which exceptions it can raise

10. UPDATE `test_scenarios.md`
Add cases for:
- assigning a second advisor to the same club
- assigning one advisor to two clubs
- assigning a second president to the same club
- adding a board member already active in another club
- creating event with `event_end < event_start`
- registering for canceled event
- registering for completed event
- registering for past event
- duplicate registration
- registration when venue capacity is already full
- negative budget amount
- negative sponsorship amount
- duplicate participant by member_id
- duplicate participant by email
- message with blank content

11. SEED SAFETY
Update seed logic if necessary so all seeded data still satisfies the newer business rules and constraints.
Do not let startup fail because old seed data violates new rules.

EXPECTED RESULT:
- stronger service-layer validation
- business rules enforced consistently
- improved robustness for grading
- old functionality preserved