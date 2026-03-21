from sqlmodel import Session
from sqlalchemy import text

from database import engine

CHECKS = {
    "club_advisor": """
        SELECT COUNT(*)
        FROM club c
        LEFT JOIN advisor a ON a.club_id = c.id
    """,
    "event_budget": """
        SELECT COUNT(*)
        FROM event e
        LEFT JOIN budget b ON b.event_id = e.id
    """,
    "registration_links": """
        SELECT COUNT(*)
        FROM registration r
        JOIN event e ON e.id = r.event_id
        JOIN member m ON m.id = r.member_id
    """,
    "participant_links": """
        SELECT COUNT(*)
        FROM participant p
        JOIN event e ON e.id = p.event_id
    """,
}


def main() -> None:
    print("Relationship check report")
    with Session(engine) as session:
        for name, query in CHECKS.items():
            try:
                value = session.exec(text(query)).one()
                count = int(value[0] if isinstance(value, tuple) else value)
                print(f"[PASS] {name}: {count}")
            except Exception as exc:
                print(f"[FAIL] {name}: {exc}")


if __name__ == "__main__":
    main()
