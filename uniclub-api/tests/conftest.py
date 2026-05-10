"""Shared pytest fixtures: SQLite-backed app for fast hermetic tests."""
import os
import sys
from pathlib import Path

# Critical: env vars must be set BEFORE importing config / app modules.
os.environ.setdefault("SECRET_KEY", "test-secret-key-please-change")
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DEBUG", "false")

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool


# We replace the global engine with an in-memory one BEFORE importing main.
_test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

import database
database.engine = _test_engine

import main  # noqa: E402  (import after engine swap)
main.engine = _test_engine

from database import get_session  # noqa: E402


def _override_get_session():
    with Session(_test_engine) as s:
        yield s


main.app.dependency_overrides[get_session] = _override_get_session


@pytest.fixture(autouse=True)
def _fresh_db():
    """Reset schema before each test."""
    SQLModel.metadata.drop_all(_test_engine)
    SQLModel.metadata.create_all(_test_engine)
    # Seed default permissions matrix so authz works
    from permissions_catalog import seed_permissions
    with Session(_test_engine) as s:
        seed_permissions(s)
    yield
    SQLModel.metadata.drop_all(_test_engine)


@pytest.fixture
def engine():
    return _test_engine


@pytest.fixture
def session():
    with Session(_test_engine) as s:
        yield s


@pytest.fixture
def client():
    # Suppress startup hooks that depend on Postgres-only seed data
    main.app.router.on_startup = []
    with TestClient(main.app) as c:
        yield c


@pytest.fixture
def admin_user():
    from models import User, UserRole
    from auth import hash_password
    pwd = "AdminPass#1"
    with Session(_test_engine) as s:
        u = User(
            email="admin@test.example.com",
            hashed_password=hash_password(pwd),
            full_name="Admin",
            role=UserRole.admin,
            is_active=True,
        )
        s.add(u)
        s.commit()
        s.refresh(u)
        return u.id, "admin@test.example.com", pwd


@pytest.fixture
def member_user():
    from datetime import date
    from models import User, UserRole, Club
    from auth import hash_password
    pwd = "MemberPass#1"
    with Session(_test_engine) as s:
        club = Club(name="Test Club", description="d", category="c", founded_date=date(2020, 1, 1))
        s.add(club)
        s.commit()
        s.refresh(club)
        u = User(
            email="member@test.example.com",
            hashed_password=hash_password(pwd),
            full_name="Member",
            role=UserRole.member,
            club_id=club.id,
            is_active=True,
        )
        s.add(u)
        s.commit()
        s.refresh(u)
        return u.id, "member@test.example.com", pwd, club.id


def auth_header(client, email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    body = r.json()
    token = body.get("access_token")
    assert token, body
    return {"Authorization": f"Bearer {token}"}
