"""Turn an intervention package into day-by-day lever values.

Levers (arrays of length days + 1, indexed by day):
- contact_tracing, isolation, safe_burial: shares in [0, 1]. Start at the preset baseline; each active item
  closes part of the remaining gap: effective = 1 - (1 - baseline) * prod(1 - coverage * effect)  (docs D14).
- detection: days from onset to leaving the community. Baseline = onset_to_admission; each active testing
  item multiplies it by (1 - coverage * effect), floored at 1 day.
- community, hospital: multipliers on the community / hospital transmission rate, prod(1 - coverage * effect).
- vaccination: daily chance a susceptible person moves to Removed, sum of coverage * effect / window.
"""

from __future__ import annotations

import numpy as np

GAP_LEVERS = ("contact_tracing", "isolation", "safe_burial")
MULT_LEVERS = ("community", "hospital")
LEVERS = GAP_LEVERS + ("detection",) + MULT_LEVERS + ("vaccination",)

TYPE_KEY_TO_LEVER = {
    "contact_tracing": "contact_tracing",
    "case_isolation": "isolation",
    "isolation": "isolation",
    "safe_burials": "safe_burial",
    "safe_burial": "safe_burial",
    "testing": "detection",
    "lockdown": "community",
    "masking": "masking",
    "vaccination": "vaccination",
}

DEFAULT_BASELINE = {"safe_burial": 0.5, "contact_tracing": 0.4, "isolation": 0.5}


def lever_for(item: dict) -> str:
    """The lever an item acts on: explicit `lever`, else from its type key, else from its mechanism."""
    lever = item.get("lever") or TYPE_KEY_TO_LEVER.get(item.get("type_key", ""))
    if lever:
        return lever
    return "vaccination" if item.get("mechanism") == "shift" else "community"


def _window(item: dict, days: int) -> tuple[int, int]:
    start = max(0, int(item.get("start_day", 0)))
    end = item.get("end_day")
    end = days if end is None else min(days, int(end))
    return start, end


def build_levers(disease: dict, items: list[dict] | None, days: int) -> dict[str, np.ndarray]:
    baseline = {**DEFAULT_BASELINE, **(disease.get("baseline") or {})}
    n = days + 1
    gaps = {k: np.full(n, 1.0 - float(baseline[k])) for k in GAP_LEVERS}
    detection = np.full(n, float(disease.get("detection_delay") or disease["onset_to_admission"]))
    mult = {k: np.ones(n) for k in MULT_LEVERS}
    vaccination = np.zeros(n)

    for item in items or []:
        start, end = _window(item, days)
        if end < start:
            continue
        sl = slice(start, end + 1)
        strength = min(1.0, max(0.0, float(item.get("coverage", 0)) * float(item.get("effect", 0))))
        lever = lever_for(item)
        if lever in GAP_LEVERS:
            gaps[lever][sl] *= 1.0 - strength
        elif lever == "detection":
            detection[sl] *= 1.0 - strength
        elif lever == "masking":
            mult["community"][sl] *= 1.0 - strength
            mult["hospital"][sl] *= 1.0 - strength
        elif lever in MULT_LEVERS:
            mult[lever][sl] *= 1.0 - strength
        elif lever == "vaccination":
            vaccination[sl] += strength / max(end - start, 1)
        else:
            raise ValueError(f"Unknown intervention lever: {lever}")

    out = {k: np.clip(1.0 - gaps[k], 0.0, 1.0) for k in GAP_LEVERS}
    out["detection"] = np.maximum(detection, 1.0)
    out.update(mult)
    out["vaccination"] = np.clip(vaccination, 0.0, 1.0)
    return out


# Placeholder "full response" applied by the geographic what-if from its start day (needs review).
FULL_RESPONSE = {"contact_tracing": 0.8, "isolation": 0.9, "safe_burial": 0.9, "detection_factor": 0.5}


def apply_full_response(levers: dict[str, np.ndarray], start_day: int) -> dict[str, np.ndarray]:
    """Copy of `levers` with the full-response set from start_day on (never weaker than the package)."""
    out = {k: v.copy() for k, v in levers.items()}
    sl = slice(max(0, int(start_day)), None)
    for k in GAP_LEVERS:
        out[k][sl] = np.maximum(out[k][sl], FULL_RESPONSE[k])
    out["detection"][sl] = np.maximum(out["detection"][sl] * FULL_RESPONSE["detection_factor"], 1.0)
    return out
