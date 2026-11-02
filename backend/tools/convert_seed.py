"""Converts the prototype's sample data (exported by export_frontend_seed.mjs) into backend seed files.

Usage: python tools/convert_seed.py <raw_seed.json>
Writes backend/app/data/seed/*.json. Every record is marked illustrative. Re-run only when the
prototype's sample data changes; the output is committed.
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "app" / "data" / "seed"
GEO = Path(__file__).resolve().parent.parent / "app" / "data" / "rwanda-districts.geojson"

raw = json.load(open(sys.argv[1]))
geo = {f["properties"]["name"].lower(): f["properties"]["code"] for f in json.load(open(GEO))["features"]}


def dump(name, data):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{name}.json").write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")


NOTE = "Illustrative sample record from the EpiSim prototype. Not real data."

# Districts: approximate 2022 census populations and illustrative isolation beds.
g = raw["geographic"]
dump(
    "districts",
    {
        "note": "Populations approximate the 2022 census (illustrative). "
        "Beds are placeholders for design review.",
        "districts": [
            {"code": geo[d["id"]], "name": d["name"], "population": d["population"], "beds": d["beds"]}
            for d in g["districts"]
        ],
        "borderRisks": g["borderRisks"],
        "geoCapacityProfiles": g["geoCapacityProfiles"],
    },
)

# Built-in SEIHFR presets: values from frontend/src/lib/models/diseases.ts (docs Appendix A).
presets = [
    {
        "id": "ebola-zaire",
        "key": "ebola_zaire",
        "disease": "ebola",
        "name": "Ebola (Zaire)",
        "virus": "Zaire ebolavirus",
        "color": "#EF4444",
        "description": "Zaire ebolavirus, three transmission routes (community, hospital, funeral).",
        "r0_low": 1.2,
        "r0_likely": 1.8,
        "r0_high": 2.7,
        "overdispersion_k": 0.18,
        "incubation_days": 8.5,
        "onset_to_admission_days": 4.5,
        "onset_to_death_days": 9.3,
        "onset_to_recovery_days": 13.0,
        "cfr_community": 0.646,
        "cfr_hospital": 0.5,
        "share_hospitalised": 0.6,
        "burial_delay_days": 2,
        "hcw_risk": 0.08,
        "serial_interval_mean": 15.4,
        "serial_interval_sd": 9.3,
        "default_initial_cases": 3,
        "hcw_ppe_before": 0.3,
        "hcw_ppe_after": 0.85,
        "hcw_recognition_day": 14,
        "provisional": True,
        "is_builtin": True,
        "reference": "Systematic review of Ebola outbreaks (West Africa 2013–16, DRC 2018–20). "
        "Not yet reviewed for use in EpiSim; check each value against its primary source.",
    },
    {
        "id": "marburg",
        "key": "marburg",
        "disease": "marburg",
        "name": "Marburg",
        "virus": "Marburg marburgvirus",
        "color": "#F59E0B",
        "description": "Marburg virus disease. Weakest evidence base: few outbreaks have published data.",
        "r0_low": 1.2,
        "r0_likely": 1.6,
        "r0_high": 2.0,
        "overdispersion_k": 0.3,
        "incubation_days": 7,
        "onset_to_admission_days": 4,
        "onset_to_death_days": 8,
        "onset_to_recovery_days": 15,
        "cfr_community": 0.5,
        "cfr_hospital": 0.227,
        "share_hospitalised": 0.8,
        "burial_delay_days": 2,
        "hcw_risk": 0.25,
        "serial_interval_mean": 9,
        "serial_interval_sd": 5,
        "default_initial_cases": 2,
        "hcw_ppe_before": 0.2,
        "hcw_ppe_after": 0.85,
        "hcw_recognition_day": 21,
        "provisional": True,
        "is_builtin": True,
        "reference": "Rwanda 2024: 66 cases, 15 deaths (22.7%), about 80% health workers. "
        "Other values provisional. "
        "Confirm figures against the primary source before quoting.",
    },
]
custom = next(p for p in raw["diseasePresets"]["diseasePresets"] if p["id"] == "marburg-rw-2024")
presets.append(
    {
        **presets[1],
        "id": custom["id"],
        "key": "marburg_rw_2024",
        "name": custom["name"],
        "description": custom["description"],
        "r0_low": 1.2,
        "r0_likely": custom["r0"],
        "r0_high": 1.8,
        "incubation_days": custom["incubationDays"],
        "is_builtin": False,
        "cloned_from_id": "marburg",
        "reference": custom["source"],
        "illustrative": True,
    }
)
dump(
    "disease_presets",
    {"note": "Built-in values from the prototype engine (docs Appendix A); provisional.", "presets": presets},
)

LEVER = {
    "contact_tracing": "contact_tracing",
    "lockdown": "community",
    "masking": "masking",
    "testing": "detection",
    "vaccination": "vaccination",
    "safe_burials": "safe_burial",
    "case_isolation": "isolation",
}
iv = raw["interventions"]
dump(
    "interventions",
    {
        "types": [{**t, "engine_lever": LEVER[t["key"]]} for t in iv["interventionTypes"]],
        "packages": iv["interventionPackages"],
    },
)

sl = raw["scenarioLibrary"]
dump(
    "scenarios",
    {
        "datasets": sl["populationDatasets"],
        "scenarios": sl["scenarioSeed"],
        "colleagues": sl["COLLEAGUES"],
        "shareInstitutions": sl["SHARE_INSTITUTIONS"],
        "userInstitutions": sl["USER_INSTITUTIONS"],
    },
)
cp = raw["capacityProfiles"]
dump(
    "capacity",
    {
        "institutions": cp["institutions"],
        "profiles": cp["capacityProfiles"],
        "comparisons": cp["profileComparisons"],
    },
)
dump(
    "admin",
    {
        "users": raw["adminUsers"]["adminUsers"],
        "organisations": raw["adminUsers"]["ORGANISATIONS"],
        "hospitals": raw["adminHospitals"]["adminHospitals"],
        "auditLog": raw["auditLog"]["auditLog"],
        "accessRequests": raw["accountRequests"]["accountRequests"],
    },
)
dump(
    "officer",
    {
        "ownHospital": raw["hospital"]["ownHospital"],
        "entries": raw["hospitalEntries"]["hospitalEntries"],
        "instructions": raw["instructions"]["instructions"],
        "plans": raw["responsePlans"]["responsePlans"],
        "hospitalReports": raw["hospitalReports"]["hospitalReports"],
    },
)
dump(
    "policy",
    {
        "approvedReports": raw["approvedReports"]["approvedReports"],
        "approvedScenarios": raw["approvedScenarios"]["approvedScenarios"],
        "interventionReviews": raw["interventionReview"]["interventionReview"],
        "alerts": raw["policyAlerts"]["policyAlerts"],
        "reportDrafts": raw["reportDrafts"]["reportDrafts"],
        "parameterSets": raw["parameterSets"]["approvedParameterSets"],
    },
)
dump("case_data", {"series": raw["caseReports"]["caseSeries"]})
print("wrote", sorted(p.name for p in OUT.glob("*.json")))
