"""Layer 4 — Reports (Module 13), Rt case data (Module 16), policy-maker content."""

from datetime import datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.common import utcnow


class Report(Base):
    __tablename__ = "reports"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    # scenario_brief | intervention_impact | capacity_review | weekly_situation
    report_type: Mapped[str] = mapped_column(String(40), default="scenario_brief")
    # policy | hospital
    audience: Mapped[str] = mapped_column(String(20), default="policy")
    disease: Mapped[str] = mapped_column(String(40), default="")
    simulation_run_id: Mapped[str | None] = mapped_column(String(40))
    scenario_comparison_id: Mapped[str | None] = mapped_column(String(40))
    # Prototype scenario reference for seeded drafts (e.g. SCN-118); free text
    scenario_ref: Mapped[str | None] = mapped_column(String(40))
    hospital_id: Mapped[str | None] = mapped_column(ForeignKey("institutions.id"))
    period: Mapped[str | None] = mapped_column(String(80))
    summary: Mapped[str] = mapped_column(Text, default="")
    key_points: Mapped[list] = mapped_column(default=list)
    recommendations: Mapped[list] = mapped_column(default=list)
    # [{label, value, range}]
    figures: Mapped[list] = mapped_column(default=list)
    # draft | pending_approval | approved
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    author_id: Mapped[str | None] = mapped_column(String(40))
    author_name: Mapped[str] = mapped_column(String(200))
    approved_by_id: Mapped[str | None] = mapped_column(String(40))
    approved_by: Mapped[str | None] = mapped_column(String(200))
    approved_on: Mapped[datetime | None] = mapped_column(DateTime)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ReportExport(Base):
    __tablename__ = "report_exports"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("reports.id"), index=True)
    format: Mapped[str] = mapped_column(String(10), default="pdf")
    # queued | generating | completed | failed
    status: Mapped[str] = mapped_column(String(20), default="queued")
    file_key: Mapped[str | None] = mapped_column(String(300))
    size_bytes: Mapped[int | None] = mapped_column(Integer)
    error_message: Mapped[str | None] = mapped_column(Text)
    requested_by: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime)


class InterventionReview(Base):
    __tablename__ = "intervention_reviews"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(300))
    disease: Mapped[str] = mapped_column(String(20))
    description: Mapped[str] = mapped_column(Text, default="")
    effect: Mapped[str] = mapped_column(String(200), default="")
    effect_range: Mapped[str] = mapped_column(String(200), default="")
    cost: Mapped[str] = mapped_column(String(10), default="Medium")
    status: Mapped[str] = mapped_column(String(30), default="Under review")
    basis: Mapped[str] = mapped_column(Text, default="")
    updated_by: Mapped[str | None] = mapped_column(String(200))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)


class PolicyAlert(Base):
    __tablename__ = "policy_alerts"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    level: Mapped[str] = mapped_column(String(10))
    title: Mapped[str] = mapped_column(String(300))
    detail: Mapped[str] = mapped_column(Text, default="")
    date: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)


class CaseDataset(Base):
    __tablename__ = "case_datasets"
    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    name: Mapped[str] = mapped_column(String(300))
    disease: Mapped[str] = mapped_column(String(40))
    source: Mapped[str] = mapped_column(String(300), default="")
    start_date: Mapped[datetime] = mapped_column(Date)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class CaseRecord(Base):
    """Daily counts only. No patient identifiers are accepted or stored."""

    __tablename__ = "case_records"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dataset_id: Mapped[str] = mapped_column(ForeignKey("case_datasets.id"), index=True)
    record_date: Mapped[datetime] = mapped_column(Date)
    location: Mapped[str] = mapped_column(String(200), default="")
    new_cases: Mapped[int] = mapped_column(Integer)
    reported_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    reported_by: Mapped[str | None] = mapped_column(String(200))
