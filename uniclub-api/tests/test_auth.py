from tests.conftest import auth_header


def test_register_and_login(client):
    r = client.post("/auth/register", json={
        "email": "newbie@test.example.com",
        "password": "Newbie#12345",
        "full_name": "New Person",
        "role": "member",
    })
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["access_token"]
    assert body["user"]["email"] == "newbie@test.example.com"

    r = client.post("/auth/login", json={"email": "newbie@test.example.com", "password": "Newbie#12345"})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "email": "a@test.example.com", "password": "Password#1", "full_name": "A", "role": "member",
    })
    r = client.post("/auth/login", json={"email": "a@test.example.com", "password": "wrongone"})
    assert r.status_code == 401


def test_me_returns_permissions(client, member_user):
    _, email, pwd, _ = member_user
    h = auth_header(client, email, pwd)
    r = client.get("/auth/me", headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == email
    assert isinstance(body["permissions"], list)


def test_me_admin_has_wildcard(client, admin_user):
    _, email, pwd = admin_user
    h = auth_header(client, email, pwd)
    r = client.get("/auth/me", headers=h)
    assert r.status_code == 200
    assert "*" in r.json()["permissions"]
