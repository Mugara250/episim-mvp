"""API test fixtures: a temporary SQLite database seeded once per session, a TestClient, role tokens,
and a fast fake engine (the real engine has its own tests in tests/simulation)."""

import os
import tempfile
import time

import pytest

_tmp = tempfile.mkdtemp(prefix="episim-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["FILES_DIR"] = f"{_tmp}/files"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-hs256-0123456789"
os.environ["DEMO_MODE"] = "true"
os.environ["WORKER_THREADS"] = "2"


class FakeCancelled(Exception):
    pass


class FakeEngine:
    """mode: ok | slow | fail. Produces the engine's result shape with tiny arrays."""

    mode = "ok"

    def run(self, snapshot, progress, should_cancel):
        days = snapshot["days"]
        if self.mode == "fail":
            raise RuntimeError("population data could not be read")
        if self.mode == "slow":
            for i in range(200):
                progress(i / 200)
                if should_cancel():
                    raise FakeCancelled()
                time.sleep(0.03)
        band = {
            "low": [0.0] * (days + 1),
            "median": [float(d) for d in range(days + 1)],
            "high": [2.0 * d for d in range(days + 1)],
        }
        rng = {"low": 1.0, "median": 10.0, "high": 100.0}
        result = {
            "summary": {
                "p_take_off": 0.4,
                "p_over_50": 0.2,
                "p_over_100": 0.1,
                "final_cases": rng,
                "final_deaths": rng,
                "peak_beds": rng,
                "hcw_share": {"low": 0.0, "median": 0.05, "high": 0.2},
                "hcw_infections": rng,
                "peak_infectious": rng,
                "peak_day": {"low": 10, "median": 30, "high": 60},
                "recovered": rng,
            },
            "run_peaks": [5, 10, 20, 50, 300],
            "series": {
                k: band
                for k in (
                    "active",
                    "hospitalised",
                    "funerals",
                    "cumulative",
                    "deaths",
                    "hcw_cumulative",
                    "community_cumulative",
                    "incidence",
                )
            },
        }
        if snapshot["model_type"] == "seihfr_geo":
            result["districts"] = [
                {
                    "code": d["code"],
                    "p_reached": 1.0 if d["code"] == snapshot["geo"]["seed_district_code"] else 0.2,
                    "first_case_day": {"low": 0, "median": 5, "high": 20},
                    "total_cases": rng,
                    "peak_day": rng,
                    "peak_hospitalised": rng,
                    "series": {"cumulative": band, "hospitalised": band},
                    "run_peak_hospitalised": [1, 2, 3, 400],
                }
                for d in snapshot["population"]["districts"]
            ]
            result["movement"] = {"method": "gravity", "links": []}
        return result


@pytest.fixture(scope="session")
def fake_engine():
    from app.services import worker

    eng = FakeEngine()
    worker.set_engine(lambda: (eng.run, FakeCancelled, "fake-1"))
    yield eng
    worker.set_engine(None)


@pytest.fixture(autouse=True)
def _reset_engine_mode(request):
    yield
    if "fake_engine" in request.fixturenames:
        request.getfixturevalue("fake_engine").mode = "ok"


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient

    import app.models  # noqa: F401
    from app import db as dbmod
    from app.db import Base
    from app.main import app
    from app.seed import seed

    Base.metadata.create_all(dbmod.engine)
    with dbmod.SessionLocal() as s:
        seed(s)
    with TestClient(app) as c:
        yield c


def _login(client, email, password):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['accessToken']}"}


@pytest.fixture(scope="session")
def auth(client):
    return {
        "admin": _login(client, "admin@moh.gov.rw", "admin123"),
        "analyst": _login(client, "epidemiologist@rbc.gov.rw", "epi123"),
        "reviewer": _login(client, "s.icyeza@rbc.gov.rw", "epi123"),
        "officer": _login(client, "officer@who.int", "officer123"),
        "policymaker": _login(client, "policymaker@moh.gov.rw", "policy123"),
    }


def wait_for(client, headers, run_id, statuses=("completed", "failed", "cancelled"), timeout=20):
    end = time.time() + timeout
    while time.time() < end:
        j = client.get(f"/api/simulations/{run_id}", headers=headers).json()
        if j["status"] in statuses:
            return j
        time.sleep(0.05)
    raise AssertionError(f"run {run_id} still {j['status']}")


@pytest.fixture
def start_run(client, auth, fake_engine):
    def _start(scenario_id="SC-1042", who="analyst", **extra):
        body = {"scenarioId": scenario_id, "horizonDays": 30, "initialCases": 3, **extra}
        r = client.post("/api/simulations", headers=auth[who], json=body)
        assert r.status_code == 202, r.text
        return r.json()

    return _start
