"""One end-to-end run through the real engine (skipped if the engine package is missing)."""

import time

import pytest

pytest.importorskip("app.simulation.registry")


def test_real_engine_run(client, auth):
    from app.services import worker

    saved = worker._engine_override
    worker.set_engine(None)
    try:
        h = auth["analyst"]
        r = client.post(
            "/api/simulations",
            headers=h,
            json={"scenarioId": "SC-1042", "horizonDays": 60, "initialCases": 3, "monteCarloRuns": 50},
        )
        assert r.status_code == 202
        rid = r.json()["id"]
        for _ in range(400):
            j = client.get(f"/api/simulations/{rid}", headers=h).json()
            if j["status"] not in ("queued", "running"):
                break
            time.sleep(0.05)
        assert j["status"] == "completed", j
        assert j["engineVersion"].startswith("seihfr")
        res = client.get(f"/api/simulations/{rid}/results", headers=h).json()
        fc = res["summary"]["finalCases"]
        assert fc["low"] <= fc["median"] <= fc["high"]
        rt = client.get(f"/api/simulations/{rid}/results/rt", headers=h)
        assert rt.status_code == 200
    finally:
        worker.set_engine(saved)
