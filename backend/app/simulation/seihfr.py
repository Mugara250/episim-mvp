"""Single-population stochastic SEIHFR model (model_type "seihfr")."""

from __future__ import annotations

from collections.abc import Callable

import numpy as np

from .core import CoreInputs, simulate
from .levers import build_levers
from .results import national_result
from .version import ENGINE_VERSION


def core_inputs(snapshot: dict) -> CoreInputs:
    days = int(snapshot["days"])
    levers = build_levers(snapshot["disease"], (snapshot.get("interventions") or {}).get("items"), days)
    return CoreInputs(
        disease=snapshot["disease"],
        populations=np.array([int(snapshot["population"]["total"])]),
        movement=np.ones((1, 1)),
        seed_index=0,
        initial_cases=int(snapshot["initial_cases"]),
        days=days,
        runs=int(snapshot["runs"]),
        seed=int(snapshot["seed"]),
        branching_until=int(snapshot.get("branching_until", 20)),
        levers={k: v[:, None] for k, v in levers.items()},
        hcw=snapshot.get("hcw") or {},
    )


def run_seihfr(
    snapshot: dict,
    progress: Callable[[float], None] = lambda f: None,
    should_cancel: Callable[[], bool] = lambda: False,
) -> dict:
    inp = core_inputs(snapshot)
    raw = simulate(inp, progress, should_cancel)
    result = national_result(raw, inp.branching_until)
    result["meta"] = {
        "model_type": "seihfr",
        "engine_version": ENGINE_VERSION,
        "runs": inp.runs,
        "days": inp.days,
        "seed": inp.seed,
    }
    return result
