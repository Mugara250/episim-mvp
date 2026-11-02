from datetime import UTC, date, datetime

from pydantic import BaseModel, ConfigDict, field_serializer
from pydantic.alias_generators import to_camel


def as_utc(value: datetime) -> datetime:
    """Timestamps are stored as naive UTC; mark them as UTC so browsers don't read them as local time."""
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value


class CamelModel(BaseModel):
    """API bodies are camelCase (DECISIONS X3); Python attributes stay snake_case."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    @field_serializer("*", mode="wrap")
    def _utc_timestamps(self, value, handler):
        return handler(as_utc(value) if isinstance(value, datetime) else value)


class Range(CamelModel):
    low: float | None = None
    median: float | None = None
    high: float | None = None


class Message(CamelModel):
    detail: str


def iso(d: datetime | date | None) -> str | None:
    return d.isoformat() if d else None
