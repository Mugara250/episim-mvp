from datetime import date, datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """API bodies are camelCase (DECISIONS X3); Python attributes stay snake_case."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class Range(CamelModel):
    low: float | None = None
    median: float | None = None
    high: float | None = None


class Message(CamelModel):
    detail: str


def iso(d: datetime | date | None) -> str | None:
    return d.isoformat() if d else None
