"""Module 8 — Intervention types and packages."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require, require_any
from app.models import InterventionItem, InterventionPackage, InterventionType, Scenario, User
from app.models.common import new_id, utcnow
from app.schemas.base import CamelModel
from app.services.audit import audit
from app.services.resolver import LEVERS

router = APIRouter(prefix="/api", tags=["interventions"])

# Reading the library: Epidemiologists (presets/interventions), officers (presets: read) and policy makers.
reader = require_any(["presets", "interventions", "scenarios"])
# rbac.ts maps /intervention-library to the 'presets' module.
writer = require("presets", "write")


class TypeIn(CamelModel):
    name: str = Field(min_length=1)
    key: str = Field(min_length=1, pattern=r"^[a-z0-9_]+$")
    description: str = ""
    mechanism: str = Field(pattern="^(rate|shift)$")
    engine_lever: str
    default_effect: float = Field(ge=0, le=1)
    source: str = ""


class TypeOut(TypeIn):
    id: str
    built_in: bool
    placeholder: bool
    created_by: str | None
    lever_description: str = ""


def _type_out(t: InterventionType) -> TypeOut:
    return TypeOut(
        id=t.id,
        name=t.name,
        key=t.key,
        description=t.description,
        mechanism=t.mechanism,
        engine_lever=t.engine_lever,
        default_effect=t.default_effect,
        source=t.source,
        built_in=t.is_builtin,
        placeholder=t.placeholder,
        created_by=t.created_by,
        lever_description=LEVERS.get(t.engine_lever, ""),
    )


@router.get("/intervention-levers")
def levers(_: User = Depends(reader)):
    return [{"lever": k, "description": v} for k, v in LEVERS.items()]


@router.get("/intervention-types", response_model=list[TypeOut])
def list_types(db: Session = Depends(get_db), _: User = Depends(reader)):
    return [
        _type_out(t)
        for t in db.scalars(
            select(InterventionType).order_by(InterventionType.is_builtin.desc(), InterventionType.name)
        )
    ]


def _validate_type(db: Session, body: TypeIn, own_id: str | None = None):
    if body.engine_lever not in LEVERS:
        raise HTTPException(422, f"Unknown model lever. Choose one of: {', '.join(LEVERS)}.")
    if (body.mechanism == "shift") != (body.engine_lever == "vaccination"):
        raise HTTPException(422, "Only the vaccination lever uses the compartment-shift mechanism.")
    clash = db.scalar(select(InterventionType).where(InterventionType.key == body.key))
    if clash and clash.id != own_id:
        raise HTTPException(409, "Another intervention type already uses this key.")


@router.post("/intervention-types", response_model=TypeOut, status_code=201)
def create_type(body: TypeIn, db: Session = Depends(get_db), user: User = Depends(writer)):
    _validate_type(db, body)
    t = InterventionType(
        id=new_id("type-"), is_builtin=False, placeholder=True, created_by=user.name, **body.model_dump()
    )
    db.add(t)
    audit(db, user, "Parameter change", t.name, "Intervention type created")
    db.commit()
    return _type_out(t)


@router.put("/intervention-types/{type_id}", response_model=TypeOut)
def update_type(type_id: str, body: TypeIn, db: Session = Depends(get_db), user: User = Depends(writer)):
    t = db.get(InterventionType, type_id)
    if t is None:
        raise HTTPException(404, "Intervention type not found.")
    if t.is_builtin and not user.can_edit_builtins:
        raise HTTPException(
            403, "Built-in intervention types are read-only. Clone it to make an editable copy."
        )
    _validate_type(db, body, t.id)
    for k, v in body.model_dump().items():
        setattr(t, k, v)
    audit(db, user, "Parameter change", t.name, "Intervention type edited")
    db.commit()
    return _type_out(t)


@router.post("/intervention-types/{type_id}/clone", response_model=TypeOut, status_code=201)
def clone_type(type_id: str, db: Session = Depends(get_db), user: User = Depends(writer)):
    src = db.get(InterventionType, type_id)
    if src is None:
        raise HTTPException(404, "Intervention type not found.")
    key = f"{src.key}_copy"
    n = 2
    while db.scalar(select(InterventionType).where(InterventionType.key == key)):
        key = f"{src.key}_copy{n}"
        n += 1
    t = InterventionType(
        id=new_id("type-"),
        key=key,
        name=f"{src.name} (copy)",
        description=src.description,
        mechanism=src.mechanism,
        engine_lever=src.engine_lever,
        default_effect=src.default_effect,
        source=src.source,
        placeholder=src.placeholder,
        is_builtin=False,
        created_by=user.name,
    )
    db.add(t)
    audit(db, user, "Parameter change", t.name, f"Cloned from {src.name}")
    db.commit()
    return _type_out(t)


class ItemIn(CamelModel):
    id: str | None = None
    type_id: str
    start_day: int = Field(ge=0, le=365)
    end_day: int | None = Field(None, ge=0, le=365)
    coverage: float = Field(ge=0, le=1)
    custom_effect: float | None = Field(None, ge=0, le=1)


class ItemOut(ItemIn):
    id: str
    effect: float
    type_name: str
    lever: str


class PackageIn(CamelModel):
    name: str = Field(min_length=1)
    description: str = ""
    items: list[ItemIn] = []


class PackageOut(CamelModel):
    id: str
    name: str
    description: str
    items: list[ItemOut]
    updated: datetime
    illustrative: bool
    created_by: str | None
    scenarios_using: int


def _package_out(db: Session, p: InterventionPackage) -> PackageOut:
    types = {t.id: t for t in db.scalars(select(InterventionType))}
    using = len(db.scalars(select(Scenario.id).where(Scenario.package_id == p.id)).all())
    items = []
    for it in p.items:
        t = types.get(it.type_id)
        items.append(
            ItemOut(
                id=it.id,
                type_id=it.type_id,
                start_day=it.start_day,
                end_day=it.end_day,
                coverage=it.coverage,
                custom_effect=it.custom_effect,
                effect=it.coverage
                * (it.custom_effect if it.custom_effect is not None else (t.default_effect if t else 0)),
                type_name=t.name if t else "Missing type",
                lever=t.engine_lever if t else "",
            )
        )
    return PackageOut(
        id=p.id,
        name=p.name,
        description=p.description,
        items=items,
        updated=p.updated_at,
        illustrative=p.illustrative,
        created_by=p.created_by,
        scenarios_using=using,
    )


def _set_items(db: Session, p: InterventionPackage, items: list[ItemIn]):
    for i, it in enumerate(items):
        if db.get(InterventionType, it.type_id) is None:
            raise HTTPException(422, f"Item {i + 1}: unknown intervention type.")
        if it.end_day is not None and it.end_day < it.start_day:
            raise HTTPException(422, f"Item {i + 1}: the end day is before the start day.")
    p.items = [
        InterventionItem(
            id=new_id("item-"),
            type_id=it.type_id,
            position=i,
            start_day=it.start_day,
            end_day=it.end_day,
            coverage=it.coverage,
            custom_effect=it.custom_effect,
        )
        for i, it in enumerate(items)
    ]


@router.get("/intervention-packages", response_model=list[PackageOut])
def list_packages(db: Session = Depends(get_db), _: User = Depends(reader)):
    return [
        _package_out(db, p)
        for p in db.scalars(select(InterventionPackage).order_by(InterventionPackage.name))
    ]


@router.get("/intervention-packages/{package_id}", response_model=PackageOut)
def get_package(package_id: str, db: Session = Depends(get_db), _: User = Depends(reader)):
    p = db.get(InterventionPackage, package_id)
    if p is None:
        raise HTTPException(404, "Package not found.")
    return _package_out(db, p)


# Officers hold interventions=full for local response plans, not the library (Layout routes).
pkg_writer = writer


@router.post("/intervention-packages", response_model=PackageOut, status_code=201)
def create_package(body: PackageIn, db: Session = Depends(get_db), user: User = Depends(pkg_writer)):
    p = InterventionPackage(
        id=new_id("pkg-"), name=body.name, description=body.description, created_by=user.name
    )
    _set_items(db, p, body.items)
    db.add(p)
    audit(db, user, "Parameter change", p.name, f"Package created with {len(body.items)} items")
    db.commit()
    return _package_out(db, p)


@router.put("/intervention-packages/{package_id}", response_model=PackageOut)
def update_package(
    package_id: str, body: PackageIn, db: Session = Depends(get_db), user: User = Depends(pkg_writer)
):
    p = db.get(InterventionPackage, package_id)
    if p is None:
        raise HTTPException(404, "Package not found.")
    p.name, p.description = body.name, body.description
    _set_items(db, p, body.items)
    p.updated_at = utcnow()
    audit(db, user, "Parameter change", p.name, f"Package edited ({len(body.items)} items)")
    db.commit()
    return _package_out(db, p)


@router.delete("/intervention-packages/{package_id}", status_code=204)
def delete_package(package_id: str, db: Session = Depends(get_db), user: User = Depends(pkg_writer)):
    p = db.get(InterventionPackage, package_id)
    if p is None:
        raise HTTPException(404, "Package not found.")
    if db.scalar(select(Scenario.id).where(Scenario.package_id == p.id)):
        raise HTTPException(409, "Scenarios use this package, so it can’t be deleted.")
    db.delete(p)
    audit(db, user, "Parameter change", p.name, "Package deleted")
    db.commit()
