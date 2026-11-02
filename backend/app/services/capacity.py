"""Capacity is a check applied at analysis time, never an engine input (docs D4)."""

from app.models import CapacityProfile


def beds_for(
    profile: CapacityProfile, district_codes: list[str] | None = None, populations: dict | None = None
) -> int:
    """Beds available to a run.

    If the profile has per-district rows and the run covers known districts, sum those districts' beds.
    Otherwise use the profile's hospital beds.
    """
    if district_codes and profile.district_beds:
        rows = {r.district_code: r.beds for r in profile.district_beds}
        if any(c in rows for c in district_codes):
            return sum(rows.get(c, 0) for c in district_codes)
    return profile.hospital_beds


def district_beds(profile: CapacityProfile, populations: dict[str, int]) -> dict[str, int]:
    """Beds per district: the profile's district rows, else population-proportional (docs Module 9)."""
    rows = {r.district_code: r.beds for r in profile.district_beds}
    total_pop = sum(populations.values()) or 1
    return {
        code: rows[code] if code in rows else round(profile.hospital_beds * pop / total_pop)
        for code, pop in populations.items()
    }


def p_beds_exceeded(run_peaks: list[float], beds: float) -> float | None:
    """Share of Monte Carlo runs whose peak hospitalised exceeds the beds available."""
    if not run_peaks:
        return None
    return sum(1 for p in run_peaks if p > beds) / len(run_peaks)


def first_day_over(values: list[float], beds: float) -> int | None:
    """First day a daily series (e.g. median bed demand) exceeds the beds available."""
    for day, v in enumerate(values):
        if v is not None and v > beds:
            return day
    return None
