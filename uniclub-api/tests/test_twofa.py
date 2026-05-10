import pyotp
from tests.conftest import auth_header


def test_status_default(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    r = client.get("/2fa/status", headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body == {"totp": False, "email": False, "webauthn": False, "webauthn_credentials": []}


def test_totp_full_flow_and_login_challenge(client, member_user):
    _, email, pwd, _ = member_user
    h = auth_header(client, email, pwd)

    # setup
    r = client.post("/2fa/totp/setup", headers=h)
    assert r.status_code == 200
    secret = r.json()["secret"]
    assert "qr_png_base64" in r.json()

    # confirm with current code
    code = pyotp.TOTP(secret).now()
    r = client.post("/2fa/totp/confirm", headers=h, json={"code": code})
    assert r.status_code == 200

    # status reflects enabled
    r = client.get("/2fa/status", headers=h)
    assert r.json()["totp"] is True

    # login should now return challenge
    r = client.post("/auth/login", json={"email": email, "password": pwd})
    assert r.status_code == 200
    body = r.json()
    assert body.get("kind") == "challenge"
    challenge = body["challenge_token"]
    assert "totp" in body["methods"]

    # verify challenge
    code = pyotp.TOTP(secret).now()
    r = client.post("/2fa/login/totp", json={"challenge_token": challenge, "code": code})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_email_enable_disable(client, member_user):
    _, e, p, _ = member_user
    h = auth_header(client, e, p)
    assert client.post("/2fa/email/enable", headers=h).status_code == 200
    assert client.get("/2fa/status", headers=h).json()["email"] is True
    assert client.delete("/2fa/email", headers=h).status_code == 200
    assert client.get("/2fa/status", headers=h).json()["email"] is False
