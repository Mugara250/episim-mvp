"""Quantiles and bands across Monte Carlo runs (same linear interpolation as the TS engine)."""

from __future__ import annotations

import numpy as np

QUANTILES = (0.05, 0.5, 0.95)


def quantile(values, q: float) -> float:
    """Linear-interpolated quantile, identical to stats.ts `quantile` on sorted input."""
    arr = np.asarray(values, dtype=float)
    if arr.size == 0:
        return 0.0
    return float(np.quantile(arr, q, method="linear"))


def summarize(values, digits: int = 4) -> dict:
    """5th, 50th and 95th percentile of a 1-D sample."""
    arr = np.asarray(values, dtype=float)
    if arr.size == 0:
        arr = np.zeros(1)
    low, median, high = np.quantile(arr, QUANTILES, method="linear")
    return {
        "low": round(float(low), digits),
        "median": round(float(median), digits),
        "high": round(float(high), digits),
    }


def bands(matrix, digits: int = 2) -> dict:
    """Columnar daily bands from a (runs, days) matrix: {low: [...], median: [...], high: [...]}."""
    arr = np.asarray(matrix, dtype=float)
    q = np.quantile(arr, QUANTILES, axis=0, method="linear")
    q = np.round(q, digits)
    return {"low": q[0].tolist(), "median": q[1].tolist(), "high": q[2].tolist()}
