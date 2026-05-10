import pyotp
from datetime import date, datetime, timedelta
from sqlmodel import Session

from tests.conftest import auth_header, _test_engine
from auth import (
    hash_password, verify_password, create_access_token, create_challenge_token,
    decode_token, decode_access_token, require_roles, require_permission, require_admin,
    require_same_club_or_forbid, require_same_user_or_forbid, get_optional_user,
    get_role_permissions,
)
from email_utils import send_email
from permissions_catalog import seed_permissions
from models import User, UserRole, Club, EmailOTPChallenge, UserEmailOTP, WebAuthnCredential, WebAuthnChallenge, OAuthAccount
from fastapi import HTTPException


def test_password_hash_and_verify():
    h = hash_password("secret123")
    assert verify_password("secret123", h)
    assert not verify_password("wrong", h)


def test_token_encode_decode():
    u = User(id=42, email="a@b.com", hashed_password="x", full_name="A", role=UserRole.member)
    t = create_access_token(u)
    decoded = decode_token(t)
    assert decoded["user_id"] == 42
    decoded2 = decode_access_token(t)
    assert decoded2["purpose"] == "access"
    ct = create_challenge_token(u)
    assert decode_token(ct)["purpose"] == "2fa"


def test_require_same_club_admin_bypass():
    admin = User(id=1, email="a@b.com", hashed_password="x", full_name="A", role=UserRole.admin)
    require_same_club_or_forbid(99, admin)  # no exception


def test_require_same_club_forbid_no_club():
    member = User(id=1, email="a@b.com", hashed_password="x", full_name="A", role=UserRole.member, club_id=None)
    try:
        require_same_club_or_forbid(99, member)
        assert False
    except HTTPException as e:
        assert e.status_code == 403


def test_require_same_club_mismatch():
    member = User(id=1, email="a@b.com", hashed_password="x", full_name="A", role=UserRole.member, club_id=1)
    try:
        require_same_club_or_forbid(2, member)
        assert False
    except HTTPException as e:
        assert e.status_code == 403


def test_require_same_user_admin_bypass():
    admin = User(id=1, email="a@b.com", hashed_password="x", full_name="A", role=UserRole.admin)
    require_same_user_or_forbid(99, admin)


def test_require_same_user_forbid():
    u = User(id=1, email="a@b.com", hashed_password="x", full_name="A", role=UserRole.member)
    try:
        require_same_user_or_forbid(2, u)
        assert False
    except HTTPException as e:
        assert e.status_code == 403


def test_send_email_console_mode(capsys):
    send_email("x@y.com", "Hello", "Body")
    # No exception means console-mode path executed.


def test_send_email_smtp_path(monkeypatch):
    """Force SMTP path with a fake smtplib.SMTP that records calls."""
    import smtplib
    from config import settings

    sent = {}

    class FakeSMTP:
        def __init__(self, host, port):
            sent["host"] = host
            sent["port"] = port
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def starttls(self): sent["tls"] = True
        def login(self, u, p): sent["login"] = (u, p)
        def send_message(self, msg): sent["msg"] = msg["Subject"]

    monkeypatch.setattr(settings, "smtp_host", "smtp.fake.com", raising=False)
    monkeypatch.setattr(settings, "smtp_user", "u", raising=False)
    monkeypatch.setattr(settings, "smtp_password", "p", raising=False)
    monkeypatch.setattr(settings, "smtp_use_tls", True, raising=False)
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)
    send_email("x@y.com", "Hi", "Body")
    assert sent["host"] == "smtp.fake.com"
    assert sent["msg"] == "Hi"


def test_send_email_smtp_failure_falls_back(monkeypatch):
    import smtplib
    from config import settings
    monkeypatch.setattr(settings, "smtp_host", "smtp.fake.com", raising=False)
    def boom(*a, **k): raise RuntimeError("nope")
    monkeypatch.setattr(smtplib, "SMTP", boom)
    monkeypatch.setattr(smtplib, "SMTP_SSL", boom)
    # Should not raise
    send_email("x@y.com", "Hi", "Body")


def test_send_email_smtp_ssl_path(monkeypatch):
    import smtplib
    from config import settings

    class FakeSMTPSSL:
        def __init__(self, host, port): pass
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def login(self, u, p): pass
        def send_message(self, msg): pass

    monkeypatch.setattr(settings, "smtp_host", "smtp.fake.com", raising=False)
    monkeypatch.setattr(settings, "smtp_use_tls", False, raising=False)
    monkeypatch.setattr(smtplib, "SMTP_SSL", FakeSMTPSSL)
    send_email("x@y.com", "Hi", "Body")


def test_send_email_async(monkeypatch):
    import asyncio
    from email_utils import send_email_async
    asyncio.run(send_email_async("x@y.com", "Hi", "Body"))


def test_seed_permissions_idempotent(session):
    seed_permissions(session)
    seed_permissions(session)  # second call should be a no-op for matrix
    assert get_role_permissions(session, UserRole.admin)


def test_admin_create_user_endpoint(client, admin_user):
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    r = client.post("/admin/users", headers=h, json={
        "email": "fresh@test.example.com",
        "password": "Fresh#12345",
        "full_name": "Fresh",
        "role": "member",
    })
    assert r.status_code == 201, r.text


def test_admin_create_user_advisor_needs_club(client, admin_user):
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    r = client.post("/admin/users", headers=h, json={
        "email": "noclub@test.example.com",
        "password": "Pwd#12345",
        "full_name": "X",
        "role": "advisor",
    })
    assert r.status_code == 400


def test_admin_set_active(client, admin_user, member_user):
    member_id, _, _, _ = member_user
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    r = client.put(f"/admin/users/{member_id}/active", headers=h, json={"is_active": False})
    assert r.status_code == 200
    assert r.json()["is_active"] is False


def test_admin_change_role_to_admin_clears_club(client, admin_user, member_user):
    member_id, _, _, _ = member_user
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    r = client.put(f"/admin/users/{member_id}/role", headers=h, json={"role": "admin"})
    assert r.status_code == 200
    assert r.json()["club_id"] is None


def test_admin_change_role_unknown_user(client, admin_user):
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    r = client.put("/admin/users/9999/role", headers=h, json={"role": "member"})
    assert r.status_code == 404


def test_admin_matrix_unknown_role(client, admin_user):
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    r = client.put("/admin/role-permissions", headers=h, json={"matrix": {"banana": []}})
    assert r.status_code == 400


def test_admin_matrix_unknown_perm(client, admin_user):
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    r = client.put("/admin/role-permissions", headers=h, json={"matrix": {"member": ["does.not.exist"]}})
    assert r.status_code == 400


def test_2fa_totp_disable(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    r = client.post("/2fa/totp/setup", headers=h)
    secret = r.json()["secret"]
    code = pyotp.TOTP(secret).now()
    client.post("/2fa/totp/confirm", headers=h, json={"code": code})
    r = client.delete("/2fa/totp", headers=h)
    assert r.status_code == 200


def test_2fa_totp_confirm_invalid(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    client.post("/2fa/totp/setup", headers=h)
    r = client.post("/2fa/totp/confirm", headers=h, json={"code": "000000"})
    assert r.status_code == 400


def test_2fa_totp_confirm_without_setup(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    r = client.post("/2fa/totp/confirm", headers=h, json={"code": "123456"})
    assert r.status_code == 400


def test_2fa_email_login_flow(client, member_user):
    _, email, pwd, _ = member_user
    h = auth_header(client, email, pwd)
    client.post("/2fa/email/enable", headers=h)
    r = client.post("/auth/login", json={"email": email, "password": pwd})
    body = r.json()
    assert body.get("kind") == "challenge"
    assert "email" in body["methods"]
    challenge = body["challenge_token"]
    r = client.post("/2fa/login/email/send", json={"challenge_token": challenge})
    assert r.status_code == 200
    # Find the code by reading the latest challenge from db
    from sqlmodel import Session, select
    with Session(_test_engine) as s:
        chal = s.exec(select(EmailOTPChallenge).order_by(EmailOTPChallenge.id.desc())).first()
        assert chal is not None
    # Brute force valid code with hashlib
    import hashlib
    found = None
    for i in range(1_000_000):
        c = f"{i:06d}"
        if hashlib.sha256(c.encode()).hexdigest() == chal.code_hash:
            found = c
            break
    assert found is not None
    r = client.post("/2fa/login/email/verify", json={"challenge_token": challenge, "code": found})
    assert r.status_code == 200


def test_2fa_email_verify_invalid(client, member_user):
    _, email, pwd, _ = member_user
    h = auth_header(client, email, pwd)
    client.post("/2fa/email/enable", headers=h)
    r = client.post("/auth/login", json={"email": email, "password": pwd})
    challenge = r.json()["challenge_token"]
    r = client.post("/2fa/login/email/verify", json={"challenge_token": challenge, "code": "000000"})
    assert r.status_code == 401


def test_2fa_login_totp_when_disabled(client, member_user):
    _, email, pwd, _ = member_user
    # Build a challenge token for user without TOTP enabled
    from auth import create_challenge_token
    from sqlmodel import Session, select
    from models import User
    with Session(_test_engine) as s:
        u = s.exec(select(User).where(User.email == email)).first()
        ch = create_challenge_token(u)
    r = client.post("/2fa/login/totp", json={"challenge_token": ch, "code": "123456"})
    assert r.status_code == 400


def test_2fa_challenge_token_wrong_purpose(client, member_user):
    _, email, pwd, _ = member_user
    # Use access token where challenge is required
    h = auth_header(client, email, pwd)
    access = h["Authorization"].split(" ", 1)[1]
    r = client.post("/2fa/login/totp", json={"challenge_token": access, "code": "000000"})
    assert r.status_code == 401


def test_oauth_no_providers_initially(client):
    r = client.get("/auth/oauth/providers")
    assert r.json() == {"providers": []}


def test_register_advisor_requires_club(client):
    r = client.post("/auth/register", json={
        "email": "adv@test.example.com", "password": "Pwd#12345",
        "full_name": "Adv", "role": "advisor",
    })
    assert r.status_code == 400


def test_register_duplicate_email(client):
    body = {"email": "dup@test.example.com", "password": "Pwd#12345",
            "full_name": "X", "role": "member"}
    assert client.post("/auth/register", json=body).status_code == 201
    assert client.post("/auth/register", json=body).status_code == 409


def test_login_unknown_user(client):
    r = client.post("/auth/login", json={"email": "ghost@test.example.com", "password": "x" * 8})
    assert r.status_code == 401


def test_protected_endpoint_without_token(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_protected_with_bad_token(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer notatoken"})
    assert r.status_code == 401


def test_inactive_user_login_blocked(client, member_user, admin_user):
    member_id, me, mp, _ = member_user
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    client.put(f"/admin/users/{member_id}/active", headers=h, json={"is_active": False})
    r = client.post("/auth/login", json={"email": me, "password": mp})
    assert r.status_code == 401
