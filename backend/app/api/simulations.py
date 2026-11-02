"""Module 5 — Simulation engine orchestration; results for Modules 6, 9, 11, 15, 16."""

import copy
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import ESTIMATE_LABEL, get_settings
from app.db import get_db
from app.deps import forbid, require
from app.models import BorderRisk, CapacityProfile, Scenario, SimulationResult, SimulationRun, User
from app.schemas.base import CamelModel
from app.services.access import scenario_access
from app.services.audit import audit
from app.services.geo_analysis import geographic_payload
from app.services.ids import next_code
from app.services.resolver import ResolveError, resolve
from app.services.results import capacity_check, honesty, inputs_dict, rng, run_summary_tiles, summary_dict
from app.services.worker import engine, engine_version, get_worker

router = APIRouter(prefix="/api/simulations", tags=["simulations"])

DEFAULT_SEED = 2026


class HcwIn(CamelModel):
    pool: int = Field(600, ge=1)
    ppe_before: float = Field(ge=0, le=1)
    ppe_after: float = Field(ge=0, le=1)
    recognition_day: int = Field(ge=0)


class RunIn(CamelModel):
    scenario_id: str
    horizon_days: int = Field(ge=1, le=365)
    initial_cases: int = Field(ge=1)
    monte_carlo_runs: int = Field(200, ge=10, le=1000)
    seed: int | None = Field(None, ge=0, le=2**31 - 1)
    model_type: str = Field("seihfr", pattern="^(seihfr|seihfr_geo)$")
    seed_district_code: str | None = None
    hcw: HcwIn | None = None


class RunOut(CamelModel):
    id: str
    scenario_id: str
    scenario_name: str
    model_type: str
    horizon_days: int
    initial_cases: int
    monte_carlo_runs: int
    seed: int
    seed_district_code: str | None
    status: str
    progress: float
    requested_by: str
    requested_by_id: str
    queued_at: datetime
    started_at: datetime
    completed_at: datetime | None
    duration_sec: float | None
    error: str | None
    summary: dict | None
    engine_version: str | None
    disease: str | None
    preset_name: str | None
    provisional: bool | None
    dataset_name: str | None
    dataset_version: int | None
    package_name: str | None
    label: str = ESTIMATE_LABEL


def run_out(run: SimulationRun, res: SimulationResult | None = None) -> RunOut:
    snap = run.inputs_snapshot or {}
    disease = snap.get("disease") or {}
    pop = snap.get("population") or {}
    return RunOut(
        id=run.id,
        scenario_id=run.scenario_id,
        scenario_name=(snap.get("scenario") or {}).get("name") or run.scenario.name,
        model_type=run.model_type,
        horizon_days=run.horizon_days,
        initial_cases=run.initial_cases,
        monte_carlo_runs=run.monte_carlo_runs,
        seed=run.seed,
        seed_district_code=run.seed_district_code,
        status=run.status,
        progress=run.progress,
        requested_by=run.requested_by.name,
        requested_by_id=run.requested_by_id,
        queued_at=run.queued_at,
        started_at=run.started_at or run.queued_at,
        completed_at=run.completed_at,
        duration_sec=run.duration_sec,
        error=run.error_message,
        summary=run_summary_tiles(res) if run.status == "completed" else None,
        engine_version=run.engine_version,
        disease=disease.get("key"),
        preset_name=disease.get("name"),
        provisional=disease.get("provisional"),
        dataset_name=pop.get("dataset_name"),
        dataset_version=pop.get("dataset_version"),
        package_name=(snap.get("interventions") or {}).get("package_name"),
    )


def visible_run(db: Session, run_id: str, user: User) -> SimulationRun:
    run = db.get(SimulationRun, run_id)
    if run is None or not (run.requested_by_id == user.id or scenario_access(run.scenario, user)):
        raise HTTPException(404, "Run not found, or its scenario has not been shared with you.")
    return run


def completed_result(db: Session, run_id: str, user: User) -> tuple[SimulationRun, SimulationResult]:
    run = visible_run(db, run_id, user)
    if run.status != "completed":
        raise HTTPException(409, f"This run is {run.status}; results exist only for completed runs.")
    res = db.get(SimulationResult, run.id)
    if res is None:
        raise HTTPException(409, "This run has no stored results.")
    return run, res


def pick_profile(db: Session, run: SimulationRun, capacity_profile_id: str | None) -> CapacityProfile | None:
    pid = capacity_profile_id or run.scenario.capacity_profile_id
    if not pid:
        return None
    p = db.get(CapacityProfile, pid)
    if p is None and capacity_profile_id:
        raise HTTPException(404, "Capacity profile not found.")
    return p


@router.post("", response_model=RunOut, status_code=202)
def start_run(
    body: RunIn, db: Session = Depends(get_db), user: User = Depends(require("simulation", "write"))
):
    """Queues a run and returns at once. Poll GET /api/simulations/{id} for status and progress."""
    scenario = db.get(Scenario, body.scenario_id)
    if scenario is None or scenario_access(scenario, user) is None:
        raise HTTPException(404, "Scenario not found, or it has not been shared with you.")
    seed = body.seed if body.seed is not None else DEFAULT_SEED
    try:
        snapshot = resolve(
            db,
            scenario,
            model_type=body.model_type,
            days=body.horizon_days,
            initial_cases=body.initial_cases,
            runs=body.monte_carlo_runs,
            seed=seed,
            seed_district_code=body.seed_district_code,
            hcw=body.hcw.model_dump() if body.hcw else None,
        )
    except ResolveError as exc:
        raise HTTPException(422, str(exc)) from None
    version = engine_version()
    snapshot["engine_version"] = version
    run = SimulationRun(
        id=next_code(db, SimulationRun, "RUN-", 4, 100),
        scenario_id=scenario.id,
        model_type=body.model_type,
        horizon_days=body.horizon_days,
        initial_cases=body.initial_cases,
        monte_carlo_runs=body.monte_carlo_runs,
        seed=seed,
        seed_district_code=body.seed_district_code,
        engine_version=version,
        inputs_snapshot=snapshot,
        requested_by_id=user.id,
    )
    run.scenario = scenario
    run.requested_by = user
    db.add(run)
    audit(
        db,
        user,
        "Simulation run",
        scenario.name,
        f"{run.id}: {body.monte_carlo_runs} runs, {body.horizon_days} days, seed {seed}",
    )
    db.commit()
    get_worker().submit(run.id)
    return run_out(run)


@router.get("", response_model=list[RunOut])
def list_runs(
    scenario_id: str | None = Query(None, alias="scenarioId"),
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("simulation")),
):
    """The user's runs and runs on scenarios shared with them (policy makers: shared scenarios only)."""
    q = select(SimulationRun).order_by(SimulationRun.queued_at.desc())
    if scenario_id:
        q = q.where(SimulationRun.scenario_id == scenario_id)
    if status:
        q = q.where(SimulationRun.status.in_(status.split(",")))
    runs = [r for r in db.scalars(q) if r.requested_by_id == user.id or scenario_access(r.scenario, user)]
    results = {
        r.run_id: r
        for r in db.scalars(select(SimulationResult).where(SimulationResult.run_id.in_([r.id for r in runs])))
    }
    return [run_out(r, results.get(r.id)) for r in runs]


@router.get("/{run_id}", response_model=RunOut)
def get_run(run_id: str, db: Session = Depends(get_db), user: User = Depends(require("simulation"))):
    run = visible_run(db, run_id, user)
    return run_out(run, db.get(SimulationResult, run.id))


@router.post("/{run_id}/cancel", response_model=RunOut)
def cancel_run(
    run_id: str, db: Session = Depends(get_db), user: User = Depends(require("simulation", "write"))
):
    run = visible_run(db, run_id, user)
    if run.requested_by_id != user.id and scenario_access(run.scenario, user) not in ("owner", "admin"):
        raise forbid("Only the person who started this run, or the scenario owner, can cancel it.")
    if run.status == "queued":
        run.status = "cancelled"
        run.duration_sec = 0
    elif run.status == "running":
        run.cancel_requested = True
    else:
        raise HTTPException(409, f"This run is already {run.status}.")
    audit(db, user, "Simulation cancelled", run.scenario.name, run.id)
    db.commit()
    return run_out(run)


@router.get("/{run_id}/results")
def results(
    run_id: str,
    capacity_profile_id: str | None = Query(None, alias="capacityProfileId"),
    db: Session = Depends(get_db),
    user: User = Depends(require("simulation")),
):
    """Summary results with 5–95% ranges. Pass capacityProfileId to apply a capacity check."""
    run, res = completed_result(db, run_id, user)
    return {
        "runId": run.id,
        "modelType": run.model_type,
        **honesty(run),
        "summary": summary_dict(res),
        "capacity": capacity_check(run, res, pick_profile(db, run, capacity_profile_id)),
        "inputs": inputs_dict(run),
    }


@router.get("/{run_id}/results/series")
def results_series(run_id: str, db: Session = Depends(get_db), user: User = Depends(require("simulation"))):
    """Daily bands (5th, median, 95th) per series, columnar: {name: {low: [], median: [], high: []}}."""
    run, res = completed_result(db, run_id, user)
    return {"runId": run.id, "days": run.horizon_days, **honesty(run), "series": res.series}


@router.get("/{run_id}/results/health-workers")
def results_hcw(run_id: str, db: Session = Depends(get_db), user: User = Depends(require("hcw"))):
    run, res = completed_result(db, run_id, user)
    s = res.series or {}
    return {
        "runId": run.id,
        **honesty(run),
        "settings": run.inputs_snapshot.get("hcw"),
        "hcwShare": rng((res.summary or {}).get("hcw_share")),
        "hcwInfections": rng((res.summary or {}).get("hcw_infections")),
        "series": {
            "hcwCumulative": s.get("hcw_cumulative"),
            "communityCumulative": s.get("community_cumulative"),
        },
    }


class HcwWhatIfIn(CamelModel):
    ppe_before: float | None = Field(None, ge=0, le=1)
    ppe_after: float | None = Field(None, ge=0, le=1)
    recognition_day: int | None = Field(None, ge=0)
    pool: int | None = Field(None, ge=1)


def _preview(snapshot: dict, runs: int) -> dict:
    snap = copy.deepcopy(snapshot)
    snap["runs"] = runs
    run_model, _cancelled, _v = engine()
    return run_model(snap, lambda _f: None, lambda: False)


@router.post("/{run_id}/health-workers/what-if")
def hcw_what_if(
    run_id: str,
    body: HcwWhatIfIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("hcw", "write")),
):
    """Preview (fewer runs): health-worker infections with different protection settings, same seed."""
    run, _res = completed_result(db, run_id, user)
    runs = get_settings().what_if_runs * 2
    before = _preview(run.inputs_snapshot, runs)
    snap = copy.deepcopy(run.inputs_snapshot)
    snap["hcw"] = {**snap.get("hcw", {}), **body.model_dump(exclude_none=True)}
    after = _preview(snap, runs)

    def pick(r):
        s = r.get("summary", {})
        return {
            "hcwInfections": rng(s.get("hcw_infections")),
            "hcwShare": rng(s.get("hcw_share")),
            "finalCases": rng(s.get("final_cases")),
            "hcwCumulative": (r.get("series") or {}).get("hcw_cumulative"),
        }

    return {
        "runId": run.id,
        "preview": True,
        "runs": runs,
        **honesty(run),
        "settings": snap["hcw"],
        "before": pick(before),
        "after": pick(after),
    }


@router.get("/{run_id}/results/rt")
def results_rt(
    run_id: str, window: int = 7, db: Session = Depends(get_db), user: User = Depends(require("simulation"))
):
    """Rt (Cori et al.) estimated from the run's median daily incidence: what Rt tracking would show."""
    from app.simulation.rt import estimate_rt, trend_of

    run, res = completed_result(db, run_id, user)
    inc = ((res.series or {}).get("incidence") or {}).get("median") or []
    d = run.inputs_snapshot.get("disease") or {}
    points = estimate_rt(
        [round(x) for x in inc],
        {"mean": d.get("serial_interval_mean"), "sd": d.get("serial_interval_sd")},
        window=window,
    )
    latest = next((p for p in reversed(points) if p.get("rt") is not None), None)
    return {
        "runId": run.id,
        **honesty(run),
        "points": points,
        "trend": trend_of(latest) if latest else "not-enough-data",
    }


@router.get("/{run_id}/geographic")
def geographic(
    run_id: str,
    capacity_profile_id: str | None = Query(None, alias="capacityProfileId"),
    db: Session = Depends(get_db),
    user: User = Depends(require("geographic")),
):
    run, res = completed_result(db, run_id, user)
    if run.model_type != "seihfr_geo":
        raise HTTPException(409, "This run was not a geographic spread run.")
    risks = [
        {"country": b.country, "risk": b.risk, "side": b.side, "note": b.note}
        for b in db.scalars(select(BorderRisk))
    ]
    return geographic_payload(run, res, pick_profile(db, run, capacity_profile_id), risks)


class WhatIfIn(CamelModel):
    district_code: str
    response_start_day: int = Field(ge=0, le=365)


@router.post("/{run_id}/geographic/what-if")
def geographic_what_if(
    run_id: str,
    body: WhatIfIn,
    capacity_profile_id: str | None = Query(None, alias="capacityProfileId"),
    db: Session = Depends(get_db),
    user: User = Depends(require("geographic", "write")),
):
    """ "Start response on day X in district Y": re-runs the model with fewer Monte Carlo runs (a preview)
    with and without the response, same seed, and returns before/after for that district."""
    run, _res = completed_result(db, run_id, user)
    if run.model_type != "seihfr_geo":
        raise HTTPException(409, "This run was not a geographic spread run.")
    codes = [d["code"] for d in run.inputs_snapshot["population"]["districts"]]
    if body.district_code not in codes:
        raise HTTPException(422, "That district is not part of this run.")
    runs = get_settings().what_if_runs
    before = _preview(run.inputs_snapshot, runs)
    snap = copy.deepcopy(run.inputs_snapshot)
    snap["geo"]["response"] = {"district_code": body.district_code, "start_day": body.response_start_day}
    after = _preview(snap, runs)
    profile = pick_profile(db, run, capacity_profile_id)
    from app.services.geo_analysis import district_rows

    def district(result: dict) -> dict:
        fake = SimulationResult(run_id=run.id, districts=result.get("districts", []))
        rows = {r["code"]: r for r in district_rows(run, fake, profile)}
        r = rows.get(body.district_code, {})
        return {
            k: r.get(k)
            for k in (
                "totalCases",
                "peakDay",
                "peakHospitalised",
                "bedsRunOutDay",
                "pBedsExceeded",
                "beds",
                "status",
            )
        }

    def national(result: dict) -> dict:
        return {"finalCases": rng((result.get("summary") or {}).get("final_cases"))}

    audit(
        db,
        user,
        "Geographic what-if",
        run.scenario.name,
        f"{run.id}: district {body.district_code} from day {body.response_start_day}",
    )
    db.commit()
    return {
        "runId": run.id,
        "districtCode": body.district_code,
        "responseStartDay": body.response_start_day,
        "preview": True,
        "runs": runs,
        **honesty(run),
        "before": district(before),
        "after": district(after),
        "nationalBefore": national(before),
        "nationalAfter": national(after),
    }
