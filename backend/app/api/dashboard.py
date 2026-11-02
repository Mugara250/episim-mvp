"""Module 2 — Per-role dashboard summaries, derived from the database."""

from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import ESTIMATE_LABEL
from app.db import get_db
from app.deps import forbid, require
from app.models import (
    CaseDataset,
    CaseRecord,
    DiseasePreset,
    HospitalEntry,
    Institution,
    Instruction,
    PolicyAlert,
    Report,
    ResponsePlan,
    Scenario,
    ScenarioApproval,
    SimulationResult,
    SimulationRun,
    User,
)
from app.models.common import utcnow
from app.services.access import scenario_access
from app.services.case_quality import daily_counts, quality
from app.services.results import run_summary_tiles

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _rt_latest(db: Session) -> list[dict]:
    from app.simulation.rt import estimate_rt, trend_of

    out = []
    for ds in db.scalars(select(CaseDataset)):
        recs = list(db.scalars(select(CaseRecord).where(CaseRecord.dataset_id == ds.id)))
        counts, start = daily_counts(recs)
        preset = db.scalars(
            select(DiseasePreset)
            .where(DiseasePreset.disease == ds.disease)
            .order_by(DiseasePreset.is_builtin.desc())
        ).first()
        if not preset:
            continue
        pts = estimate_rt(
            counts, {"mean": preset.serial_interval_mean, "sd": preset.serial_interval_sd}, window=7
        )
        latest = next((p for p in reversed(pts) if p.get("rt") is not None), None)
        out.append(
            {
                "datasetId": ds.id,
                "name": ds.name,
                "disease": ds.disease,
                "illustrative": ds.illustrative,
                "status": quality(recs)[0],
                "latest": latest,
                "trend": trend_of(latest) if latest else "not-enough-data",
                "counts": counts,
                "startDate": start,
            }
        )
    return out


def _run_brief(run: SimulationRun, db: Session) -> dict:
    res = db.get(SimulationResult, run.id) if run.status == "completed" else None
    return {
        "id": run.id,
        "scenarioId": run.scenario_id,
        "scenarioName": run.scenario.name,
        "status": run.status,
        "progress": run.progress,
        "queuedAt": run.queued_at,
        "requestedBy": run.requested_by.name,
        "modelType": run.model_type,
        "summary": run_summary_tiles(res),
    }


@router.get("/analyst")
def analyst_dashboard(db: Session = Depends(get_db), user: User = Depends(require("dashboard"))):
    if user.role != "analyst":
        raise forbid()
    week_ago = utcnow() - timedelta(days=7)
    scenarios = [s for s in db.scalars(select(Scenario)) if scenario_access(s, user)]
    runs = [
        r
        for r in db.scalars(select(SimulationRun).order_by(SimulationRun.queued_at.desc()))
        if r.requested_by_id == user.id or scenario_access(r.scenario, user)
    ]
    reports = list(
        db.scalars(select(Report).where(Report.audience == "policy").order_by(Report.updated_at.desc()))
    )
    presets = list(db.scalars(select(DiseasePreset).where(DiseasePreset.is_builtin.is_(True))))
    return {
        "label": ESTIMATE_LABEL,
        "counts": {
            "scenarios": len(scenarios),
            "myScenarios": sum(1 for s in scenarios if s.owner_id == user.id),
            "drafts": sum(1 for s in scenarios if s.draft and s.owner_id == user.id),
            "runsThisWeek": sum(1 for r in runs if r.queued_at >= week_ago),
            "runsActive": sum(1 for r in runs if r.status in ("queued", "running")),
            "runsCompleted": sum(1 for r in runs if r.status == "completed"),
            "reportsDraft": sum(1 for r in reports if r.status == "draft"),
            "reportsPending": sum(1 for r in reports if r.status == "pending_approval"),
            "reportsApproved": sum(1 for r in reports if r.status == "approved"),
        },
        "recentRuns": [_run_brief(r, db) for r in runs[:6]],
        "reports": [
            {
                "id": r.id,
                "title": r.title,
                "status": r.status,
                "disease": r.disease,
                "updated": r.updated_at,
                "author": r.author_name,
                "illustrative": r.illustrative,
            }
            for r in reports[:6]
        ],
        "parameterSets": [
            {
                "presetId": p.id,
                "disease": p.disease,
                "name": p.name,
                "version": p.version,
                "approvedBy": p.approved_by,
                "approvedOn": p.approved_on,
                "provisional": p.provisional,
            }
            for p in presets
        ],
        "rt": _rt_latest(db),
    }


@router.get("/officer")
def officer_dashboard(db: Session = Depends(get_db), user: User = Depends(require("dashboard"))):
    if user.role != "officer":
        raise forbid()
    h = db.get(Institution, user.institution_id) if user.institution_id else None
    if h is None:
        raise forbid("Your account is not linked to a hospital.")
    entries = list(
        db.scalars(
            select(HospitalEntry).where(HospitalEntry.hospital_id == h.id).order_by(HospitalEntry.date)
        )
    )
    instructions = list(db.scalars(select(Instruction).where(Instruction.hospital_id == h.id)))
    plans = list(db.scalars(select(ResponsePlan).where(ResponsePlan.hospital_id == h.id)))
    reports = list(
        db.scalars(
            select(Report)
            .where(Report.audience == "hospital", Report.hospital_id == h.id, Report.status == "approved")
            .order_by(Report.updated_at.desc())
        )
    )
    latest = {}
    for e in entries:
        latest[e.disease] = e
    return {
        "hospital": {"id": h.id, "name": h.name, "district": h.district, "isolationBeds": h.isolation_beds},
        "latest": {
            d: {
                "date": e.date,
                "confirmed": e.confirmed,
                "inIsolation": e.in_isolation,
                "bedsTotal": e.beds_total,
                "bedsOccupied": e.beds_occupied,
                "ppeStock": e.ppe_stock,
                "hcwInfected": e.hcw_infected,
                "illustrative": e.illustrative,
            }
            for d, e in latest.items()
        },
        "bedSeries": [
            {"date": e.date, "disease": e.disease, "bedsOccupied": e.beds_occupied, "bedsTotal": e.beds_total}
            for e in entries
        ],
        "instructions": {
            s: sum(1 for i in instructions if i.status == s)
            for s in ("Not started", "In progress", "Done", "Can't do")
        },
        "openInstructions": [
            {"id": i.id, "action": i.action, "deadline": i.deadline, "status": i.status}
            for i in sorted(instructions, key=lambda i: i.deadline)
            if i.status not in ("Done",)
        ][:5],
        "plans": {
            "active": sum(1 for p in plans if p.status == "Active"),
            "draft": sum(1 for p in plans if p.status == "Draft"),
        },
        "reports": [
            {"id": r.id, "title": r.title, "updated": r.updated_at, "illustrative": r.illustrative}
            for r in reports[:3]
        ],
        "illustrative": any(e.illustrative for e in entries),
    }


@router.get("/policymaker")
def policy_dashboard(db: Session = Depends(get_db), user: User = Depends(require("dashboard"))):
    if user.role != "policymaker":
        raise forbid()
    reports = list(
        db.scalars(
            select(Report)
            .where(Report.audience == "policy", Report.status == "approved")
            .order_by(Report.approved_on.desc())
        )
    )
    approvals = list(db.scalars(select(ScenarioApproval).order_by(ScenarioApproval.approved_on.desc())))
    alerts = list(db.scalars(select(PolicyAlert).order_by(PolicyAlert.date.desc())))
    return {
        "label": ESTIMATE_LABEL,
        "approvedReports": [
            {
                "id": r.id,
                "title": r.title,
                "disease": r.disease,
                "approvedBy": r.approved_by,
                "approvedOn": r.approved_on,
                "summary": r.summary,
                "illustrative": r.illustrative,
            }
            for r in reports[:5]
        ],
        "approvedScenarios": [
            {
                "id": a.id,
                "name": a.name,
                "disease": a.disease,
                "runId": a.run_id,
                "approvedOn": a.approved_on,
                "illustrative": a.illustrative,
            }
            for a in approvals[:5]
        ],
        "alerts": [
            {
                "id": a.id,
                "level": a.level,
                "title": a.title,
                "detail": a.detail,
                "date": a.date,
                "illustrative": a.illustrative,
            }
            for a in alerts
        ],
        "rt": _rt_latest(db),
    }
