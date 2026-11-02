"""Label positions (centroids) of Rwanda's districts, read from the bundled boundary file."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

GEOJSON = Path(__file__).resolve().parent.parent / "data" / "rwanda-districts.geojson"


@lru_cache(maxsize=1)
def centroids() -> dict[str, tuple[float, float]]:
    """{district code: (lon, lat)} from rwanda-districts.geojson."""
    data = json.loads(GEOJSON.read_text())
    return {f["properties"]["code"]: (f["properties"]["cx"], f["properties"]["cy"]) for f in data["features"]}


def with_centroids(districts: list[dict]) -> list[dict]:
    """Fill missing cx/cy on snapshot district rows from the boundary file."""
    known = centroids()
    out = []
    for d in districts:
        if d.get("cx") is None or d.get("cy") is None:
            if d["code"] not in known:
                raise ValueError(f"District {d['code']} has no position and is not in the boundary file")
            cx, cy = known[d["code"]]
            d = {**d, "cx": cx, "cy": cy}
        out.append(d)
    return out
