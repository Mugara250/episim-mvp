"""Rt estimation (Cori et al. 2013), a direct port of frontend/src/lib/models/rt.ts."""

from __future__ import annotations

import math


def serial_weights(mean: float, sd: float, max_days: int = 60) -> list[float]:
    """Serial interval as daily weights (discretised gamma); index 0 unused."""
    shape = (mean / sd) ** 2
    scale = sd * sd / mean
    raw = [0.0] + [s ** (shape - 1) * math.exp(-s / scale) for s in range(1, max_days + 1)]
    total = sum(raw)
    return [v / total for v in raw]


def _gamma_quantile(shape: float, rate: float, z: float) -> float:
    """Wilson–Hilferty approximation of a gamma quantile."""
    v = 1 - 1 / (9 * shape) + z * math.sqrt(1 / (9 * shape))
    return shape * max(0.0, v) ** 3 / rate


def estimate_rt(
    cases: list[float],
    serial_interval: dict,
    window: int = 7,
    prior_mean: float = 5,
    prior_sd: float = 5,
) -> list[dict]:
    """Daily {day, cases, rt, low, high}; rt/low/high are None while there is not enough data."""
    w = serial_weights(serial_interval["mean"], serial_interval["sd"])
    a = (prior_mean / prior_sd) ** 2
    b = prior_sd * prior_sd / prior_mean
    lam = []
    for t in range(len(cases)):
        total = 0.0
        s = 1
        while s <= t and s < len(w):
            total += cases[t - s] * w[s]
            s += 1
        lam.append(total)
    out = []
    for t, c in enumerate(cases):
        point = {"day": t, "cases": c, "rt": None, "low": None, "high": None}
        if t >= window:
            sum_i = sum(cases[t - window + 1 : t + 1])
            sum_l = sum(lam[t - window + 1 : t + 1])
            if sum_l >= 1:
                shape = a + sum_i
                rate = 1 / b + sum_l
                point.update(
                    rt=shape / rate,
                    low=_gamma_quantile(shape, rate, -1.96),
                    high=_gamma_quantile(shape, rate, 1.96),
                )
        out.append(point)
    return out


def trend_of(point: dict | None) -> str:
    """growing / shrinking / uncertain / not-enough-data, from the 95% interval relative to 1."""
    if not point or point.get("rt") is None or point.get("low") is None or point.get("high") is None:
        return "not-enough-data"
    if point["low"] > 1:
        return "growing"
    if point["high"] < 1:
        return "shrinking"
    return "uncertain"
