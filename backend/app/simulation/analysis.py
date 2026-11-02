"""Capacity checks applied at analysis time (capacity is never an engine input)."""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np


def p_beds_exceeded(run_peaks: Sequence[float], beds: float) -> float:
    """Share of Monte Carlo runs whose peak hospitalised exceeds the available beds."""
    peaks = np.asarray(run_peaks, dtype=float)
    if peaks.size == 0:
        return 0.0
    return float(np.mean(peaks > beds))


def first_day_over(values: Sequence[float], beds: float) -> int | None:
    """First day index where values exceed beds, or None if never."""
    for day, v in enumerate(values):
        if v > beds:
            return day
    return None


def district_bed_status(districts: list[dict], capacity: dict[str, float]) -> list[dict]:
    """Per district: beds, median peak bed demand, chance beds run out and the day the median runs out.

    `districts` is result["districts"] from seihfr_geo; `capacity` maps district code → beds.
    Districts missing from `capacity` get beds=None and are reported without a check.
    """
    out = []
    for d in districts:
        beds = capacity.get(d["code"])
        median_hosp = d["series"]["hospitalised"]["median"]
        row = {
            "code": d["code"],
            "beds": beds,
            "peak_bed_demand": d["peak_hospitalised"],
            "p_beds_exceeded": None,
            "beds_run_out_day": None,
            "status": "unknown",
        }
        if beds is not None:
            run_out = first_day_over(median_hosp, beds)
            row.update(
                p_beds_exceeded=p_beds_exceeded(d["run_peak_hospitalised"], beds),
                beds_run_out_day=run_out,
                status="short" if run_out is not None else "within",
            )
        out.append(row)
    return out


def utilisation(hospitalised: Sequence[float], beds: float) -> list[float]:
    """Bed demand as a share of beds, per day (for the beds-vs-capacity map view)."""
    if not beds:
        return [0.0 for _ in hospitalised]
    return [round(float(v) / beds, 3) for v in hospitalised]
