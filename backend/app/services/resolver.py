"""Turns a scenario plus a run request into a self-contained engine snapshot (docs Layer 2 → 3).

The snapshot is stored on the run so the run can always be reproduced exactly. Capacity is never
read here: it is applied when results are analysed.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DatasetVersion, DiseasePreset, InterventionPackage, InterventionType, Scenario
from app.services.geo_data import district_by_code

MODEL_TYPES = ("seihfr", "seihfr_geo")

# Model levers an intervention type can act on (docs Module 8 table).
# Names match app.simulation.levers.
LEVERS = {
    "contact_tracing": "Contact tracing: reduces community transmission",
    "isolation": "Isolation: reduces spread through the hospital route",
    "safe_burial": "Safe burial: share of deaths buried safely",
    "detection": "Detection delay: shortens time from onset to isolation (testing)",
    "community": "Scales community transmission (lockdown)",
    "hospital": "Scales hospital transmission",
    "masking": "Scales community and hospital transmission (masking)",
    "vaccination": "Moves susceptible people to Removed over the active window",
}

DEFAULT_HCW_POOL = 600


class ResolveError(ValueError):
    """Raised with a plain-language message when a scenario cannot be run."""


def disease_dict(p: DiseasePreset) -> dict:
    return {
        "key": p.disease,
        "preset_key": p.key,
        "name": p.name,
        "virus": p.virus,
        "preset_id": p.id,
        "preset_version": p.version,
        "r0": p.r0_likely,
        "r0_range": {"low": p.r0_low, "likely": p.r0_likely, "high": p.r0_high},
        "k": p.overdispersion_k,
        "incubation": p.incubation_days,
        "onset_to_admission": p.onset_to_admission_days,
        "onset_to_death": p.onset_to_death_days,
        "onset_to_recovery": p.onset_to_recovery_days,
        "cfr_community": p.cfr_community,
        "cfr_hospital": p.cfr_hospital,
        "hospitalised": p.share_hospitalised,
        "burial_delay": p.burial_delay_days,
        "hcw_risk": p.hcw_risk,
        "serial_interval_mean": p.serial_interval_mean,
        "serial_interval_sd": p.serial_interval_sd,
        "route_share": {
            "community": p.route_share_community,
            "hospital": p.route_share_hospital,
            "funeral": p.route_share_funeral,
        },
        "baseline": {
            "safe_burial": p.baseline_safe_burial,
            "contact_tracing": p.baseline_contact_tracing,
            "isolation": p.baseline_isolation,
        },
        "provisional": p.provisional,
        "reference": p.reference,
    }


def package_dict(db: Session, pkg: InterventionPackage | None) -> dict:
    if pkg is None:
        return {"package_id": None, "package_name": None, "items": []}
    types = {t.id: t for t in db.scalars(select(InterventionType))}
    items = []
    for it in pkg.items:
        t = types.get(it.type_id)
        if t is None:
            raise ResolveError(
                f"The intervention package “{pkg.name}” uses a type that no longer exists. "
                "Edit the package and try again."
            )
        effect = it.custom_effect if it.custom_effect is not None else t.default_effect
        items.append(
            {
                "type_id": t.id,
                "type_key": t.key,
                "type_name": t.name,
                "lever": t.engine_lever,
                "mechanism": t.mechanism,
                "start_day": it.start_day,
                "end_day": it.end_day,
                "coverage": it.coverage,
                "effect": effect,
                "placeholder": t.placeholder,
            }
        )
    return {"package_id": pkg.id, "package_name": pkg.name, "items": items}


def resolve(
    db: Session,
    scenario: Scenario,
    *,
    model_type: str,
    days: int,
    initial_cases: int,
    runs: int,
    seed: int,
    seed_district_code: str | None = None,
    hcw: dict | None = None,
    response: dict | None = None,
) -> dict:
    if model_type not in MODEL_TYPES:
        raise ResolveError(f"Unknown model type “{model_type}”. Use one of: {', '.join(MODEL_TYPES)}.")
    if scenario.draft:
        raise ResolveError("This scenario is still a draft. Save it before running a simulation.")
    if not scenario.dataset_id:
        raise ResolveError("This scenario has no population dataset. Edit the scenario and choose one.")
    if not scenario.preset_id:
        raise ResolveError("This scenario has no disease preset. Edit the scenario and choose one.")

    q = select(DatasetVersion).where(DatasetVersion.dataset_id == scenario.dataset_id)
    if scenario.dataset_version is not None:
        q = q.where(DatasetVersion.version == scenario.dataset_version)
    version = db.scalars(q.order_by(DatasetVersion.version.desc())).first()
    if version is None:
        raise ResolveError(
            "The population dataset version pinned in this scenario is no longer available. "
            "Check the dataset on Population Data, or clone the scenario and choose it again."
        )
    preset = db.get(DiseasePreset, scenario.preset_id)
    if preset is None:
        raise ResolveError(
            "This scenario’s disease preset no longer exists. Clone the scenario and choose another."
        )
    pkg = db.get(InterventionPackage, scenario.package_id) if scenario.package_id else None
    if scenario.package_id and pkg is None:
        raise ResolveError(
            "This scenario’s intervention package no longer exists. Edit the scenario and choose another."
        )

    ref = district_by_code()
    district_rows = [
        {
            "code": d.district_code,
            "name": ref.get(d.district_code, {}).get("name", d.district_code),
            "province": ref.get(d.district_code, {}).get("province"),
            "population": d.population,
            "cx": ref.get(d.district_code, {}).get("cx"),
            "cy": ref.get(d.district_code, {}).get("cy"),
        }
        for d in sorted(version.districts, key=lambda r: r.district_code)
    ]
    population = {
        "dataset_id": version.dataset_id,
        "dataset_name": version.dataset.name,
        "dataset_version": version.version,
        "illustrative": version.dataset.illustrative,
        "total": version.population,
        "districts": district_rows,
    }

    if initial_cases < 1:
        raise ResolveError("At least 1 person must be infectious at day 0.")
    if initial_cases >= version.population:
        raise ResolveError("Initial cases must be smaller than the population.")

    snapshot: dict = {
        "model_type": model_type,
        "seed": seed,
        "runs": runs,
        "days": days,
        "initial_cases": initial_cases,
        "branching_until": 20,
        "scenario": {"id": scenario.id, "name": scenario.name},
        "population": population,
        "disease": disease_dict(preset),
        "interventions": package_dict(db, pkg),
        "hcw": {
            "pool": DEFAULT_HCW_POOL,
            "ppe_before": preset.hcw_ppe_before,
            "ppe_after": preset.hcw_ppe_after,
            "recognition_day": preset.hcw_recognition_day,
            **(hcw or {}),
        },
    }
    if model_type == "seihfr_geo":
        codes = [d["code"] for d in district_rows]
        if len(codes) < 2:
            raise ResolveError(
                "Geographic spread needs a dataset with district populations for several districts. "
                "Choose a national or multi-district dataset."
            )
        if not seed_district_code:
            raise ResolveError("Choose the district where the outbreak starts.")
        if seed_district_code not in codes:
            raise ResolveError("The starting district is not in this scenario’s population dataset.")
        snapshot["geo"] = {
            "seed_district_code": seed_district_code,
            "movement": {"method": "gravity", "label": "estimated"},
            "response": response,
        }
    return snapshot
