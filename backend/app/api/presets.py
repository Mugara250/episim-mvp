"""Module 4 — Disease parameter configuration (SEIHFR presets)."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field, model_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require, require_any
from app.models import DiseasePreset, Scenario, User
from app.models.common import new_id, utcnow
from app.schemas.base import CamelModel
from app.services.audit import audit

router = APIRouter(prefix="/api/disease-presets", tags=["disease-presets"])

EDITABLE = [
    "name",
    "virus",
    "description",
    "color",
    "r0_low",
    "r0_likely",
    "r0_high",
    "overdispersion_k",
    "incubation_days",
    "onset_to_admission_days",
    "onset_to_death_days",
    "onset_to_recovery_days",
    "cfr_community",
    "cfr_hospital",
    "share_hospitalised",
    "burial_delay_days",
    "hcw_risk",
    "serial_interval_mean",
    "serial_interval_sd",
    "route_share_community",
    "route_share_hospital",
    "route_share_funeral",
    "baseline_safe_burial",
    "baseline_contact_tracing",
    "baseline_isolation",
    "default_initial_cases",
    "hcw_ppe_before",
    "hcw_ppe_after",
    "hcw_recognition_day",
    "provisional",
    "reference",
]


class PresetFields(CamelModel):
    name: str = Field(min_length=1, max_length=200)
    virus: str = ""
    description: str = ""
    color: str = "#64748B"
    r0_low: float = Field(ge=0, le=20)
    r0_likely: float = Field(ge=0, le=20)
    r0_high: float = Field(ge=0, le=20)
    overdispersion_k: float = Field(gt=0, le=100)
    incubation_days: float = Field(gt=0, le=60)
    onset_to_admission_days: float = Field(gt=0, le=60)
    onset_to_death_days: float = Field(gt=0, le=120)
    onset_to_recovery_days: float = Field(gt=0, le=120)
    cfr_community: float = Field(ge=0, le=1)
    cfr_hospital: float = Field(ge=0, le=1)
    share_hospitalised: float = Field(gt=0, le=1)
    burial_delay_days: float = Field(gt=0, le=30)
    hcw_risk: float = Field(ge=0, le=5)
    serial_interval_mean: float = Field(gt=0, le=60)
    serial_interval_sd: float = Field(gt=0, le=60)
    route_share_community: float = Field(0.55, ge=0, le=1)
    route_share_hospital: float = Field(0.15, ge=0, le=1)
    route_share_funeral: float = Field(0.30, ge=0, le=1)
    baseline_safe_burial: float = Field(0.5, ge=0, le=1)
    baseline_contact_tracing: float = Field(0.4, ge=0, le=1)
    baseline_isolation: float = Field(0.5, ge=0, le=1)
    default_initial_cases: int = Field(3, ge=1)
    hcw_ppe_before: float = Field(0.3, ge=0, le=1)
    hcw_ppe_after: float = Field(0.85, ge=0, le=1)
    hcw_recognition_day: int = Field(14, ge=0)
    provisional: bool = True
    reference: str = ""

    @model_validator(mode="after")
    def _checks(self):
        if not (self.r0_low <= self.r0_likely <= self.r0_high):
            raise ValueError("R0 must satisfy low ≤ likely ≤ high.")
        total = self.route_share_community + self.route_share_hospital + self.route_share_funeral
        if abs(total - 1) > 0.01:
            raise ValueError(f"Route shares must add up to 100% (now {total * 100:.0f}%).")
        return self


class PresetIn(PresetFields):
    key: str | None = None
    disease: str = Field(min_length=1, max_length=40, description="Disease family, e.g. ebola, marburg")


class PresetOut(PresetFields):
    id: str
    key: str
    disease: str
    is_builtin: bool
    built_in: bool
    illustrative: bool
    cloned_from_id: str | None
    approved_by: str | None
    approved_on: datetime | None
    version: int
    created_by: str | None
    updated_at: datetime
    scenarios_using: int = 0

    @classmethod
    def of(cls, p: DiseasePreset, using: int = 0) -> "PresetOut":
        data = {f: getattr(p, f) for f in EDITABLE}
        return cls(
            **data,
            id=p.id,
            key=p.key,
            disease=p.disease,
            is_builtin=p.is_builtin,
            built_in=p.is_builtin,
            illustrative=p.illustrative,
            cloned_from_id=p.cloned_from_id,
            approved_by=p.approved_by,
            approved_on=p.approved_on,
            version=p.version,
            created_by=p.created_by,
            updated_at=p.updated_at,
            scenarios_using=using,
        )


class CloneIn(CamelModel):
    name: str | None = None


class ApproveIn(CamelModel):
    clear_provisional: bool = False


def _using(db: Session) -> dict[str, int]:
    out: dict[str, int] = {}
    for (pid,) in db.execute(select(Scenario.preset_id)):
        if pid:
            out[pid] = out.get(pid, 0) + 1
    return out


def _unique_key(db: Session, base: str) -> str:
    key = base
    n = 2
    while db.scalar(select(DiseasePreset).where(DiseasePreset.key == key)):
        key = f"{base}_{n}"
        n += 1
    return key


def _get(db: Session, preset_id: str) -> DiseasePreset:
    p = db.get(DiseasePreset, preset_id)
    if p is None:
        raise HTTPException(404, "Preset not found.")
    return p


# Presets are read by every role that builds or reads scenarios (rbac.ts: officer/policymaker read presets).
reader = require_any(["presets", "disease", "scenarios"])


@router.get("", response_model=list[PresetOut])
def list_presets(db: Session = Depends(get_db), _: User = Depends(reader)):
    using = _using(db)
    rows = db.scalars(select(DiseasePreset).order_by(DiseasePreset.is_builtin.desc(), DiseasePreset.name))
    return [PresetOut.of(p, using.get(p.id, 0)) for p in rows]


@router.get("/{preset_id}", response_model=PresetOut)
def get_preset(preset_id: str, db: Session = Depends(get_db), _: User = Depends(reader)):
    return PresetOut.of(_get(db, preset_id), _using(db).get(preset_id, 0))


@router.post("", response_model=PresetOut, status_code=201)
def create_preset(
    body: PresetIn, db: Session = Depends(get_db), user: User = Depends(require("presets", "write"))
):
    key = _unique_key(db, (body.key or body.name).strip().lower().replace(" ", "_").replace("-", "_")[:50])
    p = DiseasePreset(
        id=new_id("preset-"),
        key=key,
        disease=body.disease.lower(),
        created_by=user.name,
        **{f: getattr(body, f) for f in EDITABLE},
    )
    db.add(p)
    audit(db, user, "Parameter change", p.name, "Custom preset created")
    db.commit()
    return PresetOut.of(p)


@router.put("/{preset_id}", response_model=PresetOut)
def update_preset(
    preset_id: str,
    body: PresetFields,
    db: Session = Depends(get_db),
    user: User = Depends(require("presets", "write")),
):
    p = _get(db, preset_id)
    if p.is_builtin and not user.can_edit_builtins:
        raise HTTPException(403, "Built-in presets are read-only. Clone it to make an editable copy.")
    changed = [f for f in EDITABLE if getattr(p, f) != getattr(body, f)]
    for f in EDITABLE:
        setattr(p, f, getattr(body, f))
    if changed:
        p.version += 1
        p.approved_by = None
        p.approved_on = None
    p.updated_at = utcnow()
    audit(db, user, "Parameter change", p.name, f"v{p.version}: changed {', '.join(changed) or 'nothing'}")
    db.commit()
    return PresetOut.of(p, _using(db).get(p.id, 0))


@router.post("/{preset_id}/clone", response_model=PresetOut, status_code=201)
def clone_preset(
    preset_id: str,
    body: CloneIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("presets", "write")),
):
    src = _get(db, preset_id)
    name = (body.name if body and body.name else f"{src.name} (copy)").strip()
    p = DiseasePreset(
        id=new_id("preset-"),
        key=_unique_key(db, f"{src.key}_copy"),
        disease=src.disease,
        is_builtin=False,
        cloned_from_id=src.id,
        created_by=user.name,
        illustrative=src.illustrative,
        **{f: getattr(src, f) for f in EDITABLE if f != "name"},
        name=name,
    )
    db.add(p)
    audit(db, user, "Parameter change", p.name, f"Cloned from {src.name}")
    db.commit()
    return PresetOut.of(p)


@router.post("/{preset_id}/approve", response_model=PresetOut)
def approve_preset(
    preset_id: str,
    body: ApproveIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("disease", "full")),
):
    """Records that an epidemiologist reviewed the current values. Clearing 'provisional' is explicit."""
    p = _get(db, preset_id)
    p.approved_by = user.name
    p.approved_on = utcnow()
    if body and body.clear_provisional:
        p.provisional = False
    audit(
        db,
        user,
        "Parameter set approved",
        p.name,
        f"v{p.version}" + (" · provisional cleared" if body and body.clear_provisional else ""),
    )
    db.commit()
    return PresetOut.of(p, _using(db).get(p.id, 0))


@router.delete("/{preset_id}", status_code=204)
def delete_preset(
    preset_id: str, db: Session = Depends(get_db), user: User = Depends(require("presets", "write"))
):
    p = _get(db, preset_id)
    if p.is_builtin:
        raise HTTPException(403, "Built-in presets cannot be deleted.")
    if _using(db).get(p.id):
        raise HTTPException(409, "Scenarios use this preset. Change those scenarios first.")
    db.delete(p)
    audit(db, user, "Parameter change", p.name, "Custom preset deleted")
    db.commit()
