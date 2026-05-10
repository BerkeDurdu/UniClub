"""Default permission catalog and the initial role-permission matrix.

Run on startup to ensure all permission codes exist and that the default matrix is seeded.
After seed, admins can mutate the matrix via /admin/role-permissions.
"""
from typing import Dict, List
from sqlmodel import Session, select

from models import Permission, RolePermission, UserRole

# (code, description)
PERMISSIONS: List[tuple[str, str]] = [
    ("clubs.create", "Create a new club"),
    ("clubs.update", "Update club details"),
    ("clubs.delete", "Delete a club"),
    ("events.create", "Create an event"),
    ("events.update", "Update an event"),
    ("events.delete", "Delete an event"),
    ("members.create", "Add a member"),
    ("members.update", "Update a member"),
    ("members.delete", "Remove a member"),
    ("advisors.create", "Add an advisor"),
    ("advisors.update", "Update an advisor"),
    ("board.create", "Add a board member"),
    ("board.update", "Update a board member"),
    ("budgets.read", "Read budgets"),
    ("budgets.write", "Create or update budgets"),
    ("sponsorships.read", "Read sponsorships"),
    ("sponsorships.write", "Create or update sponsorships"),
    ("registrations.create_self", "Register self for an event"),
    ("registrations.create_other", "Register another member"),
    ("participants.add", "Add a participant"),
    ("messages.send", "Send a message"),
    ("venues.create", "Add a venue"),
    ("users.manage", "Admin: manage users"),
    ("permissions.manage", "Admin: edit role permissions"),
]

# Default matrix - mirrors current hardcoded behavior so day-1 UX is unchanged.
DEFAULT_MATRIX: Dict[UserRole, List[str]] = {
    UserRole.member: [
        "budgets.read",
        "sponsorships.read",
        "registrations.create_self",
        "messages.send",
    ],
    UserRole.advisor: [
        "clubs.update",
        "events.create", "events.update", "events.delete",
        "members.create", "members.update",
        "advisors.create", "advisors.update",
        "board.create", "board.update",
        "budgets.read", "budgets.write",
        "sponsorships.read", "sponsorships.write",
        "registrations.create_self", "registrations.create_other",
        "participants.add",
        "messages.send",
        "venues.create",
    ],
    UserRole.board_member: [
        "clubs.update",
        "events.create", "events.update", "events.delete",
        "members.create", "members.update",
        "advisors.create", "advisors.update",
        "board.create", "board.update",
        "budgets.read", "budgets.write",
        "sponsorships.read", "sponsorships.write",
        "registrations.create_self", "registrations.create_other",
        "participants.add",
        "messages.send",
        "venues.create",
    ],
    UserRole.admin: [code for code, _ in PERMISSIONS],
}


def seed_permissions(session: Session) -> None:
    """Idempotent: ensures all permissions exist and the default matrix is in place."""
    code_to_perm: Dict[str, Permission] = {}
    for code, description in PERMISSIONS:
        existing = session.exec(select(Permission).where(Permission.code == code)).first()
        if existing:
            if existing.description != description:
                existing.description = description
                session.add(existing)
            code_to_perm[code] = existing
        else:
            p = Permission(code=code, description=description)
            session.add(p)
            session.flush()
            code_to_perm[code] = p

    for role, codes in DEFAULT_MATRIX.items():
        existing_for_role = session.exec(
            select(RolePermission).where(RolePermission.role == role)
        ).all()
        if existing_for_role:
            continue  # already seeded; admins may have edited it
        for code in codes:
            perm = code_to_perm.get(code)
            if perm is None:
                continue
            session.add(RolePermission(role=role, permission_id=perm.id))
    session.commit()
