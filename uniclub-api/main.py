"""
UniClub API

# Running Notes
To run the server locally, make sure you have created and activated your virtual environment.
Install dependencies: `pip install -r requirements.txt`

Create a PostgreSQL database named `uniclub_db`.
Set `DATABASE_URL` in your environment or use the `.env` file via `.env.example`.

Run the server: `uvicorn main:app --reload`
"""

from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from sqlalchemy import text, inspect
from sqlalchemy.exc import IntegrityError
from datetime import date, datetime, timedelta

from database import engine, create_db_and_tables, get_session
from models import (
    Club, Advisor, Member, BoardMember, Venue, Event, Message,
    Registration, Sponsorship, Budget, Participant, EventStatus, BoardRole,
    User, UserRole
)
from auth import hash_password

from routers import all_routers
from config import settings
import logging

# Set up simple logging for demonstration
logging.basicConfig(level=logging.INFO if not settings.debug else logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="UniClub API",
    version="1.0.0",
    description="Backend for a university club and event management system with a layered, robust architecture"
)

# ==========================
# CORS CONFIGURATION
# ==========================
# allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# GLOBAL ERROR HANDLING
# ==========================
# Distinction Note: 
# - `HTTPException` (like 400 Bad Request or 409 Conflict) represents business rule violations. FastAPI natively handles these.
# - `RequestValidationError` (like 422 Unprocessable Entity) represents schema validation errors, also native.
# - Unexpected exceptions are caught below to return a clean 500 without leaking stack traces.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected internal server error occurred. Please contact support."}
    )

# Include all modular routers
for router in all_routers:
    app.include_router(router)


def resolve_seed_password(seed_key: str, role_label: str) -> str:
    configured = getattr(settings, seed_key, None)
    if isinstance(configured, str) and configured.strip():
        return configured.strip()
    # Deterministic fallback avoids hardcoded plaintext credentials in repository files.
    return f"{role_label}-{settings.secret_key[:12]}-Seed!"


def seed_data():
    """
    Idempotent seed logic to populate starter data easily.
    """
    with Session(engine) as session:
        statement = select(Club)
        existing_club = session.exec(statement).first()
        if not existing_club:
            venue1 = Venue(name="Main Hall", location="Building A", capacity=500, venue_type="Auditorium")
            venue2 = Venue(name="Room 101", location="Building B", capacity=50, venue_type="Classroom")
            session.add_all([venue1, venue2])
            session.commit()

            adv1 = Advisor(full_name="Prof. Alan Turing", email="alan@uniclub.edu", department="Computer Science", assigned_date=date(2023, 1, 15))
            adv2 = Advisor(full_name="Dr. Jane Goodall", email="jane@uniclub.edu", department="Biology", assigned_date=date(2023, 2, 20))
            adv3 = Advisor(full_name="Dr. Hans Zimmer", email="hans@uniclub.edu", department="Music", assigned_date=date(2023, 3, 10))
            session.add_all([adv1, adv2, adv3])
            session.commit()

            club1 = Club(name="IEEE", description="Tech and Engineering", category="Academic", founded_date=date(2010, 5, 20))
            club2 = Club(name="Music Club", description="Live bands and jams", category="Arts", founded_date=date(2015, 9, 1))
            club3 = Club(name="Sports Club", description="University Athletics", category="Sports", founded_date=date(2012, 10, 15))
            session.add_all([club1, club2, club3])
            session.commit()

            adv1.club_id = club1.id
            adv2.club_id = club3.id
            adv3.club_id = club2.id
            session.commit()

            m1 = Member(student_id="1001", first_name="Alice", last_name="Smith", email="alice@student.edu", department="Computer Science", join_date=date(2024, 1, 10), club_id=club1.id)
            m2 = Member(student_id="1002", first_name="Bob", last_name="Jones", email="bob@student.edu", department="Music", join_date=date(2024, 2, 15), club_id=club2.id)
            m3 = Member(student_id="1003", first_name="Charlie", last_name="Brown", email="charlie@student.edu", department="Biology", join_date=date(2024, 3, 5), club_id=club3.id)
            m4 = Member(student_id="1004", first_name="Diana", last_name="Prince", email="diana@student.edu", department="Sports", join_date=date(2024, 4, 1), club_id=club3.id)
            session.add_all([m1, m2, m3, m4])
            session.commit()

            bm1 = BoardMember(student_id="2001", first_name="Eve", last_name="Hacker", email="eve@student.edu", role=BoardRole.President, join_date=date(2023, 9, 1), club_id=club1.id)
            bm2 = BoardMember(student_id="2002", first_name="Frank", last_name="Sinatra", email="frank@student.edu", role=BoardRole.Treasurer, join_date=date(2023, 9, 1), club_id=club2.id)
            session.add_all([bm1, bm2])
            session.commit()

            now = datetime.now()
            e1 = Event(title="Hackathon 2026", description="24 hour hackathon", status=EventStatus.Scheduled, event_start=now + timedelta(days=10), event_end=now + timedelta(days=11), club_id=club1.id, venue_id=venue1.id)
            e2 = Event(title="Jazz Night", description="Live jazz music", status=EventStatus.Completed, event_start=now - timedelta(days=5), event_end=now - timedelta(days=4), club_id=club2.id, venue_id=venue2.id)
            e3 = Event(title="Marathon Prep", description="Get ready to run", status=EventStatus.Canceled, event_start=now + timedelta(days=20), event_end=now + timedelta(days=20, hours=4), club_id=club3.id, venue_id=venue1.id)
            session.add_all([e1, e2, e3])
            session.commit()

            b1 = Budget(event_id=e1.id, planned_amount=5000.0, actual_amount=0.0, notes="Hackathon budget")
            b2 = Budget(event_id=e2.id, planned_amount=1000.0, actual_amount=950.0, notes="Jazz night budget")
            session.add_all([b1, b2])
            session.commit()

            s1 = Sponsorship(sponsor_name="TechCorp", amount=2000.0, agreement_date=date(2024, 1, 1), event_id=e1.id)
            s2 = Sponsorship(sponsor_name="MusicStore", amount=500.0, agreement_date=date(2024, 2, 1), event_id=e2.id)
            s3 = Sponsorship(sponsor_name="DrinkCo", amount=1500.0, agreement_date=date(2024, 1, 15), event_id=e1.id)
            session.add_all([s1, s2, s3])
            session.commit()

            r1 = Registration(registered_at=now - timedelta(days=2), event_id=e1.id, member_id=m1.id)
            r2 = Registration(registered_at=now - timedelta(days=1), event_id=e1.id, member_id=m3.id)
            session.add_all([r1, r2])
            session.commit()

            p1 = Participant(first_name=m1.first_name, last_name=m1.last_name, email=m1.email, event_id=e1.id, member_id=m1.id)
            p2 = Participant(first_name=m3.first_name, last_name=m3.last_name, email=m3.email, event_id=e1.id, member_id=m3.id)
            p3 = Participant(first_name=m2.first_name, last_name=m2.last_name, email=m2.email, event_id=e2.id, member_id=m2.id)
            p4 = Participant(first_name="Guest", last_name="User", email="guest@example.com", event_id=e1.id)
            session.add_all([p1, p2, p3, p4])
            session.commit()

        first_member = session.exec(select(Member).order_by(Member.id)).first()
        first_advisor = session.exec(select(Advisor).order_by(Advisor.id)).first()
        first_board_member = session.exec(select(BoardMember).order_by(BoardMember.id)).first()

        if not first_member or not first_advisor or not first_board_member:
            return

        def ensure_test_user(email: str, password: str, full_name: str, role: UserRole, club_id: int) -> User:
            normalized_email = email.lower().strip()
            existing_user = session.exec(select(User).where(User.email == normalized_email)).first()
            if existing_user:
                if existing_user.role != role:
                    existing_user.role = role
                if existing_user.club_id != club_id:
                    existing_user.club_id = club_id
                if existing_user.full_name != full_name:
                    existing_user.full_name = full_name
                # Keep seeded demo users on current secure baseline password policy.
                existing_user.hashed_password = hash_password(password)
                session.add(existing_user)
                session.commit()
                session.refresh(existing_user)
                return existing_user

            new_user = User(
                email=normalized_email,
                hashed_password=hash_password(password),
                full_name=full_name,
                role=role,
                club_id=club_id,
                is_active=True,
            )
            session.add(new_user)
            try:
                session.commit()
                session.refresh(new_user)
                return new_user
            except IntegrityError:
                # Another startup worker or reload cycle may have inserted this email.
                session.rollback()
                raced_user = session.exec(select(User).where(User.email == normalized_email)).first()
                if raced_user:
                    if raced_user.role != role:
                        raced_user.role = role
                    if raced_user.club_id != club_id:
                        raced_user.club_id = club_id
                    if raced_user.full_name != full_name:
                        raced_user.full_name = full_name
                    session.add(raced_user)
                    session.commit()
                    session.refresh(raced_user)
                    return raced_user
                raise

        member_seed_password = resolve_seed_password("seed_member_password", "member")
        advisor_seed_password = resolve_seed_password("seed_advisor_password", "advisor")
        board_seed_password = resolve_seed_password("seed_board_password", "board")

        member_user = ensure_test_user(
            email=settings.seed_member_email,
            password=member_seed_password,
            full_name=f"{first_member.first_name} {first_member.last_name}".strip(),
            role=UserRole.member,
            club_id=first_member.club_id if first_member.club_id is not None else 1,
        )
        advisor_user = ensure_test_user(
            email=settings.seed_advisor_email,
            password=advisor_seed_password,
            full_name=first_advisor.full_name,
            role=UserRole.advisor,
            club_id=first_advisor.club_id if first_advisor.club_id is not None else 1,
        )
        board_user = ensure_test_user(
            email=settings.seed_board_email,
            password=board_seed_password,
            full_name=f"{first_board_member.first_name} {first_board_member.last_name}".strip(),
            role=UserRole.board_member,
            club_id=first_board_member.club_id,
        )

        if first_member.user_id != member_user.id:
            first_member.user_id = member_user.id
            session.add(first_member)
        if first_advisor.user_id != advisor_user.id:
            first_advisor.user_id = advisor_user.id
            session.add(first_advisor)
        if first_board_member.user_id != board_user.id:
            first_board_member.user_id = board_user.id
            session.add(first_board_member)

        # Backfill user links for all advisor and board_member profiles so messaging
        # recipient selection always has concrete app_user targets per club.
        all_advisors = session.exec(select(Advisor)).all()
        for advisor in all_advisors:
            if advisor.user_id is not None:
                continue
            if advisor.club_id is None:
                continue
            linked_user = ensure_test_user(
                email=advisor.email,
                password=advisor_seed_password,
                full_name=advisor.full_name,
                role=UserRole.advisor,
                club_id=advisor.club_id,
            )
            advisor.user_id = linked_user.id
            session.add(advisor)

        all_board_members = session.exec(select(BoardMember)).all()
        for board_member in all_board_members:
            if board_member.user_id is not None:
                continue
            linked_user = ensure_test_user(
                email=board_member.email,
                password=board_seed_password,
                full_name=f"{board_member.first_name} {board_member.last_name}".strip(),
                role=UserRole.board_member,
                club_id=board_member.club_id,
            )
            board_member.user_id = linked_user.id
            session.add(board_member)

        session.commit()


def migrate_message_schema():
    """Apply lightweight compatibility migration for message routing columns."""
    with engine.begin() as connection:
        inspector = inspect(connection)
        table_names = inspector.get_table_names()
        if "message" not in table_names:
            return

        columns = {col["name"] for col in inspector.get_columns("message")}

        if "sender_user_id" not in columns:
            connection.execute(text("ALTER TABLE message ADD COLUMN sender_user_id INTEGER"))
        if "receiver_user_id" not in columns:
            connection.execute(text("ALTER TABLE message ADD COLUMN receiver_user_id INTEGER"))

        connection.execute(text("ALTER TABLE message ALTER COLUMN member_id DROP NOT NULL"))

        connection.execute(text("""
            UPDATE message AS msg
            SET sender_user_id = mem.user_id
            FROM member AS mem
            WHERE msg.member_id = mem.id
              AND msg.sender_user_id IS NULL
              AND mem.user_id IS NOT NULL
        """))

        connection.execute(text("""
            UPDATE message
            SET receiver_user_id = sender_user_id
            WHERE receiver_user_id IS NULL
              AND sender_user_id IS NOT NULL
        """))

        connection.execute(text("DELETE FROM message WHERE sender_user_id IS NULL OR receiver_user_id IS NULL"))

        connection.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_message_sender_user'
                ) THEN
                    ALTER TABLE message
                    ADD CONSTRAINT fk_message_sender_user
                    FOREIGN KEY (sender_user_id) REFERENCES app_user(id);
                END IF;
            END
            $$;
        """))
        connection.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_message_receiver_user'
                ) THEN
                    ALTER TABLE message
                    ADD CONSTRAINT fk_message_receiver_user
                    FOREIGN KEY (receiver_user_id) REFERENCES app_user(id);
                END IF;
            END
            $$;
        """))

@app.on_event("startup")
def on_startup():
    """
    On application startup, attempt to deploy the schema.
    NOTE: Using `create_db_and_tables()` is a development convenience shortcut.
    In a true production environment properly tracking revisions, we would remove this
    so that schema definitions are strictly deployed by running `alembic upgrade head`.
    However, this serves as a rapid zero-to-one setup safety net.
    """
    create_db_and_tables()
    migrate_message_schema()
    seed_data()

@app.get("/", tags=["Health"], summary="Root Endpoint")
def read_root():
    return {
        "message": "Welcome to the UniClub API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health", tags=["Health"], summary="Check application health")
def health_check():
    """Returns safe application status quickly without heavily querying dependencies."""
    return {"status": "ok", "app_version": app.version, "environment": settings.app_env}

@app.get("/health/db", tags=["Health"], summary="Check database connectivity")
def db_health_check(session: Session = Depends(get_session)):
    """Verifies DB connectivity by executing a rapid query."""
    try:
        session.exec(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return JSONResponse(status_code=503, content={"status": "error", "message": "Service unavailable due to bad database connection."})
