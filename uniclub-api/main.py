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
from sqlalchemy import text
from datetime import date, datetime, timedelta

from database import engine, create_db_and_tables, get_session
from models import (
    Club, Advisor, Member, BoardMember, Venue, Event, Message,
    Registration, Sponsorship, Budget, Participant, EventStatus, BoardRole
)

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


def seed_data():
    """
    Idempotent seed logic to populate starter data easily.
    """
    with Session(engine) as session:
        statement = select(Club)
        existing_club = session.exec(statement).first()
        if existing_club:
            return

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
