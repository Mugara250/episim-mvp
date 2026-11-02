"""Layer 1 — User & Access (Modules 1, 2, 14)."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.common import utcnow


class Institution(Base):
    """Hospitals, regions and organisations. Hospitals carry district and isolation beds."""

    __tablename__ = "institutions"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    # Region | District hospital catchment | Referral hospital | Organisation
    kind: Mapped[str] = mapped_column(String(40))
    district: Mapped[str | None] = mapped_column(String(80))
    isolation_beds: Mapped[int | None] = mapped_column(Integer)
    registered: Mapped[str | None] = mapped_column(String(20))
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)

    @property
    def is_hospital(self) -> bool:
        return self.kind in ("District hospital catchment", "Referral hospital")


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(20))
    title: Mapped[str | None] = mapped_column(String(200))
    institution_id: Mapped[str | None] = mapped_column(ForeignKey("institutions.id"))
    # Active | Inactive | Pending
    status: Mapped[str] = mapped_column(String(20), default="Active")
    last_login: Mapped[datetime | None] = mapped_column(DateTime)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)
    # Prototype prop canEditBuiltIns / docs permission edit_builtin_presets
    can_edit_builtins: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    institution: Mapped[Institution | None] = relationship(lazy="joined")


class AccessRequest(Base):
    __tablename__ = "access_requests"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(200), index=True)
    institution: Mapped[str] = mapped_column(String(200))
    institution_account_id: Mapped[str] = mapped_column(String(100), default="")
    position: Mapped[str] = mapped_column(String(200), default="")
    password_hash: Mapped[str] = mapped_column(String(300))
    # Pending | Approved | Rejected
    status: Mapped[str] = mapped_column(String(20), default="Pending")
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime)
    decided_by: Mapped[str | None] = mapped_column(String(200))
    assigned_role: Mapped[str | None] = mapped_column(String(20))
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    seen_by_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)


class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    time: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    user_id: Mapped[str | None] = mapped_column(String(40))
    user_name: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(40))
    action: Mapped[str] = mapped_column(String(80), index=True)
    target: Mapped[str] = mapped_column(String(300), default="")
    details: Mapped[str] = mapped_column(Text, default="")
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)


class Announcement(Base):
    __tablename__ = "announcements"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text, default="")
    audience: Mapped[str] = mapped_column(String(40), default="all")
    level: Mapped[str] = mapped_column(String(20), default="info")
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)


class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    subject: Mapped[str] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text, default="")
    requester: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="Open")
    priority: Mapped[str] = mapped_column(String(20), default="Medium")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    illustrative: Mapped[bool] = mapped_column(Boolean, default=False)


class SystemSetting(Base):
    __tablename__ = "system_settings"
    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[dict] = mapped_column(default=dict)
    updated_by: Mapped[str | None] = mapped_column(String(200))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
