from conftest import wait_for


def test_workflow_and_visibility(client, auth, start_run):
    run = start_run()
    wait_for(client, auth["analyst"], run["id"])
    h = auth["analyst"]
    rep = client.post(
        "/api/reports",
        headers=h,
        json={"title": "Test brief", "simulationRunId": run["id"], "summary": "Short summary."},
    ).json()
    assert rep["status"] == "draft" and rep["figures"] and rep["provisional"] is True
    assert client.get(f"/api/reports/{rep['id']}", headers=auth["policymaker"]).status_code == 404
    assert client.post(f"/api/reports/{rep['id']}/approve", headers=auth["reviewer"]).status_code == 409
    assert client.post(f"/api/reports/{rep['id']}/submit", headers=h).json()["status"] == "pending_approval"
    assert client.post(f"/api/reports/{rep['id']}/approve", headers=h).status_code == 403  # author ≠ approver
    assert client.post(f"/api/reports/{rep['id']}/approve", headers=auth["policymaker"]).status_code == 403
    ok = client.post(f"/api/reports/{rep['id']}/approve", headers=auth["reviewer"]).json()
    assert ok["status"] == "approved" and ok["approvedBy"] == "Dr. Sarah Icyeza"
    seen = {r["id"] for r in client.get("/api/reports", headers=auth["policymaker"]).json()}
    assert rep["id"] in seen
    assert all(
        r["status"] == "approved" for r in client.get("/api/reports", headers=auth["policymaker"]).json()
    )


def test_officer_sees_own_hospital_reports(client, auth):
    rows = client.get("/api/reports", headers=auth["officer"]).json()
    assert rows and all(r["audience"] == "hospital" and r["hospitalId"] == "H-01" for r in rows)


def test_pdf_export(client, auth, start_run):
    run = start_run()
    wait_for(client, auth["analyst"], run["id"])
    rep = client.post(
        "/api/reports",
        headers=auth["analyst"],
        json={
            "title": "PDF test",
            "simulationRunId": run["id"],
            "keyPoints": ["One"],
            "recommendations": ["Two"],
        },
    ).json()
    ex = client.post(f"/api/reports/{rep['id']}/exports", headers=auth["analyst"], json={}).json()
    assert ex["status"] == "completed", ex
    pdf = client.get(ex["downloadUrl"], headers=auth["analyst"])
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF") and len(pdf.content) > 10_000
