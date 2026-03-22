Fix message recipient selection for members so they can send messages to their own club advisor or board member.

Scope:
- UniClub backend + frontend existing codebase.
- Apply patch in place, do not rebuild architecture.

Problem:
- In Message form, `club` is fixed to my club but recipient list shows only "Select recipient".
- Members cannot message own-club advisor/board member even when advisor exists in club records.

Root cause to address:
- Recipient options endpoint returns only `app_user` rows.
- Some advisor/board_member profiles exist in domain tables but are not linked to any `app_user` (`user_id` is null), so dropdown is empty.

Required fixes:
1) Data/backfill fix (backend startup-safe)
- Ensure all existing advisor and board_member profiles with a valid `club_id` have linked `app_user` records.
- If a linked app user does not exist, create one and connect profile `user_id`.
- Keep operation idempotent (safe on every startup).

2) Messaging policy must stay intact
- member -> only advisor/board_member
- advisor/board_member -> only advisor/board_member
- no self-message
- same-club checks remain enforced

3) Recipient options behavior
- `GET /messages/recipient-options` must return non-empty choices when own club has advisor/board_member profiles.
- Exclude current user from options.

4) Frontend compatibility
- Message form should keep using recipient options endpoint.
- Recipient dropdown must display real names/roles once backend backfill runs.

Validation steps:
- Run backend startup migration/seed path.
- Verify advisor/board_member rows now have `user_id` values.
- Verify member from club 2 or 3 can see at least one recipient option.
- Verify sending message succeeds for allowed role pairs.
- Verify self-message and forbidden role targets are blocked.
