"""Readable ids such as RUN-0143, SC-1049, RPT-033."""

import re

from sqlalchemy import select
from sqlalchemy.orm import Session


def next_code(db: Session, model, prefix: str, width: int = 4, start: int = 1) -> str:
    pattern = re.compile(rf"^{re.escape(prefix)}(\d+)$")
    highest = start - 1
    for (value,) in db.execute(select(model.id).where(model.id.like(f"{prefix}%"))):
        m = pattern.match(value)
        if m:
            highest = max(highest, int(m.group(1)))
    return f"{prefix}{highest + 1:0{width}d}"
