"""Module 10 — Healthcare capacity planning."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import current_user, forbid, require
from app.models import CapacityDistrictBeds, CapacityProfile, Institution, ScenarioComparison, User
from app.models.common import new_id, utcnow
from app.schemas.base import CamelModel
from app.services.audit import audit
from app.services.geo_data import district_by_code

router = APIRouter(prefix="/api", tags=["capacity"])


class DistrictBeds(CamelModel):
    district_code: str
    beds: int = Field(ge=0)


class CapacityIn(CamelModel):
    name: str = Field(min_length=1)
    institution_id: str
    hospital_beds: int = Field(ge=0)
    icu_beds: int = Field(0, ge=0)
    ventilators: int = Field(0, ge=0)
    health_workers: int = Field(0, ge=0)
    tests_per_day: int = Field(0, ge=0)
    vaccine_doses: int | None = Field(None, ge=0)
    source_note: str = ""
    district_beds: list[DistrictBeds] = []


class CapacityOut(CapacityIn):
    id: str
    institution_name: str
    updated: datetime
    updated_by: str | None
    placeholder: bool
    can_edit: bool = False


class ProfileComparisonOut(CamelModel):
    id: str
    name: str
    runs: int
    date: datetime
    profile_id: str


class CapacityOption(CamelModel):
    """Lightweight list for analysis-time selectors (comparison, geographic, results)."""

    id: str
    name: str
    institution_name: str
    hospital_beds: int
    has_district_beds: bool
    placeholder: bool


class InstitutionOut(CamelModel):
    id: str
    name: str
    kind: str


def _can_edit(user: User, p: CapacityProfile | None, institution_id: str | None = None) -> bool:
    if user.role == "admin":
        return True
    if user.role == "officer":
        inst = p.institution_id if p else institution_id
        return inst is not None and inst == user.institution_id
    return False


def _out(db: Session, p: CapacityProfile, user: User) -> CapacityOut:
    inst = db.get(Institution, p.institution_id)
    return CapacityOut(
        id=p.id,
        name=p.name,
        institution_id=p.institution_id,
        institution_name=inst.name if inst else "",
        hospital_beds=p.hospital_beds,
        icu_beds=p.icu_beds,
        ventilators=p.ventilators,
        health_workers=p.health_workers,
        tests_per_day=p.tests_per_day,
        vaccine_doses=p.vaccine_doses,
        source_note=p.source_note,
        updated=p.updated_at,
        updated_by=p.updated_by,
        placeholder=p.placeholder,
        district_beds=[DistrictBeds(district_code=r.district_code, beds=r.beds) for r in p.district_beds],
        can_edit=_can_edit(user, p),
    )


@router.get("/capacity-profiles", response_model=list[CapacityOut])
def list_profiles(db: Session = Depends(get_db), user: User = Depends(require("capacity"))):
    return [_out(db, p, user) for p in db.scalars(select(CapacityProfile).order_by(CapacityProfile.name))]


@router.get("/capacity-profiles/options", response_model=list[CapacityOption])
def profile_options(db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Read-only list for analysis screens. Epidemiologists have no access to the Capacity module itself
    (rbac.ts) but must pick a profile when analysing (docs D4/D7); see DECISIONS."""
    if user.role == "admin":
        raise forbid()
    out = []
    for p in db.scalars(select(CapacityProfile).order_by(CapacityProfile.name)):
        inst = db.get(Institution, p.institution_id)
        out.append(
            CapacityOption(
                id=p.id,
                name=p.name,
                institution_name=inst.name if inst else "",
                hospital_beds=p.hospital_beds,
                has_district_beds=bool(p.district_beds),
                placeholder=p.placeholder,
            )
        )
    return out


@router.get("/capacity-profiles/{profile_id}", response_model=CapacityOut)
def get_profile(profile_id: str, db: Session = Depends(get_db), user: User = Depends(require("capacity"))):
    p = db.get(CapacityProfile, profile_id)
    if p is None:
        raise HTTPException(404, "Capacity profile not found.")
    return _out(db, p, user)


@router.get("/capacity-profiles/{profile_id}/comparisons", response_model=list[ProfileComparisonOut])
def profile_comparisons(
    profile_id: str, db: Session = Depends(get_db), _: User = Depends(require("capacity"))
):
    rows = db.scalars(select(ScenarioComparison).where(ScenarioComparison.capacity_profile_id == profile_id))
    return [
        ProfileComparisonOut(
            id=c.id, name=c.name, runs=len(c.run_ids), date=c.created_at, profile_id=profile_id
        )
        for c in rows
    ]


@router.get("/institutions", response_model=list[InstitutionOut])
def list_institutions(db: Session = Depends(get_db), _: User = Depends(current_user)):
    return [
        InstitutionOut.model_validate(i) for i in db.scalars(select(Institution).order_by(Institution.name))
    ]


def _validate(db: Session, body: CapacityIn, own_id: str | None):
    if db.get(Institution, body.institution_id) is None:
        raise HTTPException(422, "Unknown institution.")
    clash = db.scalar(select(CapacityProfile).where(CapacityProfile.name == body.name.strip()))
    if clash and clash.id != own_id:
        raise HTTPException(409, "Another profile already has this name.")
    ref = district_by_code()
    for r in body.district_beds:
        if r.district_code not in ref:
            raise HTTPException(422, f"Unknown district code {r.district_code}.")


def _apply(p: CapacityProfile, body: CapacityIn, user: User):
    for k in (
        "institution_id",
        "hospital_beds",
        "icu_beds",
        "ventilators",
        "health_workers",
        "tests_per_day",
        "vaccine_doses",
        "source_note",
    ):
        setattr(p, k, getattr(body, k))
    p.name = body.name.strip()
    p.district_beds = [
        CapacityDistrictBeds(district_code=r.district_code, beds=r.beds) for r in body.district_beds
    ]
    p.updated_by = user.name
    p.updated_at = utcnow()


@router.post("/capacity-profiles", response_model=CapacityOut, status_code=201)
def create_profile(
    body: CapacityIn, db: Session = Depends(get_db), user: User = Depends(require("capacity", "write"))
):
    if not _can_edit(user, None, body.institution_id):
        raise forbid("Public Health Officers can only create profiles for their own institution.")
    _validate(db, body, None)
    p = CapacityProfile(
        id=new_id("cap-"), name=body.name, institution_id=body.institution_id, hospital_beds=0
    )
    _apply(p, body, user)
    db.add(p)
    audit(db, user, "Capacity profile created", p.name, f"{p.hospital_beds} beds")
    db.commit()
    return _out(db, p, user)


@router.put("/capacity-profiles/{profile_id}", response_model=CapacityOut)
def update_profile(
    profile_id: str,
    body: CapacityIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("capacity", "write")),
):
    p = db.get(CapacityProfile, profile_id)
    if p is None:
        raise HTTPException(404, "Capacity profile not found.")
    if not _can_edit(user, p) or not _can_edit(user, None, body.institution_id):
        raise forbid("You can only edit your own institution’s capacity profiles.")
    _validate(db, body, p.id)
    _apply(p, body, user)
    audit(db, user, "Capacity profile updated", p.name, f"{p.hospital_beds} beds")
    db.commit()
    return _out(db, p, user)


@router.delete("/capacity-profiles/{profile_id}", status_code=204)
def delete_profile(
    profile_id: str, db: Session = Depends(get_db), user: User = Depends(require("capacity", "write"))
):
    p = db.get(CapacityProfile, profile_id)
    if p is None:
        raise HTTPException(404, "Capacity profile not found.")
    if not _can_edit(user, p):
        raise forbid("You can only delete your own institution’s capacity profiles.")
    db.delete(p)
    audit(db, user, "Capacity profile deleted", p.name)
    db.commit()
