"""District metapopulation SEIHFR model over Rwanda's districts (model_type "seihfr_geo").

Each district runs its own SEIHFR dynamics; community transmission is coupled by an estimated gravity
movement matrix (movement.py). Seeded in one district. Optional what-if: from `geo.response.start_day`
the responding district's levers move to the placeholder full-response set (levers.FULL_RESPONSE).
Optional border importation adds Poisson imported infections in entry districts (off by default).
"""

from __future__ import annotations

from collections.abc import Callable

import numpy as np

from .core import CoreInputs, simulate
from .districts import with_centroids
from .levers import apply_full_response, build_levers
from .movement import describe, gravity_matrix
from .results import incidence, national_result
from .stats import bands, summarize
from .version import ENGINE_VERSION


def core_inputs(snapshot: dict) -> tuple[CoreInputs, list[dict], np.ndarray]:
    geo = snapshot.get("geo") or {}
    districts = with_centroids(snapshot["population"]["districts"])
    codes = [d["code"] for d in districts]
    seed_code = geo.get("seed_district_code")
    if seed_code not in codes:
        raise ValueError(f"seed_district_code {seed_code!r} is not one of the dataset's districts")
    days = int(snapshot["days"])
    D = len(districts)
    base = build_levers(snapshot["disease"], (snapshot.get("interventions") or {}).get("items"), days)
    levers = {k: np.repeat(v[:, None], D, axis=1) for k, v in base.items()}
    response = geo.get("response")
    if response and response.get("district_code") is not None:
        j = codes.index(response["district_code"])
        resp = apply_full_response(base, int(response["start_day"]))
        for k in levers:
            levers[k][:, j] = resp[k]
    movement, trips = gravity_matrix(districts, geo.get("movement"))
    imports = np.zeros(D)
    for b in geo.get("border_importation") or []:
        if b.get("entry_district_code") in codes:
            imports[codes.index(b["entry_district_code"])] += float(b.get("weekly_rate", 0)) / 7
    inp = CoreInputs(
        disease=snapshot["disease"],
        populations=np.array([int(d["population"]) for d in districts]),
        movement=movement,
        seed_index=codes.index(seed_code),
        initial_cases=int(snapshot["initial_cases"]),
        days=days,
        runs=int(snapshot["runs"]),
        seed=int(snapshot["seed"]),
        branching_until=int(snapshot.get("branching_until", 20)),
        levers=levers,
        hcw=snapshot.get("hcw") or {},
        imports_per_day=imports,
    )
    return inp, districts, trips


def _first_day(cum: np.ndarray, days: int) -> np.ndarray:
    """Per run, first day with at least one case; days + 1 when never reached. cum: (runs, T)."""
    reached = cum >= 1
    return np.where(reached.any(1), reached.argmax(1), days + 1)


def district_results(raw: dict, districts: list[dict], days: int) -> list[dict]:
    out = []
    for j, d in enumerate(districts):
        cum = raw["cumulative_d"][:, :, j].astype(np.int64)
        hosp = raw["hospitalised_d"][:, :, j]
        inc = incidence(cum)
        first = _first_day(cum, days)
        reached = first <= days
        fd = summarize(first, digits=1)
        first_case_day = {k: (None if v > days else v) for k, v in fd.items()}
        peak_day = (
            summarize(inc[reached].argmax(1))
            if reached.any()
            else {"low": None, "median": None, "high": None}
        )
        peaks = hosp.max(1)
        out.append(
            {
                "code": d["code"],
                "name": d.get("name"),
                "population": int(d["population"]),
                "p_reached": float(reached.mean()),
                "first_case_day": first_case_day,
                "total_cases": summarize(cum[:, -1]),
                "peak_day": peak_day,
                "peak_hospitalised": summarize(peaks),
                "series": {
                    "cumulative": bands(cum),
                    "hospitalised": bands(hosp),
                    "incidence": bands(inc)["median"],
                },
                "run_peak_hospitalised": peaks.astype(int).tolist(),
            }
        )
    return out


def run_seihfr_geo(
    snapshot: dict,
    progress: Callable[[float], None] = lambda f: None,
    should_cancel: Callable[[], bool] = lambda: False,
) -> dict:
    inp, districts, trips = core_inputs(snapshot)
    raw = simulate(inp, progress, should_cancel)
    result = national_result(raw, inp.branching_until)
    geo = snapshot.get("geo") or {}
    result["districts"] = district_results(raw, districts, inp.days)
    result["movement"] = describe(districts, geo.get("movement"), trips)
    result["meta"] = {
        "model_type": "seihfr_geo",
        "engine_version": ENGINE_VERSION,
        "runs": inp.runs,
        "days": inp.days,
        "seed": inp.seed,
        "seed_district_code": geo.get("seed_district_code"),
        "response": geo.get("response"),
    }
    return result
