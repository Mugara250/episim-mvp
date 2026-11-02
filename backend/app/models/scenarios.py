"""The Scenario Builder (docs) and scenario approvals (Module 13)."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.access import Institution, User
from app.models.common import utcnow


class Scenario(Base):
    __tablename__ = "scenarios"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text, default="")
    dataset_id: Mapped[str | None] = mapped_column(ForeignKey("population_datasets.id"))
    # Pinned when the scenario is saved
    dataset_version: Mapped[int | None] = mapped_column(Integer)
    preset_id: Mapped[str | None] = mapped_column(ForeignKey("disease_presets.id"))
    package_id: Mapped[str | None] = mapped_column(ForeignKey("intervention_packages.id"))
    # Suggested default only (docs D4): capacity is chosen at analysis time.
    capacity_profile_id: Mapped[str | None] = mapped_column(String(60))
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    owner_institution_id: Mapped[str | None] = mapped_column(ForeignKey("institutions.id"))
    draft: Mapped[bool] = mapped_column(Boolean, default=False)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
    cloned_from_id: Mapped[str | None] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    owner: Mapped[User] = relationship(lazy="joined", foreign_keys=[owner_id])
    owner_institution: Mapped[Institution | None] = relationship(lazy="joined")
    shares: Mapped[list["ScenarioShare"]] = relationship(cascade="all, delete-orphan", lazy="selectin")


class ScenarioShare(Base):
    __tablename__ = "scenario_shares"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    scenario_id: Mapped[str] = mapped_column(ForeignKey("scenarios.id"), index=True)
    # user | institution
    kind: Mapped[str] = mapped_column(String(20))
    # user id or institution id
    target_id: Mapped[str] = mapped_column(String(40))
    # view | clone
    permission: Mapped[str] = mapped_column(String(10))


class ScenarioApproval(Base):
    """An approved scenario as shown to policy makers. Seeded rows without a scenario are illustrative."""

    __tablename__ = "scenario_approvals"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    scenario_id: Mapped[str | None] = mapped_column(ForeignKey("scenarios.id"))
    run_id: Mapped[str | None] = mapped_column(String(40))
    name: Mapped[str] = mapped_column(String(300))
    disease: Mapped[str] = mapped_column(String(40))
    plan_summary: Mapped[str] = mapped_column(Text)
    # Lever settings shown for seeded (illustrative) approvals that predate the engine
    settings: Mapped[dict] = mapped_column(default=dict)
    approved_by: Mapped[str] = mapped_column(String(200))
    approved_on: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
