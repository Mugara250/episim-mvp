import re
from pathlib import Path

from app.core.rbac import PERMISSION_MATRIX

TS = Path(__file__).resolve().parents[2] / "frontend" / "src" / "lib" / "rbac.ts"


def parse_ts_matrix() -> dict:
    src = TS.read_text()
    body = src[src.index("PERMISSION_MATRIX") :]
    out = {}
    for role in ("admin", "officer", "policymaker", "analyst"):
        block = re.search(rf"\b{role}:\s*\{{(.*?)\}}", body, re.S).group(1)
        out[role] = dict(re.findall(r"(\w+):\s*'(\w+)'", block))
    return out


def test_matrix_matches_frontend():
    assert parse_ts_matrix() == PERMISSION_MATRIX


def test_forbidden_by_role(client, auth):
    cases = [
        ("admin", "GET", "/api/population/datasets"),
        ("admin", "GET", "/api/reports"),
        ("officer", "GET", "/api/population/datasets"),
        ("officer", "GET", "/api/admin/users"),
        ("officer", "GET", "/api/geographic/border-risks"),
        ("policymaker", "GET", "/api/rt/datasets"),
        ("analyst", "GET", "/api/capacity-profiles"),
        ("analyst", "GET", "/api/admin/users"),
    ]
    for role, method, path in cases:
        assert client.request(method, path, headers=auth[role]).status_code == 403, (role, path)


def test_policymaker_cannot_run(client, auth):
    r = client.post(
        "/api/simulations",
        headers=auth["policymaker"],
        json={"scenarioId": "SC-1042", "horizonDays": 30, "initialCases": 3},
    )
    assert r.status_code == 403


def test_analyst_reads_capacity_options_only(client, auth):
    r = client.get("/api/capacity-profiles/options", headers=auth["analyst"])
    assert r.status_code == 200 and any(p["hasDistrictBeds"] for p in r.json())


def test_officer_edits_own_capacity_only(client, auth):
    profiles = {p["id"]: p for p in client.get("/api/capacity-profiles", headers=auth["officer"]).json()}
    own = profiles["cap-gisenyi-2026"]
    assert own["canEdit"] and "cap-kigali-2026" not in profiles  # other institutions are not listed
    body = {
        k: own[k]
        for k in (
            "name",
            "institutionId",
            "hospitalBeds",
            "icuBeds",
            "ventilators",
            "healthWorkers",
            "testsPerDay",
            "vaccineDoses",
            "sourceNote",
            "districtBeds",
        )
    }
    assert (
        client.put("/api/capacity-profiles/cap-gisenyi-2026", headers=auth["officer"], json=body).status_code
        == 200
    )
    body2 = {**body, "name": "Kigali Region - 2026", "institutionId": "R-KGL"}
    assert (
        client.put("/api/capacity-profiles/cap-kigali-2026", headers=auth["officer"], json=body2).status_code
        == 403
    )
