"""Layer 3 — Simulation runs and results (Modules 5, 6, 9, 15) and Layer 4 comparisons (Module 12)."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.access import User
from app.models.common import utcnow
from app.models.scenarios import Scenario


class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    scenario_id: Mapped[str] = mapped_column(ForeignKey("scenarios.id"), index=True)
    # seihfr | seihfr_geo
    model_type: Mapped[str] = mapped_column(String(20), default="seihfr")
    horizon_days: Mapped[int] = mapped_column(Integer)
    initial_cases: Mapped[int] = mapped_column(Integer)
    monte_carlo_runs: Mapped[int] = mapped_column(Integer, default=200)
    seed: Mapped[int] = mapped_column(Integer, default=2026)
    seed_district_code: Mapped[str | None] = mapped_column(String(4))
    engine_version: Mapped[str | None] = mapped_column(String(40))
    inputs_snapshot: Mapped[dict] = mapped_column(default=dict)
    # queued | running | completed | failed | cancelled
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True)
    progress: Mapped[float] = mapped_column(Float, default=0)
    cancel_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    requested_by_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    queued_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    duration_sec: Mapped[float | None] = mapped_column(Float)
    error_message: Mapped[str | None] = mapped_column(Text)

    scenario: Mapped[Scenario] = relationship(lazy="joined")
    requested_by: Mapped[User] = relationship(lazy="joined")
    result: Mapped["SimulationResult | None"] = relationship(
        back_populates="run", uselist=False, cascade="all, delete-orphan", lazy="select"
    )


class SimulationResult(Base):
    __tablename__ = "simulation_results"
    run_id: Mapped[str] = mapped_column(ForeignKey("simulation_runs.id"), primary_key=True)
    p_take_off: Mapped[float | None] = mapped_column(Float)
    p_over_50: Mapped[float | None] = mapped_column(Float)
    p_over_100: Mapped[float | None] = mapped_column(Float)
    final_cases_low: Mapped[float | None] = mapped_column(Float)
    final_cases_median: Mapped[float | None] = mapped_column(Float)
    final_cases_high: Mapped[float | None] = mapped_column(Float)
    final_deaths_low: Mapped[float | None] = mapped_column(Float)
    final_deaths_median: Mapped[float | None] = mapped_column(Float)
    final_deaths_high: Mapped[float | None] = mapped_column(Float)
    peak_beds_low: Mapped[float | None] = mapped_column(Float)
    peak_beds_median: Mapped[float | None] = mapped_column(Float)
    peak_beds_high: Mapped[float | None] = mapped_column(Float)
    hcw_share_low: Mapped[float | None] = mapped_column(Float)
    hcw_share_median: Mapped[float | None] = mapped_column(Float)
    hcw_share_high: Mapped[float | None] = mapped_column(Float)
    peak_infectious_median: Mapped[float | None] = mapped_column(Float)
    peak_day_median: Mapped[int | None] = mapped_column(Integer)
    recovered_median: Mapped[float | None] = mapped_column(Float)
    # Full engine summary (all {low, median, high} blocks)
    summary: Mapped[dict] = mapped_column(default=dict)
    # Per-run peak hospitalised, so P(beds exceeded) can be recomputed for any capacity profile
    run_peaks: Mapped[list] = mapped_column(default=list)
    # Daily bands, columnar {series: {low: [], median: [], high: []}}
    series: Mapped[dict] = mapped_column(default=dict)
    # seihfr_geo only
    districts: Mapped[list] = mapped_column(default=list)
    movement: Mapped[dict] = mapped_column(default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    run: Mapped[SimulationRun] = relationship(back_populates="result")


class ScenarioComparison(Base):
    __tablename__ = "scenario_comparisons"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(300))
    notes: Mapped[str] = mapped_column(Text, default="")
    run_ids: Mapped[list] = mapped_column(default=list)
    baseline_run_id: Mapped[str | None] = mapped_column(String(40))
    capacity_profile_id: Mapped[str | None] = mapped_column(String(60))
    created_by_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)


class BorderRisk(Base):
    __tablename__ = "border_risks"
    country: Mapped[str] = mapped_column(String(40), primary_key=True)
    # High | Medium | Low
    risk: Mapped[str] = mapped_column(String(10))
    # Which side of the map the chip sits on
    side: Mapped[str] = mapped_column(String(10), default="west")
    note: Mapped[str] = mapped_column(Text, default="")
    updated_by: Mapped[str | None] = mapped_column(String(200))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
