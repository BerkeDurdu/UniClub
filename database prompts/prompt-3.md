Extend the existing UniClub API. Keep previous functionality intact.

Focus:
Add strict business rules and defensive validation so entity links are not only present but logically correct.

Implement in service layer (not in routes):

1) Advisor rules
- One advisor can advise at most one club.
- One club can have at most one active advisor.
- Duplicate advisor email blocked.

2) BoardMember rules
- leave_date cannot be before join_date.
- One student cannot be active board member in multiple clubs at same time.
- Only one active President per club.
- Prevent duplicate active board entry for same student and club.

3) Event rules
- event_end >= event_start
- status only: Scheduled, Completed, Canceled
- optionally prevent duplicate (club_id, title, event_start)

4) Registration rules
- No duplicate registration for same (event, member)
- No registration for completed/canceled/past events
- Enforce venue capacity when venue exists

5) Participant rules
- first_name and last_name not blank
- if member-linked, no duplicate (event_id, member_id)
- if external (member_id null), no duplicate (event_id, email)

6) Budget and Sponsorship rules
- planned_amount, actual_amount, sponsorship amount cannot be negative
- only one budget per event

7) Message rules
- subject/content cannot be blank
- club_id and member_id must exist
- optionally block member posting to unrelated club

Error handling requirements:
- 404 for missing resources
- 400 for invalid business action
- 409 for conflicts/duplicates
- 422 from schema validation

Documentation:
- Add method docstrings in services describing validations and raised exceptions.
- Update test_scenarios.md with positive and negative test cases for all rules.

Expected result:
- Strong relational consistency under real-world constraints
- Cleaner and safer grading/demo behavior.