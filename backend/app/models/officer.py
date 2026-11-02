"""Module 17 — Hospital data and response operations. Counts only, never patient details."""

from datetime import datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.common import utcnow


class HospitalEntry(Base):
    __tablename__ = "hospital_entries"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    hospital_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), index=True)
    date: Mapped[datetime] = mapped_column(Date)
    disease: Mapped[str] = mapped_column(String(20))
    suspected: Mapped[int] = mapped_column(Integer, default=0)
    confirmed: Mapped[int] = mapped_column(Integer, default=0)
    in_isolation: Mapped[int] = mapped_column(Integer, default=0)
    recovered: Mapped[int] = mapped_column(Integer, default=0)
    deaths: Mapped[int] = mapped_column(Integer, default=0)
    hcw_infected: Mapped[int] = mapped_column(Integer, default=0)
    beds_total: Mapped[int] = mapped_column(Integer, default=0)
    beds_occupied: Mapped[int] = mapped_column(Integer, default=0)
    ppe_stock: Mapped[str] = mapped_column(String(10), default="Good")
    trained_staff: Mapped[int] = mapped_column(Integer, default=0)
    burial_team_ready: Mapped[bool] = mapped_column(Boolean, default=True)
    contacts_follow_up: Mapped[int] = mapped_column(Integer, default=0)
    entered_by: Mapped[str | None] = mapped_column(String(200))
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Instruction(Base):
    __tablename__ = "response_instructions"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    hospital_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), index=True)
    action: Mapped[str] = mapped_column(String(300))
    target: Mapped[str] = mapped_column(String(200), default="")
    deadline: Mapped[datetime] = mapped_column(Date)
    from_name: Mapped[str] = mapped_column(String(200))
    disease: Mapped[str] = mapped_column(String(20))
    received: Mapped[datetime] = mapped_column(Date)
    # Not started | In progress | Done | Can't do
    status: Mapped[str] = mapped_column(String(20), default="Not started")
    reason: Mapped[str | None] = mapped_column(Text)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ResponsePlan(Base):
    __tablename__ = "response_plans"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    hospital_id: Mapped[str] = mapped_column(ForeignKey("institutions.id"), index=True)
    title: Mapped[str] = mapped_column(String(300))
    disease: Mapped[str] = mapped_column(String(20))
    # Draft | Active
    status: Mapped[str] = mapped_column(String(10), default="Draft")
    start_date: Mapped[datetime] = mapped_column(Date)
    review_date: Mapped[datetime] = mapped_column(Date)
    actions: Mapped[list] = mapped_column(default=list)
    notes: Mapped[str] = mapped_column(Text, default="")
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
