"""Engine test fixtures: built-in disease profiles (frontend/src/lib/models/diseases.ts) and districts."""

import copy

import pytest

EBOLA = {
    "key": "ebola",
    "name": "Ebola",
    "r0": 1.8,
    "k": 0.18,
    "incubation": 8.5,
    "onset_to_admission": 4.5,
    "onset_to_death": 9.3,
    "onset_to_recovery": 13.0,
    "cfr_community": 0.646,
    "cfr_hospital": 0.5,
    "hospitalised": 0.6,
    "burial_delay": 2,
    "hcw_risk": 0.08,
    "serial_interval_mean": 15.4,
    "serial_interval_sd": 9.3,
    "route_share": {"community": 0.55, "hospital": 0.15, "funeral": 0.30},
    "baseline": {"safe_burial": 0.5, "contact_tracing": 0.4, "isolation": 0.5},
    "provisional": False,
}
MARBURG = {
    "key": "marburg",
    "name": "Marburg",
    "r0": 1.6,
    "k": 0.3,
    "incubation": 7,
    "onset_to_admission": 4,
    "onset_to_death": 8,
    "onset_to_recovery": 15,
    "cfr_community": 0.5,
    "cfr_hospital": 0.227,
    "hospitalised": 0.8,
    "burial_delay": 2,
    "hcw_risk": 0.25,
    "serial_interval_mean": 9,
    "serial_interval_sd": 5,
    "route_share": {"community": 0.55, "hospital": 0.15, "funeral": 0.30},
    "baseline": {"safe_burial": 0.5, "contact_tracing": 0.4, "isolation": 0.5},
    "provisional": True,
}
# Same defaults as defaultSettings() in the TS engine.
HCW = {
    "ebola": {"pool": 600, "ppe_before": 0.3, "ppe_after": 0.85, "recognition_day": 14},
    "marburg": {"pool": 600, "ppe_before": 0.2, "ppe_after": 0.85, "recognition_day": 21},
}
INITIAL = {"ebola": 3, "marburg": 2}

# Codes from rwanda-districts.geojson; populations: the prototype's illustrative sample (~2022 census).
DISTRICT_POPULATIONS = {
    "11": ("Nyarugenge", 374319),
    "12": ("Gasabo", 879505),
    "13": ("Kicukiro", 491731),
    "21": ("Nyanza", 365718),
    "22": ("Gisagara", 397051),
    "23": ("Nyaruguru", 318126),
    "24": ("Huye", 381900),
    "25": ("Nyamagabe", 372906),
    "26": ("Ruhango", 359121),
    "27": ("Muhanga", 358433),
    "28": ("Kamonyi", 450849),
    "31": ("Karongi", 369039),
    "32": ("Rutsiro", 369180),
    "33": ("Rubavu", 546683),
    "34": ("Nyabihu", 319047),
    "35": ("Ngororero", 367955),
    "36": ("Rusizi", 485529),
    "37": ("Nyamasheke", 434852),
    "41": ("Rulindo", 350933),
    "42": ("Gakenke", 352421),
    "43": ("Musanze", 476522),
    "44": ("Burera", 387729),
    "45": ("Gicumbi", 448824),
    "51": ("Rwamagana", 484953),
    "52": ("Nyagatare", 653861),
    "53": ("Gatsibo", 551255),
    "54": ("Kayonza", 457156),
    "55": ("Kirehe", 460860),
    "56": ("Ngoma", 404048),
    "57": ("Bugesera", 551103),
}


def make_snapshot(disease="ebola", **overrides):
    d = copy.deepcopy(EBOLA if disease == "ebola" else MARBURG)
    snap = {
        "model_type": "seihfr",
        "seed": 2026,
        "runs": 200,
        "days": 180,
        "initial_cases": INITIAL[disease],
        "branching_until": 20,
        "population": {"dataset_id": "test", "dataset_version": 1, "total": 403000},
        "disease": d,
        "interventions": {"package_id": None, "items": []},
        "hcw": dict(HCW[disease]),
    }
    snap.update(overrides)
    return snap


def make_geo_snapshot(disease="ebola", seed_code="33", **overrides):
    districts = [{"code": c, "name": n, "population": p} for c, (n, p) in DISTRICT_POPULATIONS.items()]
    snap = make_snapshot(disease, model_type="seihfr_geo")
    snap["population"] = {
        "dataset_id": "test",
        "dataset_version": 1,
        "total": sum(d["population"] for d in districts),
        "districts": districts,
    }
    snap["geo"] = {"seed_district_code": seed_code}
    snap.update(overrides)
    return snap


@pytest.fixture
def snapshot():
    return make_snapshot


@pytest.fixture
def geo_snapshot():
    return make_geo_snapshot
