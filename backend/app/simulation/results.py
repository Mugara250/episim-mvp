"""Turn raw per-run arrays from core.simulate into the stored result (summary, run peaks, columnar bands)."""

from __future__ import annotations

import numpy as np

from .stats import bands, summarize

NATIONAL_SERIES = (
    "active",
    "hospitalised",
    "funerals",
    "cumulative",
    "deaths",
    "hcw_cumulative",
    "community_cumulative",
)


def incidence(cumulative: np.ndarray) -> np.ndarray:
    """Daily new cases from cumulative counts along the last-but-one / time axis 1 (day 0 = initial cases)."""
    inc = np.diff(cumulative, axis=1, prepend=0)
    return inc


def national_result(raw: dict, branching_until: int) -> dict:
    final_cases = raw["final_cases"]
    sized = raw["total_infections"] >= 10
    hcw_share = raw["hcw_infections"][sized] / raw["total_infections"][sized] if sized.any() else np.zeros(1)
    active = raw["active"]
    median_active = np.quantile(active, 0.5, axis=0, method="linear")
    series = {name: bands(raw[name]) for name in NATIONAL_SERIES}
    series["incidence"] = bands(incidence(raw["cumulative"]))
    summary = {
        "p_take_off": float(np.mean(final_cases >= branching_until)),
        "p_over_50": float(np.mean(final_cases > 50)),
        "p_over_100": float(np.mean(final_cases > 100)),
        "final_cases": summarize(final_cases),
        "final_deaths": summarize(raw["final_deaths"]),
        "peak_beds": summarize(raw["peak_hospitalised"]),
        "hcw_share": summarize(hcw_share),
        "hcw_infections": summarize(raw["hcw_infections"]),
        "peak_infectious": summarize(active.max(1)),
        "peak_day": summarize(active.argmax(1)),
        "recovered": summarize(raw["final_recovered"]),
        "median_curve_peak": {
            "value": round(float(median_active.max()), 2),
            "day": int(median_active.argmax()),
        },
    }
    return {
        "summary": summary,
        "run_peaks": raw["peak_hospitalised"].astype(int).tolist(),
        "series": series,
    }
