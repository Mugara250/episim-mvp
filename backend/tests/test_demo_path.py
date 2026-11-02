"""The P0 demo path through the API, in order, with the real engine.

login → population (view + CSV import) → presets → interventions → scenario → national run →
results → geographic run → comparison → capacity check → report → approval → policy maker sees it.
"""

import time
from pathlib import Path

import pytest

pytest.importorskip("app.simulation.registry")

SAMPLE_CSV = Path(__file__).resolve().parents[2] / "frontend/public/samples/episim_illustrative_district_counts.csv"


def _wait(client, h, url, done, timeout=30):
    end = time.time() + timeout
    while time.time() < end:
        j = client.get(url, headers=h).json()
        if done(j):
            return j
        time.sleep(0.05)
    raise AssertionError(f"timed out waiting for {url}: {j}")


@pytest.fixture
def real_engine():
    from app.services import worker

    saved = worker._engine_override
    worker.set_engine(None)
    yield
    worker.set_engine(saved)


def test_p0_demo_path(client, auth, real_engine):
    h = auth["analyst"]

    me = client.get("/api/auth/me", headers=h).json()
    assert me["role"] == "analyst"

    # Population data: list, then import the illustrative sample file.
    datasets = client.get("/api/population/datasets", headers=h).json()
    assert datasets
    csv = SAMPLE_CSV.read_bytes()
    check = client.post("/api/population/imports/check", headers=h, files={"file": ("s.csv", csv, "text/csv")})
    assert check.status_code == 200, check.text
    started = client.post(
        "/api/population/imports",
        headers=h,
        files={"file": ("s.csv", csv, "text/csv")},
        data={"format": "aggregate", "name": "Demo path import"},
    )
    assert started.status_code == 202, started.text
    job = started.json()
    job = _wait(client, h, f"/api/population/imports/{job['id']}", lambda j: j["status"] in ("completed", "failed"))
    assert job["status"] == "completed", job

    # Presets: built-ins are read-only and carry references and provisional flags.
    presets = client.get("/api/disease-presets", headers=h).json()
    ebola = next(p for p in presets if p["id"] == "ebola-zaire")
    assert ebola["reference"] and ebola["builtIn"]
    assert next(p for p in presets if p["disease"] == "marburg")["provisional"]

    # Interventions and a new scenario on the Rwanda districts dataset.
    package = client.get("/api/intervention-packages", headers=h).json()[0]
    districts_ds = next(d for d in datasets if d["id"] == "ds-districts-2022")
    sc = client.post(
        "/api/scenarios",
        headers=h,
        json={
            "name": "Demo path · Ebola Rubavu",
            "description": "",
            "datasetId": districts_ds["id"],
            "presetId": ebola["id"],
            "packageId": package["id"],
            "visibility": "institution",
            "draft": False,
        },
    )
    assert sc.status_code in (200, 201), sc.text
    sid = sc.json()["id"]

    # National run: POST returns at once, then completes in the background.
    r = client.post("/api/simulations", headers=h, json={"scenarioId": sid, "horizonDays": 120, "initialCases": 3})
    assert r.status_code == 202, r.text
    run = _wait(client, h, f"/api/simulations/{r.json()['id']}", lambda j: j["status"] not in ("queued", "running"))
    assert run["status"] == "completed", run
    res = client.get(f"/api/simulations/{run['id']}/results", headers=h).json()
    assert "not forecasts" in res["label"].lower()
    series = client.get(f"/api/simulations/{run['id']}/results/series", headers=h).json()
    assert len(series["series"]["active"]["median"]) == 121
    assert client.get(f"/api/simulations/{run['id']}/results/health-workers", headers=h).status_code == 200
    assert client.get(f"/api/simulations/{run['id']}/results/rt", headers=h).status_code == 200

    # Geographic run seeded in Rubavu (code 33).
    g = client.post(
        "/api/simulations",
        headers=h,
        json={"scenarioId": sid, "horizonDays": 90, "initialCases": 10, "modelType": "seihfr_geo",
              "seedDistrictCode": "33", "monteCarloRuns": 100},
    )
    assert g.status_code == 202, g.text
    g = g.json()
    geo_run = _wait(client, h, f"/api/simulations/{g['id']}", lambda j: j["status"] not in ("queued", "running"))
    assert geo_run["status"] == "completed", geo_run

    # Capacity is applied at analysis time.
    capacity = client.get("/api/capacity-profiles/options", headers=h).json()[0]
    geo = client.get(f"/api/simulations/{g['id']}/geographic", headers=h,
                     params={"capacityProfileId": capacity["id"]}).json()
    assert len(geo["districts"]) == 30
    assert client.get("/api/geographic/districts", headers=h).json()["type"] == "FeatureCollection"

    cmp = client.get("/api/comparison", headers=h,
                     params={"runIds": f"{run['id']},{g['id']}", "capacityProfileId": capacity["id"]})
    assert cmp.status_code == 200, cmp.text

    # Report: author drafts and submits, a different epidemiologist approves, policy maker downloads.
    rep = client.post("/api/reports", headers=h, json={"title": "Demo path brief", "simulationRunId": run["id"]})
    assert rep.status_code in (200, 201), rep.text
    rid = rep.json()["id"]
    assert client.post(f"/api/reports/{rid}/submit", headers=h).status_code == 200
    assert client.post(f"/api/reports/{rid}/approve", headers=h).status_code == 403
    assert client.post(f"/api/reports/{rid}/approve", headers=auth["reviewer"]).status_code == 200

    pm = auth["policymaker"]
    visible = client.get("/api/reports", headers=pm).json()
    assert any(x["id"] == rid for x in visible)
    assert all(x["status"] == "approved" for x in visible)
    ex = client.post(f"/api/reports/{rid}/exports", headers=pm, json={}).json()
    pdf = client.get(ex["downloadUrl"], headers=pm)
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")
