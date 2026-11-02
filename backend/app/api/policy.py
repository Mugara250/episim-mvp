"""Policy-maker content (Module 13): intervention reviews and alerts."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import current_user, forbid, require
from app.models import InterventionReview, PolicyAlert, User
from app.models.common import utcnow
from app.schemas.base import CamelModel
from app.services.audit import audit

router = APIRouter(prefix="/api", tags=["policy"])


class ReviewIn(CamelModel):
    name: str
    disease: str = Field(pattern="^(Ebola|Marburg|Both)$")
    description: str = ""
    effect: str = ""
    effect_range: str = ""
    cost: str = Field(pattern="^(Low|Medium|High)$")
    status: str = Field(pattern="^(Recommended|Under review|Not recommended)$")
    basis: str = ""


class ReviewOut(ReviewIn):
    id: str
    updated_by: str | None
    updated_at: datetime
    illustrative: bool


@router.get("/intervention-reviews", response_model=list[ReviewOut])
def list_reviews(db: Session = Depends(get_db), _: User = Depends(require("interventions"))):
    return [
        ReviewOut.model_validate(r)
        for r in db.scalars(select(InterventionReview).order_by(InterventionReview.id))
    ]


@router.put("/intervention-reviews/{rid}", response_model=ReviewOut)
def update_review(
    rid: str, body: ReviewIn, db: Session = Depends(get_db), user: User = Depends(require("scenario", "full"))
):
    """Epidemiologists maintain the review; policy makers read it."""
    r = db.get(InterventionReview, rid)
    if r is None:
        raise HTTPException(404, "Review not found.")
    for k, v in body.model_dump().items():
        setattr(r, k, v)
    r.updated_by, r.updated_at, r.illustrative = user.name, utcnow(), False
    audit(db, user, "Intervention review updated", r.name, r.status)
    db.commit()
    return ReviewOut.model_validate(r)


class AlertOut(CamelModel):
    id: str
    level: str
    title: str
    detail: str
    date: datetime
    illustrative: bool


@router.get("/policy-alerts", response_model=list[AlertOut])
def list_alerts(db: Session = Depends(get_db), user: User = Depends(current_user)):
    if user.role == "admin":
        raise forbid()
    return [
        AlertOut.model_validate(a) for a in db.scalars(select(PolicyAlert).order_by(PolicyAlert.date.desc()))
    ]
