"""Module 14 — User and access management (administrator console)."""

import os
import shutil
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import Field
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app import db as dbmod
from app.config import APP_VERSION, get_settings
from app.core.rbac import ROLE_LABELS, ROLES
from app.core.security import hash_password
from app.db import get_db
from app.deps import require
from app.models import (
    AccessRequest,
    Announcement,
    AuditLog,
    ImportJob,
    Institution,
    Report,
    SimulationRun,
    SupportTicket,
    SystemSetting,
    User,
)
from app.models.common import new_id, utcnow
from app.schemas.base import CamelModel
from app.schemas.users import UserOut
from app.services.audit import audit
from app.services.ids import next_code
from app.services.worker import engine_version, get_worker

router = APIRouter(prefix="/api/admin", tags=["admin"])
admin = require("users", "full")


class AdminUserOut(UserOut):
    organisation: str | None = None
    hospital_id: str | None = None
    illustrative: bool = False


def _user_out(u: User) -> AdminUserOut:
    base = UserOut.of(u).model_dump()
    return AdminUserOut(
        **base,
        organisation=base["institution_name"],
        hospital_id=u.institution_id if u.institution and u.institution.is_hospital else None,
        illustrative=u.illustrative,
    )


class UserIn(CamelModel):
    name: str = Field(min_length=1)
    email: str
    role: str
    title: str | None = None
    institution_id: str | None = None
    status: str = Field("Active", pattern="^(Active|Inactive|Pending)$")
    password: str | None = Field(None, min_length=6)
    can_edit_builtins: bool = False


def _check_user(db: Session, body: UserIn, own_id: str | None):
    if body.role not in ROLES:
        raise HTTPException(422, "Unknown role.")
    inst = db.get(Institution, body.institution_id) if body.institution_id else None
    if body.institution_id and inst is None:
        raise HTTPException(422, "Unknown institution.")
    if body.role == "officer" and not (inst and inst.is_hospital):
        raise HTTPException(422, "Public Health Officers must be linked to a hospital.")
    clash = db.scalar(select(User).where(func.lower(User.email) == body.email.strip().lower()))
    if clash and clash.id != own_id:
        raise HTTPException(409, "Another account uses this email.")


@router.get("/users", response_model=list[AdminUserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(admin)):
    return [_user_out(u) for u in db.scalars(select(User).order_by(User.name))]


@router.post("/users", response_model=AdminUserOut, status_code=201)
def create_user(body: UserIn, db: Session = Depends(get_db), user: User = Depends(admin)):
    _check_user(db, body, None)
    if not body.password:
        raise HTTPException(422, "Set an initial password (at least 6 characters).")
    u = User(
        id=next_code(db, User, "U-", 2, 1),
        name=body.name,
        email=body.email.strip().lower(),
        role=body.role,
        title=body.title,
        institution_id=body.institution_id,
        status=body.status,
        password_hash=hash_password(body.password),
        can_edit_builtins=body.can_edit_builtins,
    )
    db.add(u)
    audit(db, user, "User created", u.name, f"{ROLE_LABELS[u.role]} · {u.email}")
    db.commit()
    return _user_out(u)


@router.put("/users/{uid}", response_model=AdminUserOut)
def update_user(uid: str, body: UserIn, db: Session = Depends(get_db), user: User = Depends(admin)):
    u = db.get(User, uid)
    if u is None:
        raise HTTPException(404, "User not found.")
    _check_user(db, body, u.id)
    if u.id == user.id and (body.role != "admin" or body.status != "Active"):
        raise HTTPException(409, "You cannot remove your own administrator access.")
    changes = []
    if u.role != body.role:
        changes.append(f"role {ROLE_LABELS[u.role]} → {ROLE_LABELS[body.role]}")
    if u.status != body.status:
        changes.append(f"status {u.status} → {body.status}")
    u.name, u.email, u.role, u.title = body.name, body.email.strip().lower(), body.role, body.title
    u.institution_id, u.status, u.can_edit_builtins = body.institution_id, body.status, body.can_edit_builtins
    if body.password:
        u.password_hash = hash_password(body.password)
        changes.append("password reset")
    audit(db, user, "User updated", u.name, "; ".join(changes) or "details edited")
    db.commit()
    return _user_out(u)


class StatusIn(CamelModel):
    status: str = Field(pattern="^(Active|Inactive)$")


@router.put("/users/{uid}/status", response_model=AdminUserOut)
def set_status(uid: str, body: StatusIn, db: Session = Depends(get_db), user: User = Depends(admin)):
    u = db.get(User, uid)
    if u is None:
        raise HTTPException(404, "User not found.")
    if u.id == user.id:
        raise HTTPException(409, "You cannot deactivate your own account.")
    old, u.status = u.status, body.status
    audit(db, user, "Account status changed", u.name, f"{old} → {body.status}")
    db.commit()
    return _user_out(u)


class AccessRequestOut(CamelModel):
    id: str
    name: str
    email: str
    institution: str
    institution_account_id: str
    position: str
    status: str
    submitted_at: datetime
    decided_at: datetime | None
    decided_by: str | None
    assigned_role: str | None
    rejection_reason: str | None
    seen_by_admin: bool
    illustrative: bool


@router.get("/access-requests", response_model=list[AccessRequestOut])
def list_requests(db: Session = Depends(get_db), _: User = Depends(admin)):
    return [
        AccessRequestOut.model_validate(r)
        for r in db.scalars(select(AccessRequest).order_by(AccessRequest.submitted_at.desc()))
    ]


@router.post("/access-requests/mark-seen", status_code=204)
def mark_seen(db: Session = Depends(get_db), _: User = Depends(admin)):
    for r in db.scalars(select(AccessRequest).where(AccessRequest.seen_by_admin.is_(False))):
        r.seen_by_admin = True
    db.commit()


class ApproveRequestIn(CamelModel):
    role: str
    institution_id: str | None = None


@router.post("/access-requests/{rid}/approve", response_model=AdminUserOut)
def approve_request(
    rid: str, body: ApproveRequestIn, db: Session = Depends(get_db), user: User = Depends(admin)
):
    """Creates the account with the role the administrator assigns (docs D11)."""
    r = db.get(AccessRequest, rid)
    if r is None or r.status != "Pending":
        raise HTTPException(404, "No pending request with that id.")
    if body.role not in ROLES:
        raise HTTPException(422, "Unknown role.")
    inst_id = body.institution_id
    if inst_id is None:
        inst = db.scalar(select(Institution).where(func.lower(Institution.name) == r.institution.lower()))
        if inst is None:
            inst = Institution(id=new_id("ORG-"), name=r.institution, kind="Organisation")
            db.add(inst)
            db.flush()
        inst_id = inst.id
    if body.role == "officer":
        inst = db.get(Institution, inst_id)
        if not (inst and inst.is_hospital):
            raise HTTPException(422, "Public Health Officers must be linked to a hospital. Choose one.")
    if db.scalar(select(User).where(func.lower(User.email) == r.email.lower())):
        raise HTTPException(409, "An account with this email already exists.")
    u = User(
        id=next_code(db, User, "U-", 2, 1),
        name=r.name,
        email=r.email.lower(),
        role=body.role,
        title=r.position,
        institution_id=inst_id,
        status="Active",
        password_hash=r.password_hash,
    )
    db.add(u)
    r.status, r.assigned_role, r.decided_at, r.decided_by, r.seen_by_admin = (
        "Approved",
        body.role,
        utcnow(),
        user.name,
        True,
    )
    audit(db, user, "User created", u.name, f"Access request {r.id} approved as {ROLE_LABELS[body.role]}")
    db.commit()
    return _user_out(u)


class RejectIn(CamelModel):
    reason: str = Field(min_length=1)


@router.post("/access-requests/{rid}/reject", response_model=AccessRequestOut)
def reject_request(rid: str, body: RejectIn, db: Session = Depends(get_db), user: User = Depends(admin)):
    r = db.get(AccessRequest, rid)
    if r is None or r.status != "Pending":
        raise HTTPException(404, "No pending request with that id.")
    r.status, r.rejection_reason, r.decided_at, r.decided_by, r.seen_by_admin = (
        "Rejected",
        body.reason,
        utcnow(),
        user.name,
        True,
    )
    audit(db, user, "Access request rejected", r.email, body.reason)
    db.commit()
    return AccessRequestOut.model_validate(r)


class AuditOut(CamelModel):
    id: int
    time: datetime
    user: str
    role: str
    action: str
    target: str
    details: str
    illustrative: bool


@router.get("/audit-log")
def audit_log(
    q: str | None = None,
    action: str | None = None,
    user_name: str | None = Query(None, alias="user"),
    since: datetime | None = None,
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db),
    _: User = Depends(admin),
):
    stmt = select(AuditLog)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            AuditLog.target.ilike(like) | AuditLog.details.ilike(like) | AuditLog.user_name.ilike(like)
        )
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if user_name:
        stmt = stmt.where(AuditLog.user_name == user_name)
    if since:
        stmt = stmt.where(AuditLog.time >= since)
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = db.scalars(
        stmt.order_by(AuditLog.time.desc(), AuditLog.id.desc()).limit(min(limit, 1000)).offset(offset)
    )
    actions = [a for (a,) in db.execute(select(AuditLog.action).distinct().order_by(AuditLog.action))]
    return {
        "total": total,
        "actions": actions,
        "items": [
            AuditOut(
                id=a.id,
                time=a.time,
                user=a.user_name,
                role=a.role,
                action=a.action,
                target=a.target,
                details=a.details,
                illustrative=a.illustrative,
            ).model_dump(by_alias=True)
            for a in rows
        ],
    }


class HospitalIn(CamelModel):
    name: str = Field(min_length=1)
    district: str
    isolation_beds: int = Field(ge=0)
    kind: str = Field(
        "District hospital catchment", pattern="^(District hospital catchment|Referral hospital)$"
    )


class HospitalOut(HospitalIn):
    id: str
    registered: str | None
    illustrative: bool


@router.get("/hospitals", response_model=list[HospitalOut])
def list_hospitals(db: Session = Depends(get_db), _: User = Depends(admin)):
    rows = db.scalars(
        select(Institution)
        .where(Institution.kind.in_(["District hospital catchment", "Referral hospital"]))
        .order_by(Institution.id)
    )
    return [
        HospitalOut(
            id=h.id,
            name=h.name,
            district=h.district or "",
            isolation_beds=h.isolation_beds or 0,
            kind=h.kind,
            registered=h.registered,
            illustrative=h.illustrative,
        )
        for h in rows
    ]


def _check_hospital(db: Session, body: HospitalIn, own_id: str | None):
    from app.services.geo_data import district_by_name

    if body.district.lower() not in district_by_name():
        raise HTTPException(422, "Choose one of Rwanda's 30 districts.")
    clash = db.scalar(select(Institution).where(func.lower(Institution.name) == body.name.strip().lower()))
    if clash and clash.id != own_id:
        raise HTTPException(409, "Another institution has this name.")


@router.post("/hospitals", response_model=HospitalOut, status_code=201)
def create_hospital(body: HospitalIn, db: Session = Depends(get_db), user: User = Depends(admin)):
    _check_hospital(db, body, None)
    h = Institution(
        id=next_code(db, Institution, "H-", 2, 1),
        name=body.name.strip(),
        kind=body.kind,
        district=body.district,
        isolation_beds=body.isolation_beds,
        registered=utcnow().date().isoformat(),
    )
    db.add(h)
    audit(db, user, "Hospital registered", h.name, f"{h.district}, {h.isolation_beds} isolation beds")
    db.commit()
    return HospitalOut(
        id=h.id,
        name=h.name,
        district=h.district,
        isolation_beds=h.isolation_beds,
        kind=h.kind,
        registered=h.registered,
        illustrative=False,
    )


@router.put("/hospitals/{hid}", response_model=HospitalOut)
def update_hospital(hid: str, body: HospitalIn, db: Session = Depends(get_db), user: User = Depends(admin)):
    h = db.get(Institution, hid)
    if h is None or not h.is_hospital:
        raise HTTPException(404, "Hospital not found.")
    _check_hospital(db, body, h.id)
    h.name, h.district, h.isolation_beds, h.kind = (
        body.name.strip(),
        body.district,
        body.isolation_beds,
        body.kind,
    )
    audit(db, user, "Hospital updated", h.name, f"{h.district}, {h.isolation_beds} isolation beds")
    db.commit()
    return HospitalOut(
        id=h.id,
        name=h.name,
        district=h.district,
        isolation_beds=h.isolation_beds,
        kind=h.kind,
        registered=h.registered,
        illustrative=h.illustrative,
    )


@router.get("/system-health")
def system_health(db: Session = Depends(get_db), _: User = Depends(admin)):
    """Real checks: database, worker queue, run and import counts, disk. Nothing here is simulated."""
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:  # noqa: BLE001
        db_ok = False
    counts = dict(db.execute(select(SimulationRun.status, func.count()).group_by(SimulationRun.status)).all())
    files = get_settings().files_path
    files.mkdir(parents=True, exist_ok=True)
    disk = shutil.disk_usage(files)
    url = dbmod.engine.url
    db_size = None
    if url.drivername.startswith("sqlite") and url.database and os.path.exists(url.database):
        db_size = os.path.getsize(url.database)
    durations = [
        d
        for (d,) in db.execute(
            select(SimulationRun.duration_sec)
            .where(SimulationRun.status == "completed")
            .order_by(SimulationRun.completed_at.desc())
            .limit(20)
        )
        if d is not None
    ]
    return {
        "checkedAt": utcnow(),
        "appVersion": APP_VERSION,
        "engineVersion": engine_version(),
        "database": {"ok": db_ok, "driver": url.drivername, "sizeBytes": db_size},
        "worker": {"threads": get_settings().worker_threads, "queueDepth": get_worker().queue_depth},
        "runs": {s: counts.get(s, 0) for s in ("queued", "running", "completed", "failed", "cancelled")},
        "recentRunSeconds": {
            "count": len(durations),
            "mean": sum(durations) / len(durations) if durations else None,
            "max": max(durations) if durations else None,
        },
        "imports": dict(db.execute(select(ImportJob.status, func.count()).group_by(ImportJob.status)).all()),
        "reports": dict(db.execute(select(Report.status, func.count()).group_by(Report.status)).all()),
        "users": {"active": db.scalar(select(func.count()).select_from(User).where(User.status == "Active"))},
        "disk": {"totalBytes": disk.total, "freeBytes": disk.free},
        "demoMode": get_settings().demo_mode,
    }


class AnnouncementIn(CamelModel):
    title: str = Field(min_length=1)
    body: str = ""
    audience: str = "all"
    level: str = Field("info", pattern="^(info|warning|critical)$")
    published: bool = True


class AnnouncementOut(AnnouncementIn):
    id: str
    created_by: str
    created_at: datetime
    illustrative: bool


@router.get("/announcements", response_model=list[AnnouncementOut])
def list_announcements(db: Session = Depends(get_db), _: User = Depends(admin)):
    return [
        AnnouncementOut.model_validate(a)
        for a in db.scalars(select(Announcement).order_by(Announcement.created_at.desc()))
    ]


@router.post("/announcements", response_model=AnnouncementOut, status_code=201)
def create_announcement(body: AnnouncementIn, db: Session = Depends(get_db), user: User = Depends(admin)):
    a = Announcement(id=new_id("ANN-"), created_by=user.name, **body.model_dump())
    db.add(a)
    audit(db, user, "Announcement published" if a.published else "Announcement drafted", a.title)
    db.commit()
    return AnnouncementOut.model_validate(a)


@router.put("/announcements/{aid}", response_model=AnnouncementOut)
def update_announcement(
    aid: str, body: AnnouncementIn, db: Session = Depends(get_db), user: User = Depends(admin)
):
    a = db.get(Announcement, aid)
    if a is None:
        raise HTTPException(404, "Announcement not found.")
    for k, v in body.model_dump().items():
        setattr(a, k, v)
    audit(db, user, "Announcement updated", a.title)
    db.commit()
    return AnnouncementOut.model_validate(a)


@router.delete("/announcements/{aid}", status_code=204)
def delete_announcement(aid: str, db: Session = Depends(get_db), user: User = Depends(admin)):
    a = db.get(Announcement, aid)
    if a is None:
        raise HTTPException(404, "Announcement not found.")
    db.delete(a)
    audit(db, user, "Announcement deleted", a.title)
    db.commit()


class TicketIn(CamelModel):
    subject: str = Field(min_length=1)
    body: str = ""
    priority: str = Field("Medium", pattern="^(Low|Medium|High|Critical)$")


class TicketOut(TicketIn):
    id: str
    requester: str
    status: str
    created_at: datetime
    updated_at: datetime
    illustrative: bool


class TicketStatusIn(CamelModel):
    status: str = Field(pattern="^(Open|In Progress|Resolved|Closed)$")


@router.get("/tickets", response_model=list[TicketOut])
def list_tickets(db: Session = Depends(get_db), _: User = Depends(admin)):
    return [
        TicketOut.model_validate(t)
        for t in db.scalars(select(SupportTicket).order_by(SupportTicket.created_at.desc()))
    ]


@router.put("/tickets/{tid}/status", response_model=TicketOut)
def ticket_status(tid: str, body: TicketStatusIn, db: Session = Depends(get_db), user: User = Depends(admin)):
    t = db.get(SupportTicket, tid)
    if t is None:
        raise HTTPException(404, "Ticket not found.")
    t.status, t.updated_at = body.status, utcnow()
    audit(db, user, "Support ticket updated", t.subject, body.status)
    db.commit()
    return TicketOut.model_validate(t)


@router.get("/settings")
def get_system_settings(db: Session = Depends(get_db), _: User = Depends(admin)):
    stored = {s.key: s.value for s in db.scalars(select(SystemSetting))}
    s = get_settings()
    return {
        "stored": stored,
        "runtime": {
            "demoMode": s.demo_mode,
            "jwtExpireMinutes": s.jwt_expire_minutes,
            "workerThreads": s.worker_threads,
            "requireDistinctApprover": s.require_distinct_approver,
            "whatIfRuns": s.what_if_runs,
        },
        "note": "Runtime values come from environment variables (.env) and are read-only here.",
    }


@router.put("/settings/{key}")
def put_system_setting(key: str, value: dict, db: Session = Depends(get_db), user: User = Depends(admin)):
    row = db.get(SystemSetting, key) or SystemSetting(key=key)
    row.value, row.updated_by, row.updated_at = value, user.name, utcnow()
    db.add(row)
    audit(db, user, "Setting changed", key, str(value)[:200])
    db.commit()
    return {"key": key, "value": value}


# Support tickets can be raised by any signed-in user.
public_router = APIRouter(prefix="/api", tags=["admin"])


@public_router.post("/support-tickets", response_model=TicketOut, status_code=201)
def raise_ticket(body: TicketIn, db: Session = Depends(get_db), user: User = Depends(require("auth"))):
    t = SupportTicket(id=next_code(db, SupportTicket, "T-", 3, 1), requester=user.name, **body.model_dump())
    db.add(t)
    audit(db, user, "Support ticket raised", t.subject)
    db.commit()
    return TicketOut.model_validate(t)


@public_router.get("/announcements", response_model=list[AnnouncementOut])
def published_announcements(db: Session = Depends(get_db), _: User = Depends(require("auth"))):
    rows = db.scalars(
        select(Announcement).where(Announcement.published.is_(True)).order_by(Announcement.created_at.desc())
    )
    return [AnnouncementOut.model_validate(a) for a in rows]
