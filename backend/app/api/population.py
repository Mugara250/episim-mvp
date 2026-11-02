"""Module 3 — Population data management."""

import json
import threading
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import db as dbmod
from app.db import get_db
from app.deps import require
from app.models import DatasetDistrict, DatasetVersion, ImportJob, PopulationDataset, Scenario, User
from app.models.common import new_id, utcnow
from app.schemas.base import CamelModel
from app.services.audit import audit
from app.services.geo_data import district_by_code, districts
from app.services.population_import import AGGREGATE_FIELDS, MICRODATA_FIELDS, check_file

router = APIRouter(prefix="/api/population", tags=["population"])

MAX_UPLOAD_BYTES = 50 * 1024 * 1024


class DistrictPopulation(CamelModel):
    code: str
    name: str
    province: str | None = None
    population: int


class VersionOut(CamelModel):
    version: int
    population: int
    format: str
    row_count: int
    notes: str
    imported_by: str | None
    imported_at: datetime
    district_count: int


class DatasetOut(CamelModel):
    id: str
    name: str
    coverage: str
    source: str
    year: str | None
    population: int
    version: int
    last_imported: datetime | None
    illustrative: bool
    scenarios_using: int
    district_codes: list[str]


class DatasetDetail(DatasetOut):
    versions: list[VersionOut]
    districts: list[DistrictPopulation]


def _dataset_out(db: Session, d: PopulationDataset, detail: bool = False):
    latest = d.latest
    using = db.scalar(select(func.count()).select_from(Scenario).where(Scenario.dataset_id == d.id)) or 0
    base = dict(
        id=d.id,
        name=d.name,
        coverage=d.coverage,
        source=d.source,
        year=d.year,
        population=latest.population if latest else 0,
        version=latest.version if latest else 0,
        last_imported=latest.imported_at if latest else None,
        illustrative=d.illustrative,
        scenarios_using=using,
        district_codes=[r.district_code for r in latest.districts] if latest else [],
    )
    if not detail:
        return DatasetOut(**base)
    ref = district_by_code()
    return DatasetDetail(
        **base,
        versions=[
            VersionOut(
                version=v.version,
                population=v.population,
                format=v.format,
                row_count=v.row_count,
                notes=v.notes,
                imported_by=v.imported_by,
                imported_at=v.imported_at,
                district_count=len(v.districts),
            )
            for v in reversed(d.versions)
        ],
        districts=[
            DistrictPopulation(
                code=r.district_code,
                name=ref.get(r.district_code, {}).get("name", r.district_code),
                province=ref.get(r.district_code, {}).get("province"),
                population=r.population,
            )
            for r in sorted(latest.districts, key=lambda r: r.district_code)
        ]
        if latest
        else [],
    )


@router.get("/datasets", response_model=list[DatasetOut])
def list_datasets(db: Session = Depends(get_db), _: User = Depends(require("population"))):
    return [
        _dataset_out(db, d) for d in db.scalars(select(PopulationDataset).order_by(PopulationDataset.name))
    ]


@router.get("/datasets/options", response_model=list[DatasetOut])
def dataset_options(db: Session = Depends(get_db), _: User = Depends(require("scenarios"))):
    """Datasets to choose from in the Scenario Builder (any role that builds scenarios)."""
    return [
        _dataset_out(db, d) for d in db.scalars(select(PopulationDataset).order_by(PopulationDataset.name))
    ]


@router.get("/datasets/{dataset_id}", response_model=DatasetDetail)
def get_dataset(dataset_id: str, db: Session = Depends(get_db), _: User = Depends(require("population"))):
    d = db.get(PopulationDataset, dataset_id)
    if d is None:
        raise HTTPException(404, "Dataset not found.")
    return _dataset_out(db, d, detail=True)


@router.get("/datasets/{dataset_id}/versions/{version}", response_model=list[DistrictPopulation])
def get_version(
    dataset_id: str, version: int, db: Session = Depends(get_db), _: User = Depends(require("population"))
):
    v = db.scalar(
        select(DatasetVersion).where(
            DatasetVersion.dataset_id == dataset_id, DatasetVersion.version == version
        )
    )
    if v is None:
        raise HTTPException(404, "Version not found.")
    ref = district_by_code()
    return [
        DistrictPopulation(
            code=r.district_code,
            name=ref.get(r.district_code, {}).get("name", r.district_code),
            province=ref.get(r.district_code, {}).get("province"),
            population=r.population,
        )
        for r in sorted(v.districts, key=lambda r: r.district_code)
    ]


@router.get("/fields")
def import_fields(_: User = Depends(require("population"))):
    """Field specs for the column-mapping step, and the region codes the checks accept."""

    def spec(rows):
        return [{"key": k, "label": label, "required": r, "synonyms": s} for k, label, r, s in rows]

    return {
        "microdata": spec(MICRODATA_FIELDS),
        "aggregate": spec(AGGREGATE_FIELDS),
        "districts": districts(),
    }


@router.post("/imports/check")
async def check_import(
    file: UploadFile = File(...),
    format: str | None = Form(None),
    mapping: str | None = Form(None, description="JSON object: EpiSim field key → file column"),
    _: User = Depends(require("population", "write")),
):
    """Checks every row of a CSV without importing it. Returns the same shapes as the import wizard."""
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            413, "Files over 50 MB are not supported in the MVP. Split the file and import each part."
        )
    result = check_file(content, format, json.loads(mapping) if mapping else None)
    result["file"] = {"name": file.filename, "sizeBytes": len(content)}
    return result


class ImportJobOut(CamelModel):
    id: str
    dataset_id: str | None
    dataset_name: str
    file_name: str
    size_bytes: int
    format: str
    status: str
    progress: float
    total_rows: int
    valid_rows: int
    error_rows: int
    warning_rows: int
    result_version: int | None
    error_message: str | None
    requested_by: str
    created_at: datetime
    finished_at: datetime | None


def _run_import(job_id: str, content: bytes, mapping: dict | None, details: dict, user_name: str) -> None:
    with dbmod.SessionLocal() as db:
        job = db.get(ImportJob, job_id)
        job.status = "running"
        job.progress = 0.1
        db.commit()
        try:
            result = check_file(content, job.format, mapping)
            if result.get("error"):
                raise ValueError(result["error"])
            if result["missingFields"]:
                raise ValueError(
                    "Map these required fields before importing: " + ", ".join(result["missingFields"])
                )
            s = result["summary"]
            job.total_rows, job.valid_rows = s["totalRows"], s["validRows"]
            job.error_rows, job.warning_rows = s["errorRows"], s["warningRows"]
            totals = {k: v for k, v in result["districtTotals"].items() if v > 0}
            if not totals:
                raise ValueError(
                    "No valid rows were found, so nothing was imported. Fix the flagged rows and try again."
                )
            ds = db.get(PopulationDataset, job.dataset_id) if job.dataset_id else None
            if ds is None:
                ds = PopulationDataset(
                    id=new_id("ds-"),
                    name=details.get("name") or job.dataset_name,
                    coverage=details.get("coverage", ""),
                    source=details.get("source", ""),
                    year=details.get("year"),
                    created_by=user_name,
                )
                db.add(ds)
                db.flush()
                job.dataset_id = ds.id
            number = (ds.latest.version if ds.latest else 0) + 1
            version = DatasetVersion(
                dataset_id=ds.id,
                version=number,
                population=sum(totals.values()),
                format=job.format,
                row_count=s["validRows"],
                notes=f"Imported from {job.file_name}. {s['errorRows']} rows with errors were skipped.",
                imported_by=user_name,
            )
            version.districts = [DatasetDistrict(district_code=c, population=p) for c, p in totals.items()]
            db.add(version)
            job.result_version = number
            job.status = "completed"
            job.progress = 1.0
        except Exception as exc:  # noqa: BLE001
            job.status = "failed"
            job.error_message = str(exc)
        job.finished_at = utcnow()
        db.commit()


@router.post("/imports", response_model=ImportJobOut, status_code=202)
async def start_import(
    file: UploadFile = File(...),
    format: str = Form(...),
    dataset_id: str | None = Form(None, alias="datasetId"),
    name: str | None = Form(None),
    coverage: str = Form(""),
    source: str = Form(""),
    year: str | None = Form(None),
    mapping: str | None = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(require("population", "write")),
):
    """Imports a CSV as a new dataset, or as a new version of `datasetId`. Returns a job to poll."""
    if format not in ("microdata", "aggregate"):
        raise HTTPException(422, "Format must be microdata or aggregate.")
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Files over 50 MB are not supported in the MVP.")
    if dataset_id and db.get(PopulationDataset, dataset_id) is None:
        raise HTTPException(404, "Dataset not found.")
    if not dataset_id and not (name and name.strip()):
        raise HTTPException(422, "Give the new dataset a name.")
    ds_name = db.get(PopulationDataset, dataset_id).name if dataset_id else name.strip()
    job = ImportJob(
        id=new_id("IMP-"),
        dataset_id=dataset_id,
        dataset_name=ds_name,
        file_name=file.filename or "upload.csv",
        size_bytes=len(content),
        format=format,
        requested_by=user.name,
        details={"name": name, "coverage": coverage, "source": source, "year": year},
    )
    db.add(job)
    audit(db, user, "Population import", ds_name, f"{job.file_name} ({format})")
    db.commit()
    threading.Thread(
        target=_run_import,
        args=(job.id, content, json.loads(mapping) if mapping else None, job.details, user.name),
        daemon=True,
    ).start()
    return ImportJobOut.model_validate(job)


@router.get("/imports", response_model=list[ImportJobOut])
def list_imports(db: Session = Depends(get_db), _: User = Depends(require("population"))):
    return [
        ImportJobOut.model_validate(j)
        for j in db.scalars(select(ImportJob).order_by(ImportJob.created_at.desc()))
    ]


@router.get("/imports/{job_id}", response_model=ImportJobOut)
def get_import(job_id: str, db: Session = Depends(get_db), _: User = Depends(require("population"))):
    job = db.get(ImportJob, job_id)
    if job is None:
        raise HTTPException(404, "Import job not found.")
    return ImportJobOut.model_validate(job)
