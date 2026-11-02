from datetime import UTC, datetime
from uuid import uuid4


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def new_id(prefix: str = "") -> str:
    return f"{prefix}{uuid4().hex[:10]}"
