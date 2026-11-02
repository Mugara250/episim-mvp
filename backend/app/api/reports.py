"""Module 13 — Reporting and approval."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import ESTIMATE_SENTENCE, get_settings
from app.db import get_db
from app.deps import forbid, require
from app.models import CapacityProfile, Report, ReportExport, SimulationResult, SimulationRun, User
from app.models.common import new_id, utcnow
from app.schemas.base import CamelModel
from app.services.access import scenario_access
from app.services.audit import audit
from app.services.capacity import beds_for
from app.services.ids import next_code
from app.services.numbers import half_up
from app.services.numbers import pct as pct_text
from app.services.pdf import render_report
from app.services.results import run_district_codes

router = APIRouter(prefix="/api/reports", tags=["reports"])

TYPES = "^(scenario_brief|intervention_impact|capacity_review|weekly_situation)$"


class Figure(CamelModel):
    label: str
    value: str = ""
    range: str = ""


class ReportIn(CamelModel):
    title: str = Field(min_length=1)
    report_type: str = Field("scenario_brief", pattern=TYPES)
    audience: str = Field("policy", pattern="^(policy|hospital)$")
    disease: str = ""
    simulation_run_id: str | None = None
    scenario_comparison_id: str | None = None
    hospital_id: str | None = None
    capacity_profile_id: str | None = None
    period: str | None = None
    summary: str = ""
    key_points: list[str] = []
    recommendations: list[str] = []
    figures: list[Figure] = []


class ExportOut(CamelModel):
    id: str
    report_id: str
    format: str
    status: str
    size_bytes: int | None
    error_message: str | None
    requested_by: str
    created_at: datetime
    generated_at: datetime | None
    download_url: str | None


class ReportOut(CamelModel):
    id: str
    title: str
    report_type: str
    audience: str
    disease: str
    simulation_run_id: str | None
    scenario_comparison_id: str | None
    scenario_ref: str | None
    hospital_id: str | None
    period: str | None
    summary: str
    key_points: list
    recommendations: list
    figures: list
    status: str
    author_id: str | None
    author: str
    approved_by: str | None
    approved_on: datetime | None
    updated: datetime
    illustrative: bool
    provisional: bool | None
    estimate_note: str = ESTIMATE_SENTENCE
    exports: list[ExportOut] = []


def _export_out(e: ReportExport) -> ExportOut:
    return ExportOut(
        id=e.id,
        report_id=e.report_id,
        format=e.format,
        status=e.status,
        size_bytes=e.size_bytes,
        error_message=e.error_message,
        requested_by=e.requested_by,
        created_at=e.created_at,
        generated_at=e.generated_at,
        download_url=f"/api/reports/{e.report_id}/exports/{e.id}/download"
        if e.status == "completed"
        else None,
    )


def _out(db: Session, r: Report) -> ReportOut:
    run = db.get(SimulationRun, r.simulation_run_id) if r.simulation_run_id else None
    exports = db.scalars(
        select(ReportExport).where(ReportExport.report_id == r.id).order_by(ReportExport.created_at.desc())
    )
    return ReportOut(
        id=r.id,
        title=r.title,
        report_type=r.report_type,
        audience=r.audience,
        disease=r.disease,
        simulation_run_id=r.simulation_run_id,
        scenario_comparison_id=r.scenario_comparison_id,
        scenario_ref=r.scenario_ref,
        hospital_id=r.hospital_id,
        period=r.period,
        summary=r.summary,
        key_points=r.key_points,
        recommendations=r.recommendations,
        figures=r.figures,
        status=r.status,
        author_id=r.author_id,
        author=r.author_name,
        approved_by=r.approved_by,
        approved_on=r.approved_on,
        updated=r.updated_at,
        illustrative=r.illustrative,
        provisional=(run.inputs_snapshot.get("disease") or {}).get("provisional") if run else None,
        exports=[_export_out(e) for e in exports],
    )


def can_see(r: Report, user: User) -> bool:
    if user.role == "analyst":
        return True
    if user.role == "policymaker":
        return r.status == "approved" and r.audience == "policy"
    if user.role == "officer":
        return r.status == "approved" and r.audience == "hospital" and r.hospital_id == user.institution_id
    return False


def _visible(db: Session, rid: str, user: User) -> Report:
    r = db.get(Report, rid)
    if r is None or not can_see(r, user):
        raise HTTPException(404, "Report not found.")
    return r


def _fmt(block: dict | None, pct=False) -> tuple[str, str]:
    if not block or block.get("median") is None:
        return "—", ""
    f = (lambda v: pct_text(v)) if pct else (lambda v: f"{half_up(v):,}")
    return f(block["median"]), f"{f(block['low'])} to {f(block['high'])} (5–95% of runs)"


def figures_from_run(db: Session, run: SimulationRun, profile: CapacityProfile | None) -> list[dict]:
    res = db.get(SimulationResult, run.id)
    if res is None:
        return []
    s = res.summary or {}
    figs = [
        {
            "label": "Chance the outbreak takes off",
            "value": f"{pct_text(res.p_take_off or 0)}",
            "range": "share of runs",
        }
    ]
    for label, key, pct in (
        ("Total cases", "final_cases", False),
        ("Deaths", "final_deaths", False),
        ("Peak beds needed", "peak_beds", False),
        ("Health-worker share", "hcw_share", True),
    ):
        v, r = _fmt(s.get(key), pct)
        figs.append({"label": label, "value": v, "range": r})
    if profile:
        beds = beds_for(profile, run_district_codes(run))
        share = sum(1 for p in res.run_peaks or [] if p > beds) / max(1, len(res.run_peaks or []))
        figs.append(
            {
                "label": f"Chance beds run out ({beds} beds, {profile.name})",
                "value": pct_text(share),
                "range": "share of runs",
            }
        )
    return figs


@router.get("", response_model=list[ReportOut])
def list_reports(
    status: str | None = None, db: Session = Depends(get_db), user: User = Depends(require("reports"))
):
    q = select(Report).order_by(Report.updated_at.desc())
    if status:
        q = q.where(Report.status.in_(status.split(",")))
    return [_out(db, r) for r in db.scalars(q) if can_see(r, user)]


@router.get("/{rid}", response_model=ReportOut)
def get_report(rid: str, db: Session = Depends(get_db), user: User = Depends(require("reports"))):
    return _out(db, _visible(db, rid, user))


def _apply(db: Session, r: Report, body: ReportIn, user: User):
    run = None
    if body.simulation_run_id:
        run = db.get(SimulationRun, body.simulation_run_id)
        if run is None or not (run.requested_by_id == user.id or scenario_access(run.scenario, user)):
            raise HTTPException(422, "Unknown simulation run.")
        if run.status != "completed":
            raise HTTPException(409, "Reports can only link to completed runs.")
    if body.audience == "hospital" and not body.hospital_id:
        raise HTTPException(422, "Hospital reports need a hospital.")
    for f in (
        "title",
        "report_type",
        "audience",
        "disease",
        "simulation_run_id",
        "scenario_comparison_id",
        "hospital_id",
        "period",
        "summary",
        "key_points",
        "recommendations",
    ):
        setattr(r, f, getattr(body, f))
    figures = [f.model_dump() for f in body.figures]
    if run is not None and not figures:
        profile = db.get(CapacityProfile, body.capacity_profile_id) if body.capacity_profile_id else None
        figures = figures_from_run(db, run, profile)
    if run is not None and not r.disease:
        r.disease = (run.inputs_snapshot.get("disease") or {}).get("key", "")
    r.figures = figures
    r.updated_at = utcnow()


@router.post("", response_model=ReportOut, status_code=201)
def create_report(
    body: ReportIn, db: Session = Depends(get_db), user: User = Depends(require("reports", "full"))
):
    """Create a draft. With simulationRunId and no figures, figures are filled from the run's results."""
    r = Report(
        id=next_code(db, Report, "RPT-", 3, 1), title=body.title, author_id=user.id, author_name=user.name
    )
    _apply(db, r, body, user)
    db.add(r)
    audit(db, user, "Report drafted", r.title, r.id)
    db.commit()
    return _out(db, r)


@router.put("/{rid}", response_model=ReportOut)
def update_report(
    rid: str, body: ReportIn, db: Session = Depends(get_db), user: User = Depends(require("reports", "full"))
):
    r = _visible(db, rid, user)
    if r.status == "approved":
        raise HTTPException(409, "Approved reports are locked. Create a new draft instead.")
    _apply(db, r, body, user)
    r.status = "draft"
    audit(db, user, "Report edited", r.title, r.id)
    db.commit()
    return _out(db, r)


@router.post("/{rid}/submit", response_model=ReportOut)
def submit_report(rid: str, db: Session = Depends(get_db), user: User = Depends(require("reports", "full"))):
    r = _visible(db, rid, user)
    if r.status != "draft":
        raise HTTPException(409, "Only drafts can be submitted for approval.")
    r.status = "pending_approval"
    r.updated_at = utcnow()
    audit(db, user, "Report submitted", r.title, r.id)
    db.commit()
    return _out(db, r)


@router.post("/{rid}/return", response_model=ReportOut)
def return_report(rid: str, db: Session = Depends(get_db), user: User = Depends(require("reports", "full"))):
    """Send a pending report back to draft."""
    r = _visible(db, rid, user)
    if r.status != "pending_approval":
        raise HTTPException(409, "Only reports waiting for approval can be returned.")
    r.status = "draft"
    r.updated_at = utcnow()
    audit(db, user, "Report returned to draft", r.title, r.id)
    db.commit()
    return _out(db, r)


@router.post("/{rid}/approve", response_model=ReportOut)
def approve_report(rid: str, db: Session = Depends(get_db), user: User = Depends(require("reports", "full"))):
    """Pending approval → Approved. The approver must not be the author (docs D10)."""
    r = _visible(db, rid, user)
    if r.status != "pending_approval":
        raise HTTPException(409, "Submit the report for approval first.")
    if get_settings().require_distinct_approver and r.author_id == user.id:
        raise HTTPException(403, "A report must be approved by someone other than its author.")
    r.status = "approved"
    r.approved_by_id, r.approved_by, r.approved_on = user.id, user.name, utcnow()
    r.updated_at = utcnow()
    audit(db, user, "Report approved", r.title, r.id)
    db.commit()
    return _out(db, r)


@router.delete("/{rid}", status_code=204)
def delete_report(rid: str, db: Session = Depends(get_db), user: User = Depends(require("reports", "full"))):
    r = _visible(db, rid, user)
    if r.status == "approved":
        raise HTTPException(409, "Approved reports cannot be deleted.")
    if r.author_id != user.id:
        raise forbid("Only the author can delete a draft.")
    for e in db.scalars(select(ReportExport).where(ReportExport.report_id == r.id)):
        db.delete(e)
    db.delete(r)
    audit(db, user, "Report deleted", r.title, r.id)
    db.commit()


class ExportIn(CamelModel):
    format: str = Field("pdf", pattern="^pdf$")
    capacity_profile_id: str | None = None


@router.post("/{rid}/exports", response_model=ExportOut, status_code=201)
def export_report(
    rid: str,
    body: ExportIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("reports")),
):
    """Generates a PDF now (seconds) and records it. Only PDF in the MVP."""
    r = _visible(db, rid, user)
    e = ReportExport(
        id=new_id("EXP-"), report_id=r.id, format="pdf", status="generating", requested_by=user.name
    )
    db.add(e)
    db.commit()
    run = db.get(SimulationRun, r.simulation_run_id) if r.simulation_run_id else None
    res = db.get(SimulationResult, run.id) if run else None
    profile_id = (body.capacity_profile_id if body else None) or (
        run.scenario.capacity_profile_id if run else None
    )
    profile = db.get(CapacityProfile, profile_id) if profile_id else None
    beds = beds_for(profile, run_district_codes(run)) if profile and run else None
    try:
        pdf = render_report(r, run, res, beds)
        folder = get_settings().files_path / "reports"
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / f"{e.id}.pdf"
        path.write_bytes(pdf)
        e.file_key, e.size_bytes, e.status, e.generated_at = str(path), len(pdf), "completed", utcnow()
    except Exception as exc:  # noqa: BLE001
        e.status, e.error_message = "failed", f"The PDF could not be generated: {exc}"
    audit(db, user, "Report exported", r.title, f"{r.id} PDF {e.status}")
    db.commit()
    return _export_out(e)


@router.get("/{rid}/exports", response_model=list[ExportOut])
def list_exports(rid: str, db: Session = Depends(get_db), user: User = Depends(require("reports"))):
    r = _visible(db, rid, user)
    return [_export_out(e) for e in db.scalars(select(ReportExport).where(ReportExport.report_id == r.id))]


@router.get("/{rid}/exports/{export_id}/download")
def download_export(
    rid: str, export_id: str, db: Session = Depends(get_db), user: User = Depends(require("reports"))
):
    r = _visible(db, rid, user)
    e = db.get(ReportExport, export_id)
    if e is None or e.report_id != r.id or e.status != "completed" or not e.file_key:
        raise HTTPException(404, "Export not found.")
    safe = "".join(c if c.isalnum() or c in " -_" else "_" for c in r.title)[:80].strip() or r.id
    return FileResponse(e.file_key, media_type="application/pdf", filename=f"{r.id} {safe}.pdf")
