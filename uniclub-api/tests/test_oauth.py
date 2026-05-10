def test_no_providers_when_unconfigured(client):
    r = client.get("/auth/oauth/providers")
    assert r.status_code == 200
    assert r.json() == {"providers": []}


def test_unknown_provider(client):
    r = client.get("/auth/oauth/banana/login", follow_redirects=False)
    assert r.status_code == 404


def test_unconfigured_provider(client):
    r = client.get("/auth/oauth/google/login", follow_redirects=False)
    assert r.status_code == 503
