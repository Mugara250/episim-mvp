from sqlalchemy import func, select


def test_seed_is_idempotent(client):
    from app import db as dbmod
    from app.models import DiseasePreset, Scenario, User
    from app.seed import seed

    with dbmod.SessionLocal() as s:
        before = [s.scalar(select(func.count()).select_from(m)) for m in (User, Scenario, DiseasePreset)]
        seed(s)
        after = [s.scalar(select(func.count()).select_from(m)) for m in (User, Scenario, DiseasePreset)]
    assert before == after


def test_seeded_records_are_marked(client, auth):
    import json
    from pathlib import Path

    seed_dir = Path(__file__).resolve().parents[1] / "app/data/seed"
    seeded_packages = {p["id"] for p in json.loads((seed_dir / "interventions.json").read_text())["packages"]}
    datasets = client.get("/api/population/datasets", headers=auth["analyst"]).json()
    seeded = [d for d in datasets if d["id"] == "ds-districts-2022" or d["id"] == "ds-gasabo"]
    assert seeded and all(d["illustrative"] for d in seeded)
    packages = client.get("/api/intervention-packages", headers=auth["analyst"]).json()
    seeded = [p for p in packages if p["id"] in seeded_packages]
    assert seeded and all(p["illustrative"] for p in seeded)
    types = client.get("/api/intervention-types", headers=auth["analyst"]).json()
    assert all(t["placeholder"] for t in types if t["builtIn"])


def test_districts_geojson(client, auth):
    g = client.get("/api/geographic/districts", headers=auth["policymaker"]).json()
    assert len(g["features"]) == 30 and "CC BY 4.0" in g["attribution"]
    assert {"code", "name", "province", "cx", "cy"} <= set(g["features"][0]["properties"])


def test_admin_flows(client, auth):
    h = auth["admin"]
    reqs = client.get("/api/admin/access-requests", headers=h).json()
    pending = next(r for r in reqs if r["status"] == "Pending")
    u = client.post(
        f"/api/admin/access-requests/{pending['id']}/approve", headers=h, json={"role": "analyst"}
    )
    assert u.status_code == 200 and u.json()["role"] == "analyst"
    log = client.get("/api/admin/audit-log", headers=h, params={"action": "User created"}).json()
    assert any(pending["email"] in x["details"] or x["target"] == pending["name"] for x in log["items"])
    health = client.get("/api/admin/system-health", headers=h).json()
    assert health["database"]["ok"] is True
    hosp = client.post(
        "/api/admin/hospitals",
        headers=h,
        json={"name": "Test Hospital", "district": "Huye", "isolationBeds": 5},
    )
    assert hosp.status_code == 201


def test_officer_hospital_flow(client, auth):
    h = auth["officer"]
    assert client.get("/api/hospital/me", headers=h).json()["name"] == "Gisenyi District Hospital"
    entry = {"date": "2026-10-20", "disease": "Ebola", "confirmed": 2, "bedsTotal": 24, "bedsOccupied": 12}
    assert client.post("/api/hospital/entries", headers=h, json=entry).status_code == 201
    assert (
        client.post("/api/hospital/entries", headers=h, json={**entry, "bedsOccupied": 30}).status_code == 422
    )
    ins = client.get("/api/hospital/instructions", headers=h).json()[0]
    assert (
        client.put(
            f"/api/hospital/instructions/{ins['id']}/status", headers=h, json={"status": "Can't do"}
        ).status_code
        == 422
    )
    assert (
        client.put(
            f"/api/hospital/instructions/{ins['id']}/status", headers=h, json={"status": "Done"}
        ).status_code
        == 200
    )
    assert client.get("/api/dashboard/officer", headers=h).status_code == 200


def test_rt_estimate(client, auth):
    r = client.get("/api/rt/estimate", headers=auth["analyst"], params={"datasetId": "ebola-rubavu-exercise"})
    assert r.status_code == 200
    j = r.json()
    assert j["trend"] in ("growing", "shrinking", "uncertain", "not-enough-data") and j["illustrative"]
    assert (
        client.get("/api/rt/datasets/ebola-rubavu-exercise/quality", headers=auth["officer"]).json()["status"]
        == "Passed"
    )
