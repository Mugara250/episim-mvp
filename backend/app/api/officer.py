"""Module 17 — Hospital data and response operations (Public Health Officer, own hospital only)."""

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import forbid, require
from app.models import HospitalEntry, Institution, Instruction, ResponsePlan, User
from app.models.common import new_id, utcnow
from app.schemas.base import CamelModel
from app.services.audit import audit
from app.services.ids import next_code

router = APIRouter(prefix="/api/hospital", tags=["hospital-operations"])


def own_hospital(user: User, db: Session) -> Institution:
    inst = db.get(Institution, user.institution_id) if user.institution_id else None
    if inst is None or not inst.is_hospital:
        raise forbid("Your account is not linked to a hospital. Ask an administrator to set it.")
    return inst


class EntryIn(CamelModel):
    date: date
    disease: str = Field(pattern="^(Ebola|Marburg)$")
    suspected: int = Field(0, ge=0)
    confirmed: int = Field(0, ge=0)
    in_isolation: int = Field(0, ge=0)
    recovered: int = Field(0, ge=0)
    deaths: int = Field(0, ge=0)
    hcw_infected: int = Field(0, ge=0)
    beds_total: int = Field(0, ge=0)
    beds_occupied: int = Field(0, ge=0)
    ppe_stock: str = Field("Good", pattern="^(Good|Low|Critical)$")
    trained_staff: int = Field(0, ge=0)
    burial_team_ready: bool = True
    contacts_follow_up: int = Field(0, ge=0)


class EntryOut(EntryIn):
    id: str
    hospital_id: str
    entered_by: str | None
    illustrative: bool


class HospitalOut(CamelModel):
    id: str
    name: str
    district: str | None
    province: str | None
    isolation_beds: int | None
    today: date


@router.get("/me", response_model=HospitalOut)
def my_hospital(db: Session = Depends(get_db), user: User = Depends(require("healthcare"))):
    from app.services.geo_data import district_by_name

    h = own_hospital(user, db)
    prov = district_by_name().get((h.district or "").lower(), {}).get("province")
    return HospitalOut(
        id=h.id,
        name=h.name,
        district=h.district,
        province=prov,
        isolation_beds=h.isolation_beds,
        today=date.today(),
    )


@router.get("/entries", response_model=list[EntryOut])
def list_entries(
    disease: str | None = None, db: Session = Depends(get_db), user: User = Depends(require("healthcare"))
):
    h = own_hospital(user, db)
    q = select(HospitalEntry).where(HospitalEntry.hospital_id == h.id).order_by(HospitalEntry.date)
    if disease:
        q = q.where(HospitalEntry.disease == disease)
    return [EntryOut.model_validate(e) for e in db.scalars(q)]


@router.post("/entries", response_model=EntryOut, status_code=201)
def add_entry(
    body: EntryIn, db: Session = Depends(get_db), user: User = Depends(require("healthcare", "write"))
):
    """One day of counts for one disease. Counts only — never patient details. Replaces that day's entry."""
    h = own_hospital(user, db)
    if body.beds_occupied > body.beds_total:
        raise HTTPException(422, "Occupied beds cannot exceed total beds.")
    existing = db.scalar(
        select(HospitalEntry).where(
            HospitalEntry.hospital_id == h.id,
            HospitalEntry.date == body.date,
            HospitalEntry.disease == body.disease,
        )
    )
    e = existing or HospitalEntry(id=new_id("e-"), hospital_id=h.id)
    for k, v in body.model_dump().items():
        setattr(e, k, v)
    e.entered_by, e.illustrative = user.name, False
    if existing is None:
        db.add(e)
    audit(
        db, user, "Hospital data entered", h.name, f"{body.date} {body.disease}: {body.confirmed} confirmed"
    )
    db.commit()
    return EntryOut.model_validate(e)


class InstructionOut(CamelModel):
    id: str
    hospital_id: str
    action: str
    target: str
    deadline: date
    from_name: str
    disease: str
    received: date
    status: str
    reason: str | None
    illustrative: bool


class InstructionStatusIn(CamelModel):
    status: str = Field(pattern="^(Not started|In progress|Done|Can't do)$")
    reason: str | None = None


class InstructionIn(CamelModel):
    hospital_id: str
    action: str = Field(min_length=1)
    target: str = ""
    deadline: date
    disease: str = Field(pattern="^(Ebola|Marburg)$")


@router.get("/instructions", response_model=list[InstructionOut])
def list_instructions(db: Session = Depends(get_db), user: User = Depends(require("instructions"))):
    h = own_hospital(user, db)
    rows = db.scalars(
        select(Instruction).where(Instruction.hospital_id == h.id).order_by(Instruction.deadline)
    )
    return [InstructionOut.model_validate(i) for i in rows]


@router.put("/instructions/{iid}/status", response_model=InstructionOut)
def set_instruction_status(
    iid: str,
    body: InstructionStatusIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("instructions", "write")),
):
    h = own_hospital(user, db)
    i = db.get(Instruction, iid)
    if i is None or i.hospital_id != h.id:
        raise HTTPException(404, "Instruction not found.")
    if body.status == "Can't do" and not (body.reason or "").strip():
        raise HTTPException(422, "Say why this can't be done.")
    i.status, i.reason, i.updated_at = body.status, body.reason, utcnow()
    audit(db, user, "Instruction status changed", i.action, body.status)
    db.commit()
    return InstructionOut.model_validate(i)


@router.post("/instructions", response_model=InstructionOut, status_code=201, tags=["hospital-operations"])
def issue_instruction(
    body: InstructionIn, db: Session = Depends(get_db), user: User = Depends(require("reports", "full"))
):
    """Issue a response instruction to a hospital. Proposed for Epidemiologists (docs D9, open)."""
    h = db.get(Institution, body.hospital_id)
    if h is None or not h.is_hospital:
        raise HTTPException(422, "Unknown hospital.")
    i = Instruction(
        id=next_code(db, Instruction, "INS-", 3, 1),
        hospital_id=h.id,
        action=body.action,
        target=body.target,
        deadline=body.deadline,
        from_name=user.name,
        disease=body.disease,
        received=date.today(),
    )
    db.add(i)
    audit(db, user, "Instruction issued", h.name, i.action)
    db.commit()
    return InstructionOut.model_validate(i)


class PlanAction(CamelModel):
    name: str
    target: str = ""


class PlanIn(CamelModel):
    title: str = Field(min_length=1)
    disease: str = Field(pattern="^(Ebola|Marburg)$")
    status: str = Field("Draft", pattern="^(Draft|Active)$")
    start_date: date
    review_date: date
    actions: list[PlanAction] = []
    notes: str = ""


class PlanOut(PlanIn):
    id: str
    hospital_id: str
    updated: datetime
    illustrative: bool


def _plan_out(p: ResponsePlan) -> PlanOut:
    return PlanOut(
        id=p.id,
        hospital_id=p.hospital_id,
        title=p.title,
        disease=p.disease,
        status=p.status,
        start_date=p.start_date,
        review_date=p.review_date,
        actions=p.actions,
        notes=p.notes,
        updated=p.updated_at,
        illustrative=p.illustrative,
    )


@router.get("/plans", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db), user: User = Depends(require("interventions"))):
    if user.role != "officer":
        raise forbid("Local response plans belong to Public Health Officers.")
    h = own_hospital(user, db)
    return [_plan_out(p) for p in db.scalars(select(ResponsePlan).where(ResponsePlan.hospital_id == h.id))]


def _save_plan(p: ResponsePlan, body: PlanIn):
    if body.review_date < body.start_date:
        raise HTTPException(422, "The review date is before the start date.")
    for k in ("title", "disease", "status", "start_date", "review_date", "notes"):
        setattr(p, k, getattr(body, k))
    p.actions = [a.model_dump() for a in body.actions]
    p.updated_at = utcnow()
    p.illustrative = False


@router.post("/plans", response_model=PlanOut, status_code=201)
def create_plan(
    body: PlanIn, db: Session = Depends(get_db), user: User = Depends(require("interventions", "write"))
):
    if user.role != "officer":
        raise forbid("Local response plans belong to Public Health Officers.")
    h = own_hospital(user, db)
    p = ResponsePlan(id=next_code(db, ResponsePlan, "PLN-", 2, 1), hospital_id=h.id)
    _save_plan(p, body)
    db.add(p)
    audit(db, user, "Response plan saved", p.title, p.status)
    db.commit()
    return _plan_out(p)


@router.put("/plans/{pid}", response_model=PlanOut)
def update_plan(
    pid: str,
    body: PlanIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("interventions", "write")),
):
    h = own_hospital(user, db)
    p = db.get(ResponsePlan, pid)
    if p is None or p.hospital_id != h.id:
        raise HTTPException(404, "Plan not found.")
    _save_plan(p, body)
    audit(db, user, "Response plan saved", p.title, p.status)
    db.commit()
    return _plan_out(p)


@router.delete("/plans/{pid}", status_code=204)
def delete_plan(
    pid: str, db: Session = Depends(get_db), user: User = Depends(require("interventions", "write"))
):
    h = own_hospital(user, db)
    p = db.get(ResponsePlan, pid)
    if p is None or p.hospital_id != h.id:
        raise HTTPException(404, "Plan not found.")
    db.delete(p)
    audit(db, user, "Response plan deleted", p.title)
    db.commit()
