"""Audit log helper. Every mutating action writes one row."""

from sqlalchemy.orm import Session

from app.core.rbac import ROLE_LABELS
from app.models import AuditLog, User


def audit(db: Session, user: User | None, action: str, target: str = "", details: str = "") -> None:
    db.add(
        AuditLog(
            user_id=user.id if user else None,
            user_name=user.name if user else "System",
            role=ROLE_LABELS.get(user.role, user.role) if user else "System",
            action=action,
            target=target[:300],
            details=details,
        )
    )
