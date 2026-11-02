"""Shapes stored engine results for the API, and applies capacity at analysis time."""

from app.config import ESTIMATE_LABEL
from app.models import CapacityProfile, SimulationResult, SimulationRun
from app.services.capacity import beds_for, first_day_over, p_beds_exceeded


def rng(block) -> dict:
    if isinstance(block, dict):
        return {"low": block.get("low"), "median": block.get("median"), "high": block.get("high")}
    if isinstance(block, (int, float)):
        return {"low": block, "median": block, "high": block}
    return {"low": None, "median": None, "high": None}


def summary_dict(res: SimulationResult) -> dict:
    s = res.summary or {}
    return {
        "pTakeOff": res.p_take_off,
        "pOver50": res.p_over_50,
        "pOver100": res.p_over_100,
        "finalCases": rng(s.get("final_cases")),
        "finalDeaths": rng(s.get("final_deaths")),
        "peakBeds": rng(s.get("peak_beds")),
        "hcwShare": rng(s.get("hcw_share")),
        "peakInfectious": rng(s.get("peak_infectious")),
        "peakDay": rng(s.get("peak_day")),
        "recovered": rng(s.get("recovered")),
    }


def run_summary_tiles(res: SimulationResult | None) -> dict | None:
    """Medians for the Run History tiles (prototype RunSummary), plus their ranges."""
    if res is None:
        return None
    s = summary_dict(res)
    return {
        "peakInfectious": round(s["peakInfectious"]["median"] or 0),
        "peakDay": round(s["peakDay"]["median"] or 0),
        "deaths": round(s["finalDeaths"]["median"] or 0),
        "recovered": round(s["recovered"]["median"] or 0),
        "ranges": s,
    }


def run_district_codes(run: SimulationRun) -> list[str]:
    return [d["code"] for d in (run.inputs_snapshot.get("population") or {}).get("districts", [])]


def capacity_check(run: SimulationRun, res: SimulationResult, profile: CapacityProfile | None) -> dict | None:
    if profile is None:
        return None
    beds = beds_for(profile, run_district_codes(run))
    hosp = (res.series or {}).get("hospitalised") or {}
    return {
        "profileId": profile.id,
        "profileName": profile.name,
        "placeholder": profile.placeholder,
        "beds": beds,
        "pBedsExceeded": p_beds_exceeded(res.run_peaks or [], beds),
        "bedsRunOutDay": first_day_over(hosp.get("median") or [], beds),
        "bedsRunOutDayHigh": first_day_over(hosp.get("high") or [], beds),
    }


def inputs_dict(run: SimulationRun) -> dict:
    snap = run.inputs_snapshot or {}
    disease = snap.get("disease") or {}
    pop = snap.get("population") or {}
    inter = snap.get("interventions") or {}
    return {
        "modelType": run.model_type,
        "seed": run.seed,
        "monteCarloRuns": run.monte_carlo_runs,
        "horizonDays": run.horizon_days,
        "initialCases": run.initial_cases,
        "engineVersion": run.engine_version,
        "seedDistrictCode": run.seed_district_code,
        "disease": {
            "presetId": disease.get("preset_id"),
            "presetVersion": disease.get("preset_version"),
            "key": disease.get("key"),
            "name": disease.get("name"),
            "r0": disease.get("r0"),
            "provisional": disease.get("provisional"),
            "reference": disease.get("reference"),
        },
        "population": {
            "datasetId": pop.get("dataset_id"),
            "datasetName": pop.get("dataset_name"),
            "datasetVersion": pop.get("dataset_version"),
            "total": pop.get("total"),
            "illustrative": pop.get("illustrative"),
            "districtCount": len(pop.get("districts", [])),
        },
        "interventions": {
            "packageId": inter.get("package_id"),
            "packageName": inter.get("package_name"),
            "items": [
                {
                    k: it.get(k)
                    for k in (
                        "type_name",
                        "type_key",
                        "lever",
                        "start_day",
                        "end_day",
                        "coverage",
                        "effect",
                        "placeholder",
                    )
                }
                for it in inter.get("items", [])
            ],
        },
        "hcw": snap.get("hcw"),
    }


def honesty(run: SimulationRun) -> dict:
    snap = run.inputs_snapshot or {}
    disease = snap.get("disease") or {}
    items = (snap.get("interventions") or {}).get("items", [])
    notes = [ESTIMATE_LABEL + "."]
    if disease.get("provisional"):
        notes.append(
            f"{disease.get('name')} parameters are provisional (not yet reviewed by an epidemiologist)."
        )
    if any(it.get("placeholder") for it in items):
        notes.append("Intervention effect sizes are placeholders until an evidence review replaces them.")
    if (snap.get("population") or {}).get("illustrative"):
        notes.append("The population dataset is illustrative sample data.")
    if run.model_type == "seihfr_geo":
        notes.append("Movement between districts is estimated with a gravity model, not observed.")
    return {"label": ESTIMATE_LABEL, "provisional": bool(disease.get("provisional")), "notes": notes}
