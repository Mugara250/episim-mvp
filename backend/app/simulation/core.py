"""Stochastic SEIHFR core, vectorised across Monte Carlo runs and districts.

A port of frontend/src/lib/models/seihfr.ts (Legrand-style model). State arrays have shape (runs, districts).
With one district and no movement it reduces exactly to the TypeScript equations; the geographic model adds
movement-weighted coupling of community transmission between districts.

S susceptible · E exposed · I infectious in the community · H in hospital
F dead, not yet buried (funeral transmission) · R removed (recovered, safely buried, buried, vaccinated).
Health-worker infections come from a separate staff pool and enter E (they are not drawn from S).
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field

import numpy as np

from .errors import Cancelled

DEFAULT_ROUTE_SHARE = {"community": 0.55, "hospital": 0.15, "funeral": 0.30}
# Placeholder constants from the prototype engine (docs Module 6); an epidemiologist should check them first.
TRACING_STRENGTH = 0.6  # how strongly contact tracing cuts community transmission
ISOLATION_STRENGTH = 0.8  # how strongly isolation cuts hospital transmission
HOSPITAL_UNSAFE_FACTOR = 0.3  # hospital deaths are less likely than community deaths to lead to unsafe burial
DEFAULT_HCW = {"pool": 600, "ppe_before": 0.3, "ppe_after": 0.85, "recognition_day": 14}
PROGRESS_EVERY = 5


def to_prob(rate):
    """Daily rate → probability that the event happens within one day."""
    return 1.0 - np.exp(-np.maximum(0.0, rate))


@dataclass
class CoreInputs:
    disease: dict
    populations: np.ndarray  # (D,)
    movement: np.ndarray  # (D, D) row-stochastic
    seed_index: int
    initial_cases: int
    days: int
    runs: int
    seed: int
    branching_until: int
    levers: dict  # name -> (days + 1, D)
    hcw: dict = field(default_factory=lambda: dict(DEFAULT_HCW))
    imports_per_day: np.ndarray | None = None  # (D,) expected imported infections per day


def derived_rates(d: dict) -> dict:
    """Transmission rates per route and the hospital stay, from the preset's baseline timings (as in TS)."""
    share = {**DEFAULT_ROUTE_SHARE, **(d.get("route_share") or {})}
    base_delay = float(d["onset_to_admission"])
    hosp_stay = max(
        2.0,
        d["cfr_hospital"] * d["onset_to_death"]
        + (1 - d["cfr_hospital"]) * d["onset_to_recovery"]
        - base_delay,
    )
    unsafe_deaths_per_case = (1 - d["hospitalised"]) * d["cfr_community"] + d["hospitalised"] * d[
        "cfr_hospital"
    ] * HOSPITAL_UNSAFE_FACTOR
    r0 = float(d["r0"])
    return {
        "hosp_stay": hosp_stay,
        "beta_i": r0 * share["community"] / base_delay,
        "beta_h": r0 * share["hospital"] / (d["hospitalised"] * hosp_stay),
        "beta_f": r0 * share["funeral"] / max(unsafe_deaths_per_case * d["burial_delay"], 1e-9),
    }


def _neg_bin(rng: np.random.Generator, mean: np.ndarray, k: np.ndarray) -> np.ndarray:
    """Negative binomial with mean and dispersion k, as a gamma–Poisson mixture (random.ts negBin)."""
    k = np.maximum(k, 0.001)
    positive = mean > 0
    scale = np.where(positive, mean, 1.0) / k
    lam = rng.gamma(k, scale)
    return np.where(positive, rng.poisson(lam), 0)


def simulate(
    inp: CoreInputs,
    progress: Callable[[float], None] = lambda f: None,
    should_cancel: Callable[[], bool] = lambda: False,
    debug: bool = False,
) -> dict:
    d = inp.disease
    rates = derived_rates(d)
    rng = np.random.Generator(np.random.PCG64(inp.seed))
    R, D, T = inp.runs, len(inp.populations), inp.days + 1
    pop = inp.populations.astype(np.int64)
    M = inp.movement
    pop_eff = pop.astype(float) @ M  # people present in each district
    hcw = {**DEFAULT_HCW, **(inp.hcw or {})}
    pool_share = hcw["pool"] * pop / pop.sum()
    lv = inp.levers

    S = np.tile(pop, (R, 1))
    E = np.zeros((R, D), np.int64)
    I = np.zeros((R, D), np.int64)  # noqa: E741
    H = np.zeros((R, D), np.int64)
    F = np.zeros((R, D), np.int64)
    Rm = np.zeros((R, D), np.int64)
    S[:, inp.seed_index] -= inp.initial_cases
    I[:, inp.seed_index] = inp.initial_cases
    staff = np.tile(np.round(pool_share).astype(np.int64), (R, 1))
    cum = I.copy()
    deaths = np.zeros((R, D), np.int64)
    recovered = np.zeros((R, D), np.int64)
    hcw_cum = np.zeros((R, D), np.int64)
    inf_cum = I.copy()
    imported = np.zeros((R, D), np.int64)

    rec = {
        "cumulative_d": np.zeros((R, T, D), np.int32),
        "hospitalised_d": np.zeros((R, T, D), np.int32),
        "active": np.zeros((R, T), np.int64),
        "hospitalised": np.zeros((R, T), np.int64),
        "funerals": np.zeros((R, T), np.int64),
        "cumulative": np.zeros((R, T), np.int64),
        "deaths": np.zeros((R, T), np.int64),
        "hcw_cumulative": np.zeros((R, T), np.int64),
        "community_cumulative": np.zeros((R, T), np.int64),
    }
    max_conservation_error = 0

    for day in range(T):
        if should_cancel():
            raise Cancelled()
        rec["cumulative_d"][:, day] = cum
        rec["hospitalised_d"][:, day] = H
        rec["active"][:, day] = (I + H).sum(1)
        rec["hospitalised"][:, day] = H.sum(1)
        rec["funerals"][:, day] = F.sum(1)
        rec["cumulative"][:, day] = cum.sum(1)
        rec["deaths"][:, day] = deaths.sum(1)
        rec["hcw_cumulative"][:, day] = hcw_cum.sum(1)
        rec["community_cumulative"][:, day] = (inf_cum - hcw_cum).sum(1)
        if debug:
            total = S + E + I + H + F + Rm
            err = np.abs(total - (pop + hcw_cum + imported)).max()
            err = max(err, np.abs(staff + hcw_cum - np.round(pool_share)).max())
            max_conservation_error = max(max_conservation_error, int(err))
        if day == inp.days:
            break

        ct, iso, sb = lv["contact_tracing"][day], lv["isolation"][day], lv["safe_burial"][day]
        beta_i = rates["beta_i"] * (1 - TRACING_STRENGTH * ct) * lv["community"][day]
        beta_h = rates["beta_h"] * (1 - ISOLATION_STRENGTH * iso) * lv["hospital"][day]

        # 1. New infections: community (movement-weighted), hospital and funeral routes.
        i_present = I @ M  # infectious people present in each district
        lam_here = beta_i * i_present / pop_eff + (beta_h * H + rates["beta_f"] * F) / pop
        lam = lam_here @ M.T  # residents' exposure, weighted by where they spend time
        branching = cum < inp.branching_until
        nb = np.minimum(S, _neg_bin(rng, lam * S, d["k"] * np.maximum(1, I + H + F)))
        bn = rng.binomial(S, to_prob(lam))
        new_e = np.where(branching, nb, bn)
        # 2. Health-worker layer: staff infected by hospitalised patients.
        protection = hcw["ppe_before"] if day < hcw["recognition_day"] else hcw["ppe_after"]
        hcw_rate = d["hcw_risk"] * (1 - protection) * H / np.maximum(1.0, pool_share)
        new_hcw = np.where((staff > 0) & (H > 0), rng.binomial(np.maximum(staff, 0), to_prob(hcw_rate)), 0)
        # 3. Progression.
        become_sick = rng.binomial(E, to_prob(1 / d["incubation"]))
        leave_community = rng.binomial(I, to_prob(1 / lv["detection"][day]))
        admitted = rng.binomial(leave_community, d["hospitalised"])
        not_admitted = leave_community - admitted
        die_community = rng.binomial(not_admitted, d["cfr_community"])
        leave_hospital = rng.binomial(H, to_prob(1 / rates["hosp_stay"]))
        die_hospital = rng.binomial(leave_hospital, d["cfr_hospital"])
        unsafe_c = rng.binomial(die_community, np.clip(1 - sb, 0, 1))
        unsafe_h = rng.binomial(die_hospital, np.clip((1 - sb) * HOSPITAL_UNSAFE_FACTOR, 0, 1))
        buried = rng.binomial(F, to_prob(1 / d["burial_delay"]))
        # 4. Vaccination (compartment shift S → R) and importation.
        vaccinated = rng.binomial(S - new_e, lv["vaccination"][day]) if lv["vaccination"][day].any() else 0
        imports = 0
        if inp.imports_per_day is not None and inp.imports_per_day.any():
            imports = rng.poisson(np.broadcast_to(inp.imports_per_day, (R, D)))

        S = S - new_e - vaccinated
        staff = staff - new_hcw
        E = E + new_e + new_hcw + imports - become_sick
        I = I + become_sick - leave_community  # noqa: E741
        H = H + admitted - leave_hospital
        F = F + unsafe_c + unsafe_h - buried
        recov = (not_admitted - die_community) + (leave_hospital - die_hospital)
        Rm = Rm + recov + (die_community - unsafe_c) + (die_hospital - unsafe_h) + buried + vaccinated
        recovered = recovered + recov
        cum = cum + become_sick
        deaths = deaths + die_community + die_hospital
        hcw_cum = hcw_cum + new_hcw
        inf_cum = inf_cum + new_e + new_hcw + imports
        imported = imported + imports

        if day % PROGRESS_EVERY == 0:
            progress((day + 1) / inp.days)

    progress(1.0)
    rec.update(
        final_cases=cum.sum(1),
        final_deaths=deaths.sum(1),
        final_recovered=recovered.sum(1),
        hcw_infections=hcw_cum.sum(1),
        total_infections=inf_cum.sum(1),
        peak_hospitalised=rec["hospitalised"].max(1),
    )
    if debug:
        rec["max_conservation_error"] = max_conservation_error
    return rec
