"""The Scenario Builder: CRUD, clone, share, drafts, pinned dataset version; scenario approval (Module 13)."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.rbac import has_level
from app.db import get_db
from app.deps import current_user, forbid, require, require_any
from app.models import (
    DatasetVersion,
    DiseasePreset,
    Institution,
    InterventionPackage,
    PopulationDataset,
    Scenario,
    ScenarioApproval,
    ScenarioShare,
    SimulationRun,
    User,
)
from app.models.common import new_id, utcnow
from app.schemas.base import CamelModel
from app.services.access import scenario_access
from app.services.audit import audit
from app.services.ids import next_code

router = APIRouter(prefix="/api", tags=["scenarios"])


class ShareIn(CamelModel):
    kind: str = Field(pattern="^(user|institution)$")
    target_id: str
    permission: str = Field(pattern="^(view|clone)$")


class ShareOut(ShareIn):
    id: str
    target: str


class ScenarioIn(CamelModel):
    name: str = ""
    description: str = ""
    dataset_id: str | None = None
    preset_id: str | None = None
    package_id: str | None = None
    capacity_profile_id: str | None = None
    visibility: str = Field("private", pattern="^(private|institution)$")
    draft: bool = False


class LastRun(CamelModel):
    id: str
    status: str
    started_at: datetime | None
    queued_at: datetime


class ScenarioOut(CamelModel):
    id: str
    name: str
    description: str
    dataset_id: str | None
    dataset_version: int | None
    dataset_name: str | None
    dataset_latest_version: int | None
    population: int | None
    district_codes: list[str]
    preset_id: str | None
    preset_name: str | None
    disease: str | None
    preset_provisional: bool | None
    package_id: str | None
    package_name: str | None
    capacity_profile_id: str | None
    owner_id: str
    owner: str
    owner_institution_id: str | None
    owner_institution: str | None
    created: datetime
    updated: datetime
    draft: bool
    visibility: str
    shares: list[ShareOut]
    access: str | None
    illustrative: bool
    run_count: int
    last_run: LastRun | None
    approved: bool


def scenario_out(db: Session, s: Scenario, user: User) -> ScenarioOut:
    ds = db.get(PopulationDataset, s.dataset_id) if s.dataset_id else None
    version = None
    if ds:
        version = db.scalar(
            select(DatasetVersion).where(
                DatasetVersion.dataset_id == ds.id,
                DatasetVersion.version == (s.dataset_version or ds.latest.version),
            )
        )
    preset = db.get(DiseasePreset, s.preset_id) if s.preset_id else None
    pkg = db.get(InterventionPackage, s.package_id) if s.package_id else None
    runs = db.scalars(
        select(SimulationRun)
        .where(SimulationRun.scenario_id == s.id)
        .order_by(SimulationRun.queued_at.desc())
    ).all()
    shares = []
    for sh in s.shares:
        target = db.get(User, sh.target_id) if sh.kind == "user" else db.get(Institution, sh.target_id)
        shares.append(
            ShareOut(
                id=sh.id,
                kind=sh.kind,
                target_id=sh.target_id,
                permission=sh.permission,
                target=target.name if target else sh.target_id,
            )
        )
    institution_shared = any(
        sh.kind == "institution" and sh.target_id == s.owner_institution_id for sh in s.shares
    )
    approved = db.scalar(select(ScenarioApproval.id).where(ScenarioApproval.scenario_id == s.id)) is not None
    return ScenarioOut(
        id=s.id,
        name=s.name,
        description=s.description,
        dataset_id=s.dataset_id,
        dataset_version=s.dataset_version,
        dataset_name=ds.name if ds else None,
        dataset_latest_version=ds.latest.version if ds and ds.latest else None,
        population=version.population if version else None,
        district_codes=[r.district_code for r in version.districts] if version else [],
        preset_id=s.preset_id,
        preset_name=preset.name if preset else None,
        disease=preset.disease if preset else None,
        preset_provisional=preset.provisional if preset else None,
        package_id=s.package_id,
        package_name=pkg.name if pkg else None,
        capacity_profile_id=s.capacity_profile_id,
        owner_id=s.owner_id,
        owner=s.owner.name,
        owner_institution_id=s.owner_institution_id,
        owner_institution=s.owner_institution.name if s.owner_institution else None,
        created=s.created_at,
        updated=s.updated_at,
        draft=s.draft,
        visibility="institution" if institution_shared else "private",
        shares=shares,
        access=scenario_access(s, user),
        illustrative=s.illustrative,
        run_count=len(runs),
        last_run=LastRun(
            id=runs[0].id, status=runs[0].status, started_at=runs[0].started_at, queued_at=runs[0].queued_at
        )
        if runs
        else None,
        approved=approved,
    )


def get_scenario_for(db: Session, scenario_id: str, user: User) -> tuple[Scenario, str]:
    s = db.get(Scenario, scenario_id)
    access = scenario_access(s, user) if s else None
    if s is None or access is None:
        raise HTTPException(404, "Scenario not found, or it has not been shared with you.")
    return s, access


def _check_refs(db: Session, body: ScenarioIn) -> int | None:
    if not body.draft:
        missing = [
            label
            for label, v in (
                ("a name", body.name.strip()),
                ("a population dataset", body.dataset_id),
                ("a disease preset", body.preset_id),
            )
            if not v
        ]
        if missing:
            raise HTTPException(
                422, "To save the scenario, choose " + ", ".join(missing) + ". Or save it as a draft."
            )
    version = None
    if body.dataset_id:
        ds = db.get(PopulationDataset, body.dataset_id)
        if ds is None or ds.latest is None:
            raise HTTPException(422, "Unknown population dataset.")
        version = ds.latest.version
    if body.preset_id and db.get(DiseasePreset, body.preset_id) is None:
        raise HTTPException(422, "Unknown disease preset.")
    if body.package_id and db.get(InterventionPackage, body.package_id) is None:
        raise HTTPException(422, "Unknown intervention package.")
    return version


def _set_visibility(s: Scenario, visibility: str):
    inst = s.owner_institution_id
    others = [sh for sh in s.shares if not (sh.kind == "institution" and sh.target_id == inst)]
    if visibility == "institution" and inst:
        existing = next((sh for sh in s.shares if sh.kind == "institution" and sh.target_id == inst), None)
        others.append(
            existing
            or ScenarioShare(id=new_id("sh-"), kind="institution", target_id=inst, permission="clone")
        )
    s.shares = others


reader = require_any(["scenarios", "scenario"])
writer = require("scenarios", "write")


@router.get("/scenarios", response_model=list[ScenarioOut])
def list_scenarios(
    tab: str | None = None, db: Session = Depends(get_db), user: User = Depends(require("scenarios"))
):
    """Scenarios the user may see. tab=mine (own) or tab=shared (shared with them); default both."""
    out = []
    for s in db.scalars(select(Scenario).order_by(Scenario.created_at.desc())):
        access = scenario_access(s, user)
        if access is None:
            continue
        if tab == "mine" and s.owner_id != user.id:
            continue
        if tab == "shared" and s.owner_id == user.id:
            continue
        out.append(scenario_out(db, s, user))
    return out


@router.get("/scenarios/share-targets")
def share_targets(db: Session = Depends(get_db), user: User = Depends(require("scenarios"))):
    users = db.scalars(
        select(User)
        .where(User.status == "Active", User.role != "admin", User.id != user.id)
        .order_by(User.name)
    )
    insts = db.scalars(select(Institution).order_by(Institution.name))
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "role": u.role,
                "institution": u.institution.name if u.institution else None,
            }
            for u in users
        ],
        "institutions": [{"id": i.id, "name": i.name, "kind": i.kind} for i in insts],
    }


@router.get("/scenarios/{scenario_id}", response_model=ScenarioOut)
def get_scenario(scenario_id: str, db: Session = Depends(get_db), user: User = Depends(require("scenarios"))):
    s, _ = get_scenario_for(db, scenario_id, user)
    return scenario_out(db, s, user)


@router.post("/scenarios", response_model=ScenarioOut, status_code=201)
def create_scenario(body: ScenarioIn, db: Session = Depends(get_db), user: User = Depends(writer)):
    version = _check_refs(db, body)
    s = Scenario(
        id=next_code(db, Scenario, "SC-", 4, 1000),
        name=body.name.strip() or "Untitled scenario",
        description=body.description,
        dataset_id=body.dataset_id,
        dataset_version=version,
        preset_id=body.preset_id,
        package_id=body.package_id,
        capacity_profile_id=body.capacity_profile_id,
        owner_id=user.id,
        owner_institution_id=user.institution_id,
        draft=body.draft,
    )
    s.owner = user
    s.shares = []
    _set_visibility(s, body.visibility)
    db.add(s)
    audit(db, user, "Scenario saved" if not body.draft else "Scenario draft saved", s.name, s.id)
    db.commit()
    return scenario_out(db, s, user)


@router.put("/scenarios/{scenario_id}", response_model=ScenarioOut)
def update_scenario(
    scenario_id: str, body: ScenarioIn, db: Session = Depends(get_db), user: User = Depends(writer)
):
    """Drafts can change freely. A saved scenario keeps its inputs (runs refer to them): only name,
    description, visibility and suggested capacity profile change; clone it to change the rest."""
    s, access = get_scenario_for(db, scenario_id, user)
    if access not in ("owner", "admin"):
        raise forbid("Only the owner can edit this scenario. Clone it to make your own copy.")
    if not s.draft:
        if (body.dataset_id, body.preset_id, body.package_id) != (s.dataset_id, s.preset_id, s.package_id):
            raise HTTPException(
                409,
                "Saved scenarios keep their inputs so past runs stay reproducible. Clone it to change them.",
            )
        if body.draft:
            raise HTTPException(409, "A saved scenario cannot go back to being a draft.")
    version = _check_refs(db, body)
    if s.draft:
        s.dataset_id, s.preset_id, s.package_id = body.dataset_id, body.preset_id, body.package_id
        s.dataset_version = version
        s.draft = body.draft
    s.name = body.name.strip() or s.name
    s.description = body.description
    s.capacity_profile_id = body.capacity_profile_id
    _set_visibility(s, body.visibility)
    s.updated_at = utcnow()
    audit(db, user, "Scenario saved" if not s.draft else "Scenario draft saved", s.name, s.id)
    db.commit()
    return scenario_out(db, s, user)


class CloneIn(CamelModel):
    name: str | None = None


@router.post("/scenarios/{scenario_id}/clone", response_model=ScenarioOut, status_code=201)
def clone_scenario(
    scenario_id: str,
    body: CloneIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("scenarios")),
):
    """Clone into an editable draft owned by the user. Needs owner, admin or 'clone' access.
    Policy makers (scenarios: review) may clone scenarios shared with clone permission."""
    s, access = get_scenario_for(db, scenario_id, user)
    if access not in ("owner", "admin", "clone"):
        raise forbid("This scenario was shared with you to view only.")
    copy = Scenario(
        id=next_code(db, Scenario, "SC-", 4, 1000),
        name=(body.name if body and body.name else f"{s.name} (copy)"),
        description=s.description,
        dataset_id=s.dataset_id,
        dataset_version=s.dataset_version,
        preset_id=s.preset_id,
        package_id=s.package_id,
        capacity_profile_id=s.capacity_profile_id,
        owner_id=user.id,
        owner_institution_id=user.institution_id,
        draft=True,
        cloned_from_id=s.id,
    )
    copy.owner = user
    copy.shares = []
    db.add(copy)
    audit(db, user, "Scenario cloned", copy.name, f"{s.id} → {copy.id}")
    db.commit()
    return scenario_out(db, copy, user)


class SharesIn(CamelModel):
    shares: list[ShareIn]


@router.put("/scenarios/{scenario_id}/shares", response_model=ScenarioOut)
def set_shares(scenario_id: str, body: SharesIn, db: Session = Depends(get_db), user: User = Depends(writer)):
    s, access = get_scenario_for(db, scenario_id, user)
    if access not in ("owner", "admin"):
        raise forbid("Only the owner can change who this scenario is shared with.")
    if s.draft and body.shares:
        raise HTTPException(409, "Save the scenario before sharing it.")
    new = []
    for sh in body.shares:
        target = db.get(User, sh.target_id) if sh.kind == "user" else db.get(Institution, sh.target_id)
        if target is None:
            raise HTTPException(422, f"Unknown share target {sh.target_id}.")
        existing = next((x for x in s.shares if x.kind == sh.kind and x.target_id == sh.target_id), None)
        if existing:
            existing.permission = sh.permission
            new.append(existing)
        else:
            new.append(
                ScenarioShare(
                    id=new_id("sh-"), kind=sh.kind, target_id=sh.target_id, permission=sh.permission
                )
            )
    s.shares = new
    audit(db, user, "Scenario shared", s.name, f"{len(new)} shares")
    db.commit()
    return scenario_out(db, s, user)


@router.delete("/scenarios/{scenario_id}", status_code=204)
def delete_scenario(scenario_id: str, db: Session = Depends(get_db), user: User = Depends(writer)):
    s, access = get_scenario_for(db, scenario_id, user)
    if access not in ("owner", "admin"):
        raise forbid("Only the owner can delete this scenario.")
    if db.scalar(select(SimulationRun.id).where(SimulationRun.scenario_id == s.id)):
        raise HTTPException(
            409,
            "This scenario has simulation runs, which reports and comparisons may use. It can’t be deleted.",
        )
    db.delete(s)
    audit(db, user, "Scenario deleted", s.name, s.id)
    db.commit()


# ── Approved scenarios (Module 13) ───────────────────────────────────


class ApproveScenarioIn(CamelModel):
    plan_summary: str = Field(min_length=1)
    run_id: str | None = None


class ApprovedScenarioOut(CamelModel):
    id: str
    scenario_id: str | None
    run_id: str | None
    name: str
    disease: str
    plan: str
    approved_by: str
    approved_on: datetime
    settings: dict
    illustrative: bool
    provisional: bool | None = None


@router.post("/scenarios/{scenario_id}/approve", response_model=ApprovedScenarioOut, status_code=201)
def approve_scenario(
    scenario_id: str,
    body: ApproveScenarioIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("scenario", "full")),
):
    s, _ = get_scenario_for(db, scenario_id, user)
    if s.draft:
        raise HTTPException(409, "Save the scenario before approving it.")
    q = select(SimulationRun).where(SimulationRun.scenario_id == s.id, SimulationRun.status == "completed")
    run = (
        db.get(SimulationRun, body.run_id)
        if body.run_id
        else db.scalars(q.order_by(SimulationRun.completed_at.desc())).first()
    )
    if run is None or run.scenario_id != s.id or run.status != "completed":
        raise HTTPException(
            409, "Run this scenario to completion before approving it, so policy makers see real results."
        )
    preset = db.get(DiseasePreset, s.preset_id)
    a = ScenarioApproval(
        id=next_code(db, ScenarioApproval, "APS-", 2),
        scenario_id=s.id,
        run_id=run.id,
        name=s.name,
        disease=preset.disease if preset else "",
        plan_summary=body.plan_summary,
        approved_by=user.name,
        settings={"package": s.package_id, "horizonDays": run.horizon_days},
    )
    db.add(a)
    audit(db, user, "Scenario approved", s.name, f"{a.id} using {run.id}")
    db.commit()
    return _approved_out(db, a)


def _approved_out(db: Session, a: ScenarioApproval) -> ApprovedScenarioOut:
    provisional = None
    if a.run_id:
        run = db.get(SimulationRun, a.run_id)
        provisional = (run.inputs_snapshot.get("disease") or {}).get("provisional") if run else None
    return ApprovedScenarioOut(
        id=a.id,
        scenario_id=a.scenario_id,
        run_id=a.run_id,
        name=a.name,
        disease=a.disease,
        plan=a.plan_summary,
        approved_by=a.approved_by,
        approved_on=a.approved_on,
        settings=a.settings,
        illustrative=a.illustrative,
        provisional=provisional,
    )


@router.get("/approved-scenarios", response_model=list[ApprovedScenarioOut])
def approved_scenarios(db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not (has_level(user.role, "scenario") or has_level(user.role, "dashboard")) or user.role == "admin":
        raise forbid()
    rows = db.scalars(select(ScenarioApproval).order_by(ScenarioApproval.approved_on.desc()))
    return [_approved_out(db, a) for a in rows]
