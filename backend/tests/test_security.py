"""Regression tests for the final review's security findings."""

import pytest

from app.config import get_settings


def test_only_author_edits_or_submits_report(client, auth):
    r = client.post("/api/reports", headers=auth["analyst"], json={"title": "Author check"}).json()
    body = {"title": "Rewritten by someone else"}
    assert client.put(f"/api/reports/{r['id']}", headers=auth["reviewer"], json=body).status_code == 403
    assert client.post(f"/api/reports/{r['id']}/submit", headers=auth["reviewer"]).status_code == 403
    assert client.post(f"/api/reports/{r['id']}/submit", headers=auth["analyst"]).status_code == 200


@pytest.fixture
def demo_off():
    settings = get_settings()
    settings.demo_mode = False
    yield
    settings.demo_mode = True


def test_demo_accounts_refused_outside_demo_mode(client, demo_off):
    login = {"email": "admin@moh.gov.rw", "password": "admin123"}
    assert client.post("/api/auth/login", json=login).status_code == 403
    assert client.post("/api/auth/demo-login", json={"role": "admin"}).status_code == 404


def test_public_request_status_reveals_only_status(client):
    req = {
        "name": "Test Applicant",
        "email": "applicant@example.org",
        "institution": "Example Hospital",
        "institutionAccountId": "EX-1",
        "position": "Nurse",
        "password": "a-long-password-123",
    }
    created = client.post("/api/access-requests", json=req)
    assert created.status_code == 201, created.text
    status = client.get("/api/access-requests/status", params={"email": "applicant@example.org"}).json()
    assert set(status) <= {"status", "submittedAt", "decidedAt"}


def test_officer_sees_only_own_capacity_profiles(client, auth):
    me = client.get("/api/auth/me", headers=auth["officer"]).json()
    profiles = client.get("/api/capacity-profiles", headers=auth["officer"]).json()
    assert profiles and all(p["institutionId"] == me["institutionId"] for p in profiles)
    other = client.get("/api/capacity-profiles/cap-moh-districts-q3", headers=auth["officer"])
    assert other.status_code == 404
