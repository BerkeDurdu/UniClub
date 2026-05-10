"""Direct unit tests of auth.py helpers and dependencies."""
from datetime import datetime, timedelta
from jose import jwt as _jwt
from fastapi import HTTPException
from sqlmodel import Session

from tests.conftest import _test_engine, auth_header
from auth import (
    get_current_user, get_optional_user, require_roles, require_permission,
    require_admin, ALGORITHM,
)
from config import settings
from models import User, UserRole


def _make_session():
    return Session(_test_engine)


def _make_user(s: Session, role: UserRole, email: str, club_id=None, active=True):
    from auth import hash_password
    u = User(email=email, hashed_password=hash_password("Password#1"),
             full_name="X", role=role, club_id=club_id, is_active=active)
    s.add(u)
    s.commit()
    s.refresh(u)
    return u


def test_get_current_user_no_token():
    with _make_session() as s:
        try:
            get_current_user(token=None, session=s)
            assert False
        except HTTPException as e:
            assert e.status_code == 401


def test_get_current_user_bad_token():
    with _make_session() as s:
        try:
            get_current_user(token="garbage", session=s)
            assert False
        except HTTPException as e:
            assert e.status_code == 401


def test_get_current_user_expired_token():
    payload = {
        "user_id": 1, "email": "x@y.com", "role": "member",
        "exp": datetime.utcnow() - timedelta(hours=1), "purpose": "access",
    }
    tok = _jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    with _make_session() as s:
        try:
            get_current_user(token=tok, session=s)
            assert False
        except HTTPException as e:
            assert e.status_code == 401


def test_get_current_user_wrong_purpose():
    payload = {
        "user_id": 1, "exp": datetime.utcnow() + timedelta(minutes=5), "purpose": "2fa",
    }
    tok = _jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    with _make_session() as s:
        try:
            get_current_user(token=tok, session=s)
            assert False
        except HTTPException as e:
            assert e.status_code == 401


def test_get_current_user_unknown_user():
    payload = {
        "user_id": 99999, "exp": datetime.utcnow() + timedelta(minutes=5), "purpose": "access",
    }
    tok = _jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    with _make_session() as s:
        try:
            get_current_user(token=tok, session=s)
            assert False
        except HTTPException as e:
            assert e.status_code == 401


def test_get_current_user_inactive():
    with _make_session() as s:
        u = _make_user(s, UserRole.member, "inactive@test.example.com", active=False)
        from auth import create_access_token
        tok = create_access_token(u)
        try:
            get_current_user(token=tok, session=s)
            assert False
        except HTTPException as e:
            assert e.status_code == 401


def test_get_optional_user_returns_none():
    with _make_session() as s:
        assert get_optional_user(token=None, session=s) is None
        assert get_optional_user(token="garbage", session=s) is None


def test_get_optional_user_success():
    with _make_session() as s:
        u = _make_user(s, UserRole.member, "ok@test.example.com")
        from auth import create_access_token
        tok = create_access_token(u)
        result = get_optional_user(token=tok, session=s)
        assert result is not None and result.id == u.id


def test_require_roles_pass_member():
    with _make_session() as s:
        u = _make_user(s, UserRole.member, "rm@test.example.com")
        dep = require_roles(UserRole.member)
        assert dep(current_user=u) is u


def test_require_roles_forbid():
    with _make_session() as s:
        u = _make_user(s, UserRole.member, "rm2@test.example.com")
        dep = require_roles(UserRole.advisor)
        try:
            dep(current_user=u)
            assert False
        except HTTPException as e:
            assert e.status_code == 403


def test_require_roles_admin_bypass():
    with _make_session() as s:
        u = _make_user(s, UserRole.admin, "ra@test.example.com")
        dep = require_roles(UserRole.advisor)
        assert dep(current_user=u) is u


def test_require_permission_admin_bypass():
    with _make_session() as s:
        u = _make_user(s, UserRole.admin, "padm@test.example.com")
        dep = require_permission("anything.you.want")
        assert dep(current_user=u, session=s) is u


def test_require_permission_grants_and_denies():
    from permissions_catalog import seed_permissions
    with _make_session() as s:
        seed_permissions(s)
        u = _make_user(s, UserRole.member, "perm@test.example.com")
        # member by default has messages.send
        dep_pass = require_permission("messages.send")
        assert dep_pass(current_user=u, session=s) is u
        # member doesn't have events.create
        dep_fail = require_permission("events.create")
        try:
            dep_fail(current_user=u, session=s)
            assert False
        except HTTPException as e:
            assert e.status_code == 403


def test_require_admin_pass():
    with _make_session() as s:
        u = _make_user(s, UserRole.admin, "ra2@test.example.com")
        assert require_admin(current_user=u) is u


def test_require_admin_forbid():
    with _make_session() as s:
        u = _make_user(s, UserRole.member, "rb@test.example.com")
        try:
            require_admin(current_user=u)
            assert False
        except HTTPException as e:
            assert e.status_code == 403
