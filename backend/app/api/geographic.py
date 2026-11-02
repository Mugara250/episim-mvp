"""Module 9 — Geographic spread: reference data, movement and border-risk assumptions."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import BOUNDARY_ATTRIBUTION, MOVEMENT_LABEL
from app.db import get_db
from app.deps import current_user, require
from app.models import BorderRisk, User
from app.models.common import utcnow
from app.schemas.base import CamelModel
from app.services.audit import audit
from app.services.geo_data import boundary_geojson, districts, reference_populations

router = APIRouter(prefix="/api/geographic", tags=["geographic"])


@router.get("/districts")
def district_boundaries(_: User = Depends(current_user)):
    """The 30 real district boundaries (GeoJSON) with code, name, province and label position (cx, cy)."""
    return {**boundary_geojson(), "attribution": BOUNDARY_ATTRIBUTION}


@router.get("/movement")
def movement(top: int = 10, _: User = Depends(require("geographic"))):
    """Strongest estimated links between districts (the engine's gravity model, default parameters)."""
    from app.simulation.movement import gravity_matrix, top_links

    ds = districts_with_population()
    _m, trips = gravity_matrix(ds)
    return {
        "method": "gravity",
        "estimated": True,
        "label": MOVEMENT_LABEL,
        "links": top_links(ds, trips, top),
        "note": "Trips grow with both districts’ populations and fall with distance. "
        "It is not observed travel data.",
    }


def districts_with_population() -> list[dict]:
    pops = reference_populations()
    return [{**d, "population": pops.get(d["code"], 0)} for d in districts()]


class BorderRiskIn(CamelModel):
    country: str
    risk: str = Field(pattern="^(High|Medium|Low)$")
    note: str = ""


@router.get("/border-risks")
def border_risks(db: Session = Depends(get_db), _: User = Depends(require("geographic"))):
    return [
        {
            "country": b.country,
            "risk": b.risk,
            "side": b.side,
            "note": b.note,
            "updatedBy": b.updated_by,
            "updatedAt": b.updated_at,
        }
        for b in db.scalars(select(BorderRisk))
    ]


@router.put("/border-risks")
def update_border_risks(
    body: list[BorderRiskIn],
    db: Session = Depends(get_db),
    user: User = Depends(require("geographic", "full")),
):
    """Importation risk per border country is a configurable assumption, not a calculation (docs Module 9)."""
    for item in body:
        b = db.get(BorderRisk, item.country)
        if b is None:
            raise HTTPException(422, f"Unknown border country {item.country}.")
        b.risk, b.note, b.updated_by, b.updated_at = item.risk, item.note, user.name, utcnow()
    audit(
        db,
        user,
        "Border risks updated",
        "Geographic spread",
        ", ".join(f"{b.country}: {b.risk}" for b in body),
    )
    db.commit()
    return border_risks(db, user)
