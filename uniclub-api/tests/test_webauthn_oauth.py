"""WebAuthn registration & login flow tests, plus oauth.py coverage."""
import base64
import secrets
from datetime import datetime, timedelta

from sqlmodel import Session, select

from tests.conftest import auth_header, _test_engine
from auth import create_challenge_token
from models import User, WebAuthnCredential, WebAuthnChallenge, OAuthAccount


def test_webauthn_register_start_returns_challenge(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    r = client.post("/2fa/webauthn/register/start", headers=h)
    assert r.status_code == 200
    body = r.json()
    assert "challenge" in body
    assert body["rp"]["id"]
    assert body["pubKeyCredParams"]


def test_webauthn_register_verify_and_status(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    start = client.post("/2fa/webauthn/register/start", headers=h).json()
    challenge = start["challenge"]
    cid = base64.urlsafe_b64encode(secrets.token_bytes(16)).rstrip(b"=").decode()
    pk = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    r = client.post("/2fa/webauthn/register/verify", headers=h, json={
        "challenge": challenge, "credential_id": cid, "public_key": pk, "label": "YubiTest",
    })
    assert r.status_code == 200
    cred_id = r.json()["id"]
    # status reports it
    r = client.get("/2fa/status", headers=h)
    assert r.json()["webauthn"] is True
    # delete
    assert client.delete(f"/2fa/webauthn/{cred_id}", headers=h).status_code == 200


def test_webauthn_register_verify_expired(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    cid = base64.urlsafe_b64encode(secrets.token_bytes(16)).rstrip(b"=").decode()
    pk = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    r = client.post("/2fa/webauthn/register/verify", headers=h, json={
        "challenge": "nope", "credential_id": cid, "public_key": pk,
    })
    assert r.status_code == 400


def test_webauthn_register_verify_duplicate(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    s1 = client.post("/2fa/webauthn/register/start", headers=h).json()
    cid = base64.urlsafe_b64encode(secrets.token_bytes(16)).rstrip(b"=").decode()
    pk = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    client.post("/2fa/webauthn/register/verify", headers=h, json={
        "challenge": s1["challenge"], "credential_id": cid, "public_key": pk,
    })
    s2 = client.post("/2fa/webauthn/register/start", headers=h).json()
    r = client.post("/2fa/webauthn/register/verify", headers=h, json={
        "challenge": s2["challenge"], "credential_id": cid, "public_key": pk,
    })
    assert r.status_code == 409


def test_webauthn_login_full_flow(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    # Register a credential
    s1 = client.post("/2fa/webauthn/register/start", headers=h).json()
    cid = base64.urlsafe_b64encode(secrets.token_bytes(16)).rstrip(b"=").decode()
    pk = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    client.post("/2fa/webauthn/register/verify", headers=h, json={
        "challenge": s1["challenge"], "credential_id": cid, "public_key": pk,
    })
    # Login should challenge
    r = client.post("/auth/login", json={"email": e, "password": p})
    assert r.json().get("kind") == "challenge"
    ch = r.json()["challenge_token"]
    # Start login webauthn
    r = client.post("/2fa/login/webauthn/start", json={"challenge_token": ch})
    assert r.status_code == 200
    body = r.json()
    server_challenge = body["challenge"]
    # Verify
    r = client.post("/2fa/login/webauthn/verify", json={
        "challenge_token": ch, "challenge": server_challenge, "credential_id": cid,
    })
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_webauthn_login_start_when_not_enabled(client, member_user):
    _, e, p, _ = member_user
    with Session(_test_engine) as s:
        user = s.exec(select(User).where(User.email == e)).first()
        ch = create_challenge_token(user)
    r = client.post("/2fa/login/webauthn/start", json={"challenge_token": ch})
    assert r.status_code == 400


def test_webauthn_login_verify_unknown_cred(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    s1 = client.post("/2fa/webauthn/register/start", headers=h).json()
    cid = base64.urlsafe_b64encode(secrets.token_bytes(16)).rstrip(b"=").decode()
    pk = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    client.post("/2fa/webauthn/register/verify", headers=h, json={
        "challenge": s1["challenge"], "credential_id": cid, "public_key": pk,
    })
    r = client.post("/auth/login", json={"email": e, "password": p})
    chtoken = r.json()["challenge_token"]
    start = client.post("/2fa/login/webauthn/start", json={"challenge_token": chtoken}).json()
    r = client.post("/2fa/login/webauthn/verify", json={
        "challenge_token": chtoken, "challenge": start["challenge"], "credential_id": "unknownid",
    })
    assert r.status_code == 401


def test_webauthn_delete_other_users_cred(client, member_user, admin_user):
    member_id, me, mp, _ = member_user
    _, ae, ap = admin_user
    # Register a cred for the member
    hm = auth_header(client, me, mp)
    s1 = client.post("/2fa/webauthn/register/start", headers=hm).json()
    cid = base64.urlsafe_b64encode(secrets.token_bytes(16)).rstrip(b"=").decode()
    pk = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    cred_id = client.post("/2fa/webauthn/register/verify", headers=hm, json={
        "challenge": s1["challenge"], "credential_id": cid, "public_key": pk,
    }).json()["id"]
    ha = auth_header(client, ae, ap)
    r = client.delete(f"/2fa/webauthn/{cred_id}", headers=ha)
    assert r.status_code == 404


def test_oauth_callback_unconfigured(client):
    r = client.get("/auth/oauth/google/callback", follow_redirects=False)
    assert r.status_code == 503


def test_oauth_callback_unknown_provider(client):
    r = client.get("/auth/oauth/banana/callback", follow_redirects=False)
    assert r.status_code == 404
