from tests.conftest import auth_header


def test_member_cannot_access_admin(client, member_user):
    _, email, pwd, _ = member_user
    h = auth_header(client, email, pwd)
    r = client.get("/admin/users", headers=h)
    assert r.status_code == 403


def test_admin_lists_users(client, admin_user, member_user):
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    r = client.get("/admin/users", headers=h)
    assert r.status_code == 200
    emails = [u["email"] for u in r.json()]
    assert "admin@test.example.com" in emails
    assert "member@test.example.com" in emails


def test_admin_changes_role(client, admin_user, member_user):
    member_id, _, _, club_id = member_user
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    r = client.put(f"/admin/users/{member_id}/role", headers=h, json={"role": "advisor", "club_id": club_id})
    assert r.status_code == 200
    assert r.json()["role"] == "advisor"


def test_matrix_get_and_put(client, admin_user):
    _, ae, ap = admin_user
    h = auth_header(client, ae, ap)
    r = client.get("/admin/role-permissions", headers=h)
    assert r.status_code == 200
    matrix = r.json()
    assert "member" in matrix and "advisor" in matrix

    new_member_perms = ["events.create", "messages.send"]
    matrix["member"] = new_member_perms
    r = client.put("/admin/role-permissions", headers=h, json={"matrix": matrix})
    assert r.status_code == 200
    assert sorted(r.json()["member"]) == sorted(new_member_perms)


def test_dynamic_permission_takes_effect(client, admin_user, member_user):
    member_id, me, mp, _ = member_user
    _, ae, ap = admin_user

    # Initially member does NOT have events.create
    h_admin = auth_header(client, ae, ap)
    matrix = client.get("/admin/role-permissions", headers=h_admin).json()
    assert "events.create" not in matrix["member"]

    # Grant it dynamically
    matrix["member"] = matrix["member"] + ["events.create"]
    r = client.put("/admin/role-permissions", headers=h_admin, json={"matrix": matrix})
    assert r.status_code == 200

    # /auth/me should now include the new permission
    h_member = auth_header(client, me, mp)
    me_resp = client.get("/auth/me", headers=h_member)
    assert "events.create" in me_resp.json()["permissions"]
