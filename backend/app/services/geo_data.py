"""Reference data for Rwanda's 30 districts, read from the real boundary file."""

import json
from functools import lru_cache

from app.config import DATA_DIR

BOUNDARY_FILE = DATA_DIR / "rwanda-districts.geojson"


@lru_cache
def boundary_geojson() -> dict:
    with open(BOUNDARY_FILE, encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache
def districts() -> list[dict]:
    """[{code, name, province, cx, cy}] sorted by code."""
    return [dict(f["properties"]) for f in boundary_geojson()["features"]]


def district_by_code() -> dict[str, dict]:
    return {d["code"]: d for d in districts()}


def district_by_name() -> dict[str, dict]:
    return {d["name"].lower(): d for d in districts()}


@lru_cache
def reference_populations() -> dict[str, int]:
    """Approximate 2022 census populations per district (illustrative seed data)."""
    with open(DATA_DIR / "seed" / "districts.json", encoding="utf-8") as fh:
        return {d["code"]: d["population"] for d in json.load(fh)["districts"]}
