"""Module 16 — Rt tracking from daily case counts (Cori et al. 2013)."""

import csv
import io
from datetime import date, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require
from app.models import CaseDataset, CaseRecord, DiseasePreset, User
from app.models.common import new_id, utcnow
from app.schemas.base import CamelModel
from app.services.audit import audit
from app.services.case_quality import daily_counts, quality

router = APIRouter(prefix="/api/rt", tags=["rt"])


class CaseDatasetOut(CamelModel):
    id: str
    name: str
    disease: str
    source: str
    start_date: date
    last_updated: datetime
    records: int
    days: int
    status: str
    illustrative: bool
    note: str


def _records(db: Session, ds_id: str) -> list[CaseRecord]:
    return list(
        db.scalars(select(CaseRecord).where(CaseRecord.dataset_id == ds_id).order_by(CaseRecord.record_date))
    )


def _out(db: Session, ds: CaseDataset) -> CaseDatasetOut:
    recs = _records(db, ds.id)
    status, _ = quality(recs)
    counts, _start = daily_counts(recs)
    return CaseDatasetOut(
        id=ds.id,
        name=ds.name,
        disease=ds.disease,
        source=ds.source,
        start_date=ds.start_date,
        last_updated=ds.updated_at,
        records=len(recs),
        days=len(counts),
        status=status,
        illustrative=ds.illustrative,
        note=ds.note,
    )


def _get(db: Session, ds_id: str) -> CaseDataset:
    ds = db.get(CaseDataset, ds_id)
    if ds is None:
        raise HTTPException(404, "Case dataset not found.")
    return ds


@router.get("/datasets", response_model=list[CaseDatasetOut])
def list_datasets(db: Session = Depends(get_db), _: User = Depends(require("rt"))):
    return [_out(db, d) for d in db.scalars(select(CaseDataset).order_by(CaseDataset.name))]


@router.post("/datasets", response_model=CaseDatasetOut, status_code=201)
async def import_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    disease: str = Form(...),
    source: str = Form(""),
    db: Session = Depends(get_db),
    user: User = Depends(require("rt", "write")),
):
    """Import a CSV of daily counts with columns date, location, cases. No patient identifiers."""
    text = (await file.read()).decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    cols = {c.strip().lower() for c in reader.fieldnames or []}
    if not {"date", "cases"} <= cols:
        raise HTTPException(422, "The file needs columns date and cases (and optionally location).")
    rows = []
    for i, raw in enumerate(reader, start=2):
        r = {k.strip().lower(): (v or "").strip() for k, v in raw.items() if k}
        try:
            rows.append((date.fromisoformat(r["date"]), r.get("location", ""), int(r["cases"])))
        except ValueError:
            raise HTTPException(422, f"Line {i}: use dates like 2026-10-01 and whole-number cases.") from None
    if not rows:
        raise HTTPException(422, "The file has no rows.")
    ds = CaseDataset(
        id=new_id("cases-"), name=name, disease=disease, source=source, start_date=min(r[0] for r in rows)
    )
    db.add(ds)
    db.flush()
    for d, loc, n in rows:
        db.add(CaseRecord(dataset_id=ds.id, record_date=d, location=loc, new_cases=n, reported_by=user.name))
    audit(db, user, "Case data imported", name, f"{len(rows)} rows")
    db.commit()
    return _out(db, ds)


class DayIn(CamelModel):
    new_cases: int = Field(ge=0)
    record_date: date | None = None
    location: str = ""


@router.post("/datasets/{ds_id}/records", response_model=CaseDatasetOut, status_code=201)
def add_day(
    ds_id: str, body: DayIn, db: Session = Depends(get_db), user: User = Depends(require("rt", "write"))
):
    """Adds one day's count (defaults to the day after the last record)."""
    ds = _get(db, ds_id)
    recs = _records(db, ds.id)
    from datetime import timedelta

    d = body.record_date or ((recs[-1].record_date + timedelta(days=1)) if recs else ds.start_date)
    db.add(
        CaseRecord(
            dataset_id=ds.id,
            record_date=d,
            location=body.location,
            new_cases=body.new_cases,
            reported_by=user.name,
        )
    )
    ds.updated_at = utcnow()
    audit(db, user, "Case count added", ds.name, f"{d}: {body.new_cases}")
    db.commit()
    return _out(db, ds)


@router.delete("/datasets/{ds_id}/records/last", response_model=CaseDatasetOut)
def undo_last(ds_id: str, db: Session = Depends(get_db), user: User = Depends(require("rt", "write"))):
    ds = _get(db, ds_id)
    last = db.scalars(
        select(CaseRecord)
        .where(CaseRecord.dataset_id == ds.id, CaseRecord.reported_by == user.name)
        .order_by(CaseRecord.id.desc())
    ).first()
    if last is None:
        raise HTTPException(409, "You have not added any days to this dataset.")
    db.delete(last)
    audit(db, user, "Case count removed", ds.name, f"{last.record_date}")
    db.commit()
    return _out(db, ds)


@router.get("/datasets/{ds_id}/quality")
def dataset_quality(ds_id: str, db: Session = Depends(get_db), _: User = Depends(require("rt"))):
    ds = _get(db, ds_id)
    status, issues = quality(_records(db, ds.id))
    return {"datasetId": ds.id, "status": status, "issues": issues}


@router.get("/estimate")
def estimate(
    dataset_id: str = Query(..., alias="datasetId"),
    disease_key: str | None = Query(None, alias="diseaseKey"),
    window: int = 7,
    db: Session = Depends(get_db),
    _: User = Depends(require("rt")),
):
    """Daily Rt with a 95% interval. The serial interval comes from the disease's built-in preset."""
    from app.simulation.rt import estimate_rt, trend_of

    if not 3 <= window <= 21:
        raise HTTPException(422, "Use a window between 3 and 21 days.")
    ds = _get(db, dataset_id)
    key = disease_key or ds.disease
    preset = db.scalars(
        select(DiseasePreset).where(DiseasePreset.disease == key).order_by(DiseasePreset.is_builtin.desc())
    ).first()
    if preset is None:
        raise HTTPException(422, f"No disease preset for {key}.")
    counts, start = daily_counts(_records(db, ds.id))
    points = estimate_rt(
        counts, {"mean": preset.serial_interval_mean, "sd": preset.serial_interval_sd}, window=window
    )
    latest = next((p for p in reversed(points) if p.get("rt") is not None), None)
    return {
        "datasetId": ds.id,
        "disease": key,
        "presetName": preset.name,
        "provisional": preset.provisional,
        "serialInterval": {"mean": preset.serial_interval_mean, "sd": preset.serial_interval_sd},
        "startDate": start,
        "window": window,
        "points": points,
        "latest": latest,
        "trend": trend_of(latest) if latest else "not-enough-data",
        "illustrative": ds.illustrative,
        "note": "Rt describes the past week, not the future. Recent days are often undercounted, "
        "so the latest value tends to read low.",
    }
