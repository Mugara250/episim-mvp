"""Layer 2 — Configuration data (Modules 3, 4, 8, 10)."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.common import utcnow


class PopulationDataset(Base):
    __tablename__ = "population_datasets"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    coverage: Mapped[str] = mapped_column(String(300), default="")
    source: Mapped[str] = mapped_column(String(300), default="")
    year: Mapped[str | None] = mapped_column(String(10))
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    versions: Mapped[list["DatasetVersion"]] = relationship(
        back_populates="dataset", order_by="DatasetVersion.version", cascade="all, delete-orphan"
    )

    @property
    def latest(self) -> "DatasetVersion | None":
        return self.versions[-1] if self.versions else None


class DatasetVersion(Base):
    __tablename__ = "dataset_versions"
    __table_args__ = (UniqueConstraint("dataset_id", "version"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dataset_id: Mapped[str] = mapped_column(ForeignKey("population_datasets.id"))
    version: Mapped[int] = mapped_column(Integer)
    population: Mapped[int] = mapped_column(Integer)
    # microdata | aggregate | seed
    format: Mapped[str] = mapped_column(String(20), default="seed")
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    imported_by: Mapped[str | None] = mapped_column(String(200))
    imported_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    dataset: Mapped[PopulationDataset] = relationship(back_populates="versions")
    districts: Mapped[list["DatasetDistrict"]] = relationship(cascade="all, delete-orphan", lazy="selectin")


class DatasetDistrict(Base):
    __tablename__ = "dataset_districts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    version_id: Mapped[int] = mapped_column(ForeignKey("dataset_versions.id"), index=True)
    district_code: Mapped[str] = mapped_column(String(4))
    population: Mapped[int] = mapped_column(Integer)


class ImportJob(Base):
    __tablename__ = "import_jobs"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    dataset_id: Mapped[str | None] = mapped_column(String(40))
    dataset_name: Mapped[str] = mapped_column(String(200))
    file_name: Mapped[str] = mapped_column(String(300))
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    format: Mapped[str] = mapped_column(String(20))
    # queued | running | completed | failed
    status: Mapped[str] = mapped_column(String(20), default="queued")
    progress: Mapped[float] = mapped_column(Float, default=0)
    total_rows: Mapped[int] = mapped_column(Integer, default=0)
    valid_rows: Mapped[int] = mapped_column(Integer, default=0)
    error_rows: Mapped[int] = mapped_column(Integer, default=0)
    warning_rows: Mapped[int] = mapped_column(Integer, default=0)
    result_version: Mapped[int | None] = mapped_column(Integer)
    error_message: Mapped[str | None] = mapped_column(Text)
    details: Mapped[dict] = mapped_column(default=dict)
    requested_by: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)


class DiseasePreset(Base):
    """Structured for the SEIHFR model (docs Module 4). Times in days, rates and shares 0–1."""

    __tablename__ = "disease_presets"
    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    key: Mapped[str] = mapped_column(String(60), unique=True)
    # Disease family used for model defaults and Rt (ebola, marburg, ...)
    disease: Mapped[str] = mapped_column(String(40))
    name: Mapped[str] = mapped_column(String(200))
    virus: Mapped[str] = mapped_column(String(200), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(10), default="#64748B")
    r0_low: Mapped[float] = mapped_column(Float)
    r0_likely: Mapped[float] = mapped_column(Float)
    r0_high: Mapped[float] = mapped_column(Float)
    overdispersion_k: Mapped[float] = mapped_column(Float)
    incubation_days: Mapped[float] = mapped_column(Float)
    onset_to_admission_days: Mapped[float] = mapped_column(Float)
    onset_to_death_days: Mapped[float] = mapped_column(Float)
    onset_to_recovery_days: Mapped[float] = mapped_column(Float)
    cfr_community: Mapped[float] = mapped_column(Float)
    cfr_hospital: Mapped[float] = mapped_column(Float)
    share_hospitalised: Mapped[float] = mapped_column(Float)
    burial_delay_days: Mapped[float] = mapped_column(Float)
    hcw_risk: Mapped[float] = mapped_column(Float)
    serial_interval_mean: Mapped[float] = mapped_column(Float)
    serial_interval_sd: Mapped[float] = mapped_column(Float)
    route_share_community: Mapped[float] = mapped_column(Float, default=0.55)
    route_share_hospital: Mapped[float] = mapped_column(Float, default=0.15)
    route_share_funeral: Mapped[float] = mapped_column(Float, default=0.30)
    baseline_safe_burial: Mapped[float] = mapped_column(Float, default=0.5)
    baseline_contact_tracing: Mapped[float] = mapped_column(Float, default=0.4)
    baseline_isolation: Mapped[float] = mapped_column(Float, default=0.5)
    default_initial_cases: Mapped[int] = mapped_column(Integer, default=3)
    hcw_ppe_before: Mapped[float] = mapped_column(Float, default=0.3)
    hcw_ppe_after: Mapped[float] = mapped_column(Float, default=0.85)
    hcw_recognition_day: Mapped[int] = mapped_column(Integer, default=14)
    provisional: Mapped[bool] = mapped_column(Boolean, default=True)
    reference: Mapped[str] = mapped_column(Text, default="")
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
    cloned_from_id: Mapped[str | None] = mapped_column(String(60))
    approved_by: Mapped[str | None] = mapped_column(String(200))
    approved_on: Mapped[datetime | None] = mapped_column(DateTime)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_by: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class InterventionType(Base):
    __tablename__ = "intervention_types"
    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    key: Mapped[str] = mapped_column(String(60), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    # rate | shift
    mechanism: Mapped[str] = mapped_column(String(10))
    # Which model lever it moves (see app.services.resolver.LEVERS)
    engine_lever: Mapped[str] = mapped_column(String(40))
    default_effect: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(Text, default="")
    placeholder: Mapped[bool] = mapped_column(Boolean, default=True)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class InterventionPackage(Base):
    __tablename__ = "intervention_packages"
    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    items: Mapped[list["InterventionItem"]] = relationship(
        cascade="all, delete-orphan", order_by="InterventionItem.position", lazy="selectin"
    )


class InterventionItem(Base):
    __tablename__ = "intervention_items"
    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    package_id: Mapped[str] = mapped_column(ForeignKey("intervention_packages.id"), index=True)
    type_id: Mapped[str] = mapped_column(ForeignKey("intervention_types.id"))
    position: Mapped[int] = mapped_column(Integer, default=0)
    start_day: Mapped[int] = mapped_column(Integer)
    end_day: Mapped[int | None] = mapped_column(Integer)
    coverage: Mapped[float] = mapped_column(Float)
    custom_effect: Mapped[float | None] = mapped_column(Float)


class CapacityProfile(Base):
    __tablename__ = "capacity_profiles"
    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"))
    hospital_beds: Mapped[int] = mapped_column(Integer)
    icu_beds: Mapped[int] = mapped_column(Integer, default=0)
    ventilators: Mapped[int] = mapped_column(Integer, default=0)
    health_workers: Mapped[int] = mapped_column(Integer, default=0)
    tests_per_day: Mapped[int] = mapped_column(Integer, default=0)
    vaccine_doses: Mapped[int | None] = mapped_column(Integer)
    source_note: Mapped[str] = mapped_column(Text, default="")
    placeholder: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_by: Mapped[str | None] = mapped_column(String(200))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    district_beds: Mapped[list["CapacityDistrictBeds"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )


class CapacityDistrictBeds(Base):
    __tablename__ = "capacity_district_beds"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[str] = mapped_column(ForeignKey("capacity_profiles.id"), index=True)
    district_code: Mapped[str] = mapped_column(String(4))
    beds: Mapped[int] = mapped_column(Integer)
