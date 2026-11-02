"""Per-district analysis of a seihfr_geo run, with capacity applied at read time (docs Module 9)."""

from app.config import BOUNDARY_ATTRIBUTION, ESTIMATE_LABEL, MOVEMENT_LABEL
from app.models import CapacityProfile, SimulationResult, SimulationRun
from app.services.capacity import district_beds, first_day_over, p_beds_exceeded
from app.services.geo_data import district_by_code
from app.services.results import rng

AMBER_FROM = 0.7  # beds view: green < 70%, amber 70–100%, red > 100%


def _series(d: dict, name: str) -> dict:
    s = (d.get("series") or {}).get(name) or d.get(name) or {}
    return {"low": s.get("low") or [], "median": s.get("median") or [], "high": s.get("high") or []}


def district_rows(run: SimulationRun, res: SimulationResult, profile: CapacityProfile | None) -> list[dict]:
    pops = {d["code"]: d["population"] for d in run.inputs_snapshot["population"]["districts"]}
    beds = district_beds(profile, pops) if profile else {}
    ref = district_by_code()
    rows = []
    for d in res.districts or []:
        code = d.get("code") or d.get("district_code")
        hosp = _series(d, "hospitalised")
        b = beds.get(code)
        peak_h = rng(d.get("peak_hospitalised"))
        run_peaks = d.get("run_peaks") or d.get("run_peak_hospitalised") or []
        out_day = first_day_over(hosp["median"], b) if b is not None else None
        if b is None:
            status = "unknown"
        elif out_day is not None:
            status = "short"
        elif (peak_h["median"] or 0) >= AMBER_FROM * max(b, 1):
            status = "tight"
        else:
            status = "within"
        rows.append(
            {
                "code": code,
                "name": ref.get(code, {}).get("name", d.get("name", code)),
                "province": ref.get(code, {}).get("province"),
                "population": pops.get(code),
                "beds": b,
                "pReached": d.get("p_reached"),
                "firstCaseDay": rng(d.get("first_case_day")),
                "totalCases": rng(d.get("total_cases")),
                "peakDay": rng(d.get("peak_day")),
                "peakHospitalised": peak_h,
                "pBedsExceeded": p_beds_exceeded(run_peaks, b) if b is not None and run_peaks else None,
                "bedsRunOutDay": out_day,
                "status": status,
                "series": {"cumulative": _series(d, "cumulative"), "hospitalised": hosp},
            }
        )
    return rows


def watch_list(rows: list[dict], n: int = 5) -> list[str]:
    """Districts to watch: earliest median first-case day, ties broken by outbreak size (docs Module 9)."""
    reached = [r for r in rows if r["firstCaseDay"]["median"] is not None]
    reached.sort(key=lambda r: (r["firstCaseDay"]["median"], -(r["totalCases"]["median"] or 0)))
    return [r["code"] for r in reached[:n]]


def geographic_payload(
    run: SimulationRun, res: SimulationResult, profile: CapacityProfile | None, border_risks: list[dict]
) -> dict:
    rows = district_rows(run, res, profile)
    max_cum = 0.0
    max_ratio = 0.0
    for r in rows:
        med = r["series"]["cumulative"]["median"]
        if med:
            max_cum = max(max_cum, max(med))
        if r["beds"]:
            h = r["series"]["hospitalised"]["median"]
            if h:
                max_ratio = max(max_ratio, max(h) / r["beds"])
    pop = run.inputs_snapshot.get("population") or {}
    return {
        "runId": run.id,
        "days": run.horizon_days,
        "seedDistrictCode": run.seed_district_code,
        "label": ESTIMATE_LABEL,
        "boundaryAttribution": BOUNDARY_ATTRIBUTION,
        "illustrative": bool(pop.get("illustrative")),
        "capacity": {
            "profileId": profile.id,
            "profileName": profile.name,
            "placeholder": profile.placeholder,
            "hasDistrictBeds": bool(profile.district_beds),
        }
        if profile
        else None,
        "scale": {"maxCumulativeCases": max_cum, "maxBedRatio": max_ratio},
        "districts": rows,
        "watchList": watch_list(rows),
        "movement": {**(res.movement or {}), "label": MOVEMENT_LABEL},
        "borderRisks": border_risks,
    }
