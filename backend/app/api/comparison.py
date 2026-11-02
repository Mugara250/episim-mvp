"""Module 12 — Scenario analysis and comparison (completed runs only, docs D5)."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.simulations import visible_run  # noqa: I001
from app.config import ESTIMATE_LABEL
from app.db import get_db
from app.deps import forbid, require
from app.models import CapacityProfile, ScenarioComparison, SimulationResult, User
from app.schemas.base import CamelModel
from app.services.audit import audit
from app.services.ids import next_code
from app.services.results import capacity_check, inputs_dict, summary_dict

router = APIRouter(prefix="/api", tags=["comparison"])

MAX_RUNS = 3
# metric key, label, lower-is-better
METRICS = [
    ("pTakeOff", "Chance it takes off", True),
    ("finalCases", "Total cases", True),
    ("finalDeaths", "Deaths", True),
    ("peakBeds", "Peak beds needed", True),
    ("pBedsExceeded", "Chance beds run out", True),
    ("hcwShare", "Health-worker share of infections", True),
]


def _differences(inputs: list[dict]) -> tuple[list[dict], list[str]]:
    def settings(i: dict) -> dict:
        return {
            "Disease preset": f"{i['disease']['name']} (v{i['disease']['presetVersion']})",
            "Population": f"{i['population']['datasetName']} v{i['population']['datasetVersion']}",
            "Interventions": i["interventions"]["packageName"] or "No interventions",
            "Run length": f"{i['horizonDays']} days",
            "Initial cases": str(i["initialCases"]),
            "Monte Carlo runs": str(i["monteCarloRuns"]),
            "Seed": str(i["seed"]),
            "Model": i["modelType"],
            "Health-worker protection": "{ppe_before:.0%} → {ppe_after:.0%} from day {recognition_day}".format(  # noqa: E501
                **i["hcw"]
            )
            if i.get("hcw")
            else "—",
        }

    rows = [settings(i) for i in inputs]
    diffs = [{"setting": k, "values": [r[k] for r in rows]} for k in rows[0] if len({r[k] for r in rows}) > 1]
    warnings = []
    changed = {d["setting"] for d in diffs}
    if changed & {"Disease preset", "Population", "Run length"}:
        warnings.append(
            "These runs differ in disease, population or run length, "
            "so differences may not come from the response alone."
        )
    if "Seed" in changed or "Monte Carlo runs" in changed:
        warnings.append(
            "Runs use different seeds or numbers of runs; small differences may be due to chance."
        )
    return diffs, warnings


@router.get("/comparison")
def compare(
    run_ids: str = Query(..., alias="runIds", description="Comma-separated, 2 to 3 completed run ids"),
    capacity_profile_id: str | None = Query(None, alias="capacityProfileId"),
    baseline_id: str | None = Query(None, alias="baselineId"),
    db: Session = Depends(get_db),
    user: User = Depends(require("simulation")),
):
    ids = [x for x in dict.fromkeys(i.strip() for i in run_ids.split(",")) if x]
    if len(ids) < 2:
        raise HTTPException(422, "Select at least 2 runs to compare.")
    if len(ids) > MAX_RUNS:
        raise HTTPException(422, f"Compare up to {MAX_RUNS} runs at a time.")
    runs = [visible_run(db, i, user) for i in ids]
    not_done = [r.id for r in runs if r.status != "completed"]
    if not_done:
        raise HTTPException(
            409, f"Only completed runs can be compared ({', '.join(not_done)} not completed)."
        )
    baseline = baseline_id or ids[0]
    if baseline not in ids:
        raise HTTPException(422, "The baseline must be one of the compared runs.")
    profile = db.get(CapacityProfile, capacity_profile_id) if capacity_profile_id else None
    if capacity_profile_id and profile is None:
        raise HTTPException(404, "Capacity profile not found.")
    results = {r.id: db.get(SimulationResult, r.id) for r in runs}
    inputs = [inputs_dict(r) for r in runs]
    diffs, warnings = _differences(inputs)

    per_run = {}
    for r in runs:
        s = summary_dict(results[r.id])
        cap = capacity_check(r, results[r.id], profile)
        s["pBedsExceeded"] = cap["pBedsExceeded"] if cap else None
        per_run[r.id] = {"summary": s, "capacity": cap}

    def median(v):
        return v.get("median") if isinstance(v, dict) else v

    table = []
    for key, label, lower_better in METRICS:
        base = median(per_run[baseline]["summary"].get(key))
        values = []
        for r in runs:
            v = per_run[r.id]["summary"].get(key)
            m = median(v)
            diff = None if (m is None or base is None or r.id == baseline) else m - base
            values.append(
                {
                    "runId": r.id,
                    "value": v,
                    "diff": diff,
                    "better": None if not diff else (diff < 0) == lower_better,
                }
            )
        table.append({"metric": key, "label": label, "values": values})

    provisional = any(i["disease"]["provisional"] for i in inputs)
    return {
        "label": ESTIMATE_LABEL,
        "provisional": provisional,
        "baselineId": baseline,
        "capacity": {
            "profileId": profile.id,
            "profileName": profile.name,
            "placeholder": profile.placeholder,
            "hospitalBeds": profile.hospital_beds,
        }
        if profile
        else None,
        "runs": [
            {
                "id": r.id,
                "scenarioId": r.scenario_id,
                "scenarioName": (r.inputs_snapshot.get("scenario") or {}).get("name"),
                "requestedBy": r.requested_by.name,
                "completedAt": r.completed_at,
                "inputs": inputs[k],
                "capacity": per_run[r.id]["capacity"],
                "series": {
                    "active": (results[r.id].series or {}).get("active"),
                    "hospitalised": (results[r.id].series or {}).get("hospitalised"),
                },
            }
            for k, r in enumerate(runs)
        ],
        "differences": diffs,
        "warnings": warnings,
        "results": table,
    }


class ComparisonIn(CamelModel):
    name: str = Field(min_length=1)
    notes: str = ""
    run_ids: list[str] = Field(min_length=2, max_length=MAX_RUNS)
    baseline_run_id: str | None = None
    capacity_profile_id: str | None = None


class ComparisonOut(ComparisonIn):
    id: str
    created_by: str
    created_at: datetime
    illustrative: bool


def _cmp_out(c: ScenarioComparison, db: Session) -> ComparisonOut:
    creator = db.get(User, c.created_by_id)
    return ComparisonOut(
        id=c.id,
        name=c.name,
        notes=c.notes,
        run_ids=c.run_ids,
        baseline_run_id=c.baseline_run_id,
        capacity_profile_id=c.capacity_profile_id,
        created_by=creator.name if creator else "",
        created_at=c.created_at,
        illustrative=c.illustrative,
    )


@router.get("/scenario-comparisons", response_model=list[ComparisonOut])
def list_comparisons(db: Session = Depends(get_db), user: User = Depends(require("simulation"))):
    rows = db.scalars(
        select(ScenarioComparison)
        .where(ScenarioComparison.created_by_id == user.id)
        .order_by(ScenarioComparison.created_at.desc())
    )
    return [_cmp_out(c, db) for c in rows]


@router.post("/scenario-comparisons", response_model=ComparisonOut, status_code=201)
def save_comparison(
    body: ComparisonIn, db: Session = Depends(get_db), user: User = Depends(require("simulation"))
):
    for rid in body.run_ids:
        run = visible_run(db, rid, user)
        if run.status != "completed":
            raise HTTPException(409, "Only completed runs can be saved in a comparison.")
    c = ScenarioComparison(
        id=next_code(db, ScenarioComparison, "CMP-", 3, 1),
        name=body.name,
        notes=body.notes,
        run_ids=body.run_ids,
        baseline_run_id=body.baseline_run_id or body.run_ids[0],
        capacity_profile_id=body.capacity_profile_id,
        created_by_id=user.id,
    )
    db.add(c)
    audit(db, user, "Comparison saved", c.name, ", ".join(c.run_ids))
    db.commit()
    return _cmp_out(c, db)


def _own(db: Session, cid: str, user: User) -> ScenarioComparison:
    c = db.get(ScenarioComparison, cid)
    if c is None:
        raise HTTPException(404, "Comparison not found.")
    if c.created_by_id != user.id:
        raise forbid("Only the person who saved this comparison can change it.")
    return c


@router.get("/scenario-comparisons/{cid}", response_model=ComparisonOut)
def get_comparison(cid: str, db: Session = Depends(get_db), user: User = Depends(require("simulation"))):
    c = db.get(ScenarioComparison, cid)
    if c is None:
        raise HTTPException(404, "Comparison not found.")
    for rid in c.run_ids:
        visible_run(db, rid, user)
    return _cmp_out(c, db)


class ComparisonEdit(CamelModel):
    name: str = Field(min_length=1)
    notes: str = ""


@router.put("/scenario-comparisons/{cid}", response_model=ComparisonOut)
def edit_comparison(
    cid: str, body: ComparisonEdit, db: Session = Depends(get_db), user: User = Depends(require("simulation"))
):
    c = _own(db, cid, user)
    c.name, c.notes = body.name, body.notes
    audit(db, user, "Comparison edited", c.name)
    db.commit()
    return _cmp_out(c, db)


@router.delete("/scenario-comparisons/{cid}", status_code=204)
def delete_comparison(cid: str, db: Session = Depends(get_db), user: User = Depends(require("simulation"))):
    c = _own(db, cid, user)
    db.delete(c)
    audit(db, user, "Comparison deleted", c.name)
    db.commit()
