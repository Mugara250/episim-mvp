"""Module 1 — Registration & authentication."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import (
    APP_VERSION,
    BOUNDARY_ATTRIBUTION,
    ESTIMATE_LABEL,
    ESTIMATE_SENTENCE,
    MOVEMENT_LABEL,
    get_settings,
)
from app.core.rbac import PERMISSION_MATRIX, ROLE_LABELS
from app.core.security import create_access_token, hash_password, verify_password
from app.db import get_db
from app.deps import current_user
from app.models import AccessRequest, User
from app.models.common import utcnow
from app.schemas.base import CamelModel
from app.schemas.users import UserOut
from app.services.audit import audit
from app.services.ids import next_code
from app.services.worker import engine_version

router = APIRouter(prefix="/api", tags=["auth"])

# The account each role signs in as from the role switcher (emails from frontend/src/pages/Login.tsx).
PRIMARY_DEMO_EMAILS = {
    "admin": "admin@moh.gov.rw",
    "analyst": "epidemiologist@rbc.gov.rw",
    "officer": "officer@who.int",
    "policymaker": "policymaker@moh.gov.rw",
}


class LoginIn(CamelModel):
    email: str
    password: str


class DemoLoginIn(CamelModel):
    role: str
    # Optional: a specific demo user of that role (e.g. the second epidemiologist, who approves reports)
    user_id: str | None = None


class TokenOut(CamelModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: UserOut


class MetaOut(CamelModel):
    demo_mode: bool
    app_version: str
    engine_version: str | None
    boundary_attribution: str
    estimate_label: str
    estimate_sentence: str
    movement_label: str
    role_labels: dict[str, str]
    permission_matrix: dict[str, dict[str, str]]
    demo_users: list[dict]


def _issue(db: Session, user: User, how: str) -> TokenOut:
    token, expires = create_access_token(user.id, user.role)
    user.last_login = utcnow()
    audit(db, user, "Sign in", "EpiSim", how)
    db.commit()
    return TokenOut(access_token=token, expires_at=expires, user=UserOut.of(user))


@router.get("/meta", response_model=MetaOut, tags=["meta"])
def meta(db: Session = Depends(get_db)):
    s = get_settings()
    demo_users = []
    if s.demo_mode:
        demo_users = [
            {"id": u.id, "name": u.name, "email": u.email, "role": u.role, "roleLabel": ROLE_LABELS[u.role]}
            for u in db.scalars(select(User).where(User.is_demo.is_(True)).order_by(User.id))
        ]
    return MetaOut(
        demo_mode=s.demo_mode,
        app_version=APP_VERSION,
        engine_version=engine_version(),
        boundary_attribution=BOUNDARY_ATTRIBUTION,
        estimate_label=ESTIMATE_LABEL,
        estimate_sentence=ESTIMATE_SENTENCE,
        movement_label=MOVEMENT_LABEL,
        role_labels=ROLE_LABELS,
        permission_matrix=PERMISSION_MATRIX,
        demo_users=demo_users,
    )


@router.post("/auth/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.scalar(select(User).where(func.lower(User.email) == email))
    if user is None:
        req = db.scalar(
            select(AccessRequest)
            .where(func.lower(AccessRequest.email) == email)
            .order_by(AccessRequest.submitted_at.desc())
        )
        if req is not None and req.status == "Pending":
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "Your account request is waiting for an administrator."
            )
        if req is not None and req.status == "Rejected":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Your account request was not approved.")
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "No account found with that email. Request an account or try one of the demo accounts.",
        )
    if user.is_demo and not get_settings().demo_mode:
        # Demo accounts have published passwords; they only work while DEMO_MODE is on.
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Demo accounts are turned off outside demo mode.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect password for this account.")
    if user.status != "Active":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "This account is not active. Contact an administrator."
        )
    return _issue(db, user, "Signed in with password")


@router.post("/auth/demo-login", response_model=TokenOut)
def demo_login(body: DemoLoginIn, db: Session = Depends(get_db)):
    """Demo mode only: sign in as the seeded demo user for a role (the role switcher in the top bar)."""
    if not get_settings().demo_mode:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Demo sign-in is turned off.")
    q = select(User).where(User.is_demo.is_(True), User.role == body.role, User.status == "Active")
    if body.user_id:
        q = q.where(User.id == body.user_id)
    else:
        q = q.where(User.email == PRIMARY_DEMO_EMAILS.get(body.role, ""))
    user = db.scalars(q.order_by(User.id)).first()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No demo user for that role.")
    return _issue(db, user, "Signed in as demo user")


@router.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return UserOut.of(user)


@router.post("/auth/logout", status_code=204)
def logout(user: User = Depends(current_user), db: Session = Depends(get_db)):
    audit(db, user, "Sign out", "EpiSim", "Signed out")
    db.commit()


class AccessRequestIn(CamelModel):
    name: str
    email: str
    institution: str
    institution_account_id: str = ""
    position: str = ""
    password: str


class AccessRequestStatusOut(CamelModel):
    id: str
    name: str
    email: str
    status: str
    submitted_at: datetime
    decided_at: datetime | None = None
    assigned_role: str | None = None
    rejection_reason: str | None = None


class PublicRequestStatusOut(CamelModel):
    """What anyone who knows an email may learn: whether a request exists and where it stands.
    Name, assigned role and rejection reason stay with administrators."""

    status: str
    submitted_at: datetime
    decided_at: datetime | None = None


@router.post("/access-requests", response_model=AccessRequestStatusOut, status_code=201, tags=["auth"])
def request_account(body: AccessRequestIn, db: Session = Depends(get_db)):
    """Public: request an account. An administrator approves it and assigns the role (docs D11)."""
    email = body.email.strip().lower()
    if "@" not in email:
        raise HTTPException(422, "Enter a valid email address.")
    if len(body.password) < 6:
        raise HTTPException(422, "Use a password of at least 6 characters.")
    if db.scalar(select(User).where(func.lower(User.email) == email)):
        raise HTTPException(409, "An account with this email already exists. Sign in instead.")
    pending = db.scalar(
        select(AccessRequest).where(
            func.lower(AccessRequest.email) == email, AccessRequest.status == "Pending"
        )
    )
    if pending:
        raise HTTPException(409, "A request for this email is already waiting for review.")
    req = AccessRequest(
        id=next_code(db, AccessRequest, "REQ-", 4, 1000),
        name=body.name.strip(),
        email=email,
        institution=body.institution,
        institution_account_id=body.institution_account_id,
        position=body.position,
        password_hash=hash_password(body.password),
    )
    db.add(req)
    audit(db, None, "Access requested", req.email, f"{req.name} · {req.institution}")
    db.commit()
    return AccessRequestStatusOut.model_validate(req)


@router.get("/access-requests/status", response_model=PublicRequestStatusOut, tags=["auth"])
def request_status(email: str, db: Session = Depends(get_db)):
    req = db.scalar(
        select(AccessRequest)
        .where(func.lower(AccessRequest.email) == email.strip().lower())
        .order_by(AccessRequest.submitted_at.desc())
    )
    if req is None:
        raise HTTPException(404, "No request found for that email.")
    return PublicRequestStatusOut.model_validate(req)
