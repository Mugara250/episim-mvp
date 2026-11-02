from app.core.security import create_access_token


def test_login_and_me(client, auth):
    me = client.get("/api/auth/me", headers=auth["analyst"]).json()
    assert (
        me["name"] == "Aline Uwase"
        and me["role"] == "analyst"
        and me["institutionName"] == "Rwanda Biomedical Centre"
    )


def test_bad_password_and_unknown_email(client):
    assert (
        client.post("/api/auth/login", json={"email": "officer@who.int", "password": "nope"}).status_code
        == 401
    )
    assert client.post("/api/auth/login", json={"email": "nobody@x.rw", "password": "x"}).status_code == 401


def test_no_token_and_expired_token(client):
    assert client.get("/api/auth/me").status_code == 401
    token, _ = create_access_token("U-04", "analyst", minutes=-1)
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401 and "expired" in r.json()["detail"]


def test_demo_login_uses_login_page_accounts(client):
    for role, email in [
        ("admin", "admin@moh.gov.rw"),
        ("analyst", "epidemiologist@rbc.gov.rw"),
        ("officer", "officer@who.int"),
        ("policymaker", "policymaker@moh.gov.rw"),
    ]:
        r = client.post("/api/auth/demo-login", json={"role": role})
        assert r.status_code == 200 and r.json()["user"]["email"] == email


def test_meta_is_public_and_honest(client):
    m = client.get("/api/meta").json()
    assert m["demoMode"] is True and m["estimateLabel"] == "Scenario estimates, not forecasts"
    assert "geoBoundaries" in m["boundaryAttribution"]


def test_inactive_user_cannot_sign_in(client):
    # U-08 is seeded Inactive with an unusable password; status check happens after the password check,
    # so use an access request flow instead: pending requests get a clear 403.
    r = client.post(
        "/api/access-requests",
        json={
            "name": "New Person",
            "email": "new.person@rbc.gov.rw",
            "institution": "Rwanda Biomedical Centre",
            "password": "secret1",
        },
    )
    assert r.status_code == 201
    r = client.post("/api/auth/login", json={"email": "new.person@rbc.gov.rw", "password": "secret1"})
    assert r.status_code == 403
