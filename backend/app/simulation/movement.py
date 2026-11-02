"""Estimated movement between districts (gravity model). Always labelled "estimated": no mobility data.

trips_ij ∝ P_i × P_j / (d_ij² + offset²). Each district's residents spend `away_share` of their time in
other districts, split in proportion to trips_ij. The result is a row-stochastic matrix M where M[i, j] is
the share of time residents of i spend in j.
"""

from __future__ import annotations

import math

import numpy as np

DEFAULT_MOVEMENT = {"method": "gravity", "away_share": 0.02, "distance_offset_km": 10.0}
NOTE = (
    "Estimated with a gravity model from district population and distance between district centres. "
    "It is not observed travel data."
)


def haversine_km(lon1, lat1, lon2, lat2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def gravity_matrix(districts: list[dict], params: dict | None = None) -> tuple[np.ndarray, np.ndarray]:
    """Return (M, trips_per_day). M is row-stochastic; trips_per_day[i, j] = P_i × M[i, j] (person-days)."""
    p = {**DEFAULT_MOVEMENT, **(params or {})}
    n = len(districts)
    pop = np.array([float(d["population"]) for d in districts])
    if n == 1:
        return np.ones((1, 1)), np.zeros((1, 1))
    dist = np.zeros((n, n))
    for i, a in enumerate(districts):
        for j, b in enumerate(districts):
            if i != j:
                dist[i, j] = haversine_km(a["cx"], a["cy"], b["cx"], b["cy"])
    raw = np.outer(pop, pop) / (dist**2 + float(p["distance_offset_km"]) ** 2)
    np.fill_diagonal(raw, 0.0)
    away = float(p["away_share"])
    m = away * raw / raw.sum(axis=1, keepdims=True)
    np.fill_diagonal(m, 1.0 - away)
    return m, pop[:, None] * m


def top_links(districts: list[dict], trips: np.ndarray, n: int = 10) -> list[dict]:
    """The n strongest two-way links, as {from, to, tripsPerDay}."""
    links = []
    for i in range(len(districts)):
        for j in range(i + 1, len(districts)):
            links.append(
                {
                    "from": districts[i]["code"],
                    "to": districts[j]["code"],
                    "tripsPerDay": round(float(trips[i, j] + trips[j, i]), 1),
                }
            )
    links.sort(key=lambda link: -link["tripsPerDay"])
    return links[:n]


def describe(districts: list[dict], params: dict | None, trips: np.ndarray) -> dict:
    p = {**DEFAULT_MOVEMENT, **(params or {})}
    return {
        "method": p["method"],
        "estimated": True,
        "params": p,
        "note": NOTE,
        "links": top_links(districts, trips),
    }
