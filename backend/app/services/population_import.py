"""CSV import checks. Mirrors frontend/src/utils/populationImport.ts so the server and the screen agree."""

import csv
import io
import re
from collections import Counter

from app.services.geo_data import districts

MICRODATA_FIELDS = [
    ("household_id", "Household ID", True, ["household_id", "hh_id", "hhid", "household"]),
    ("person_id", "Person ID", True, ["person_id", "pid", "pers_id", "person"]),
    ("province_code", "Province code", True, ["province_code", "prov", "province", "prov_code"]),
    ("district_code", "District code", True, ["district_code", "dist", "district", "dist_code"]),
    ("sector_code", "Sector code", True, ["sector_code", "sect", "sector", "sect_code"]),
    ("area_type", "Urban or rural", True, ["area_type", "urban_rural", "ur", "residence"]),
    ("sex", "Sex", True, ["sex", "gender"]),
    ("age", "Age", True, ["age", "age_years", "p_age"]),
    (
        "relationship_to_head",
        "Relationship to head",
        True,
        ["relationship_to_head", "rel_head", "relationship"],
    ),
    ("marital_status", "Marital status", False, ["marital_status", "marital", "mstatus"]),
]
AGGREGATE_FIELDS = [
    (
        "sub_region_id",
        "Region code",
        True,
        ["sub_region_id", "region_id", "region_code", "sector_code", "sect"],
    ),
    ("age_band", "Age band", True, ["age_band", "age_group", "ageband"]),
    ("population_count", "Population count", True, ["population_count", "population", "count", "pop"]),
    ("density_per_km2", "Density per km²", False, ["density_per_km2", "density", "pop_density"]),
    ("urban_rural", "Urban or rural", True, ["urban_rural", "area_type", "ur"]),
]

# Sector lists the prototype knows in detail; other districts accept any sector number >= 01.
_SECTOR_NAMES = {
    "11": 10,
    "12": 15,
    "13": 10,
    "33": 12,
}
URBAN_RURAL = {"urban", "rural", "1", "2"}
SEXES = {"male", "female", "m", "f", "1", "2"}
RELATIONS = {
    "head",
    "spouse",
    "child",
    "stepchild",
    "grandchild",
    "parent",
    "sibling",
    "other relative",
    "domestic worker",
    "not related",
    "other",
}
PREVIEW_ROWS = 20
FLAGGED_LIMIT = 500


def fields_for(fmt: str):
    return MICRODATA_FIELDS if fmt == "microdata" else AGGREGATE_FIELDS


def _norm(s: str) -> str:
    return re.sub(r"[\s-]+", "_", s.strip().lower())


def auto_map(fmt: str, columns: list[str]) -> dict[str, str]:
    used: set[str] = set()
    mapping: dict[str, str] = {}
    for key, _label, _req, synonyms in fields_for(fmt):
        match = next((c for c in columns if c not in used and _norm(c) in synonyms), None)
        mapping[key] = match or ""
        if match:
            used.add(match)
    return mapping


def detect_format(columns: list[str]) -> str:
    normed = {_norm(c) for c in columns}

    def has(spec) -> bool:
        return any(s in normed for s in spec[3])

    micro = sum(1 for f in MICRODATA_FIELDS if f[0] in ("person_id", "household_id", "age", "sex") and has(f))
    agg = sum(1 for f in AGGREGATE_FIELDS if f[0] in ("population_count", "age_band") and has(f))
    if micro >= 3 and agg == 0:
        return "microdata"
    if agg >= 1 and micro <= 1:
        return "aggregate"
    return "unknown"


def _district_codes() -> set[str]:
    return {d["code"] for d in districts()}


def valid_district(code: str) -> bool:
    return code in _district_codes()


def valid_sector(code: str) -> bool:
    if not re.fullmatch(r"\d{4}", code) or not valid_district(code[:2]):
        return False
    n = int(code[2:])
    known = _SECTOR_NAMES.get(code[:2])
    return 1 <= n <= known if known else n >= 1


def _issue(field, level, kind, message):
    return {"field": field, "level": level, "kind": kind, "message": message}


def check_micro(v: dict[str, str]) -> list[dict]:
    issues = []
    for key, label, req, _ in MICRODATA_FIELDS:
        if req and not v.get(key):
            issues.append(_issue(key, "error", "Missing required value", f"{label} is empty"))
    prov, dist, sect = v.get("province_code", ""), v.get("district_code", ""), v.get("sector_code", "")
    if prov and not re.fullmatch(r"[1-5]", prov):
        issues.append(
            _issue(
                "province_code", "error", "Invalid region code", f"Province must be 1 to 5, found “{prov}”"
            )
        )
    if dist and (not valid_district(dist) or (prov and dist[0] != prov)):
        issues.append(
            _issue(
                "district_code",
                "error",
                "Invalid region code",
                f"“{dist}” is not a district in province {prov}",
            )
        )
    if sect and (not valid_sector(sect) or (dist and sect[:2] != dist)):
        issues.append(
            _issue(
                "sector_code", "error", "Invalid region code", f"“{sect}” is not a sector in district {dist}"
            )
        )
    if v.get("area_type") and v["area_type"].lower() not in URBAN_RURAL:
        issues.append(
            _issue(
                "area_type",
                "error",
                "Unrecognised value",
                f"Expected urban or rural, found “{v['area_type']}”",
            )
        )
    if v.get("sex") and v["sex"].lower() not in SEXES:
        issues.append(
            _issue("sex", "error", "Unrecognised value", f"Expected male or female, found “{v['sex']}”")
        )
    if v.get("age"):
        try:
            age_f = float(v["age"])
        except ValueError:
            age_f = -1.5
        if not age_f.is_integer() or age_f < 0 or age_f > 122:
            issues.append(
                _issue(
                    "age",
                    "error",
                    "Age out of range",
                    f"Age must be a whole number from 0 to 122, found “{v['age']}”",
                )
            )
        elif age_f >= 100:
            issues.append(
                _issue(
                    "age",
                    "warning",
                    "Check value",
                    f"Age {int(age_f)} is unusual. Please confirm it is correct.",
                )
            )
    rel = v.get("relationship_to_head")
    if rel and rel.lower() not in RELATIONS:
        issues.append(
            _issue("relationship_to_head", "warning", "Check value", f"“{rel}” will be imported as “other”")
        )
    return issues


def check_aggregate(v: dict[str, str]) -> list[dict]:
    issues = []
    for key, label, req, _ in AGGREGATE_FIELDS:
        if req and not v.get(key):
            issues.append(_issue(key, "error", "Missing required value", f"{label} is empty"))
    r = v.get("sub_region_id", "")
    if r and not (valid_district(r) if len(r) == 2 else valid_sector(r)):
        issues.append(
            _issue("sub_region_id", "error", "Invalid region code", f"“{r}” is not a district or sector code")
        )
    if v.get("age_band") and not re.fullmatch(r"\d{1,3}(-\d{1,3}|\+)", v["age_band"]):
        issues.append(
            _issue(
                "age_band",
                "error",
                "Unrecognised value",
                f"Use a band like 0-4 or 65+, found “{v['age_band']}”",
            )
        )
    pc = v.get("population_count")
    if pc and not (pc.isdigit()):
        issues.append(
            _issue(
                "population_count",
                "error",
                "Unrecognised value",
                f"Count must be a whole number, found “{pc}”",
            )
        )
    dens = v.get("density_per_km2")
    if dens:
        try:
            ok = float(dens) >= 0
        except ValueError:
            ok = False
        if not ok:
            issues.append(
                _issue(
                    "density_per_km2",
                    "warning",
                    "Check value",
                    f"Density “{dens}” is not a number and will be left blank",
                )
            )
    if v.get("urban_rural") and v["urban_rural"].lower() not in URBAN_RURAL:
        issues.append(
            _issue(
                "urban_rural",
                "error",
                "Unrecognised value",
                f"Expected urban or rural, found “{v['urban_rural']}”",
            )
        )
    return issues


def read_csv(content: bytes) -> tuple[list[str], list[dict[str, str]]]:
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.reader(io.StringIO(text))
    try:
        header = [h.strip() for h in next(reader)]
    except StopIteration:
        return [], []
    rows = []
    for raw in reader:
        if not any(cell.strip() for cell in raw):
            continue
        rows.append({h: (raw[i].strip() if i < len(raw) else "") for i, h in enumerate(header)})
    return header, rows


def check_file(content: bytes, fmt: str | None = None, mapping: dict[str, str] | None = None) -> dict:
    """Checks every row. Returns format, mapping, summary, preview, flagged rows and district totals."""
    columns, rows = read_csv(content)
    detected = detect_format(columns)
    fmt = fmt or (detected if detected != "unknown" else None)
    if fmt not in ("microdata", "aggregate"):
        return {
            "columns": columns,
            "detectedFormat": detected,
            "format": None,
            "mapping": {},
            "error": "We could not tell whether this file holds one row per person (microdata) "
            "or counts per area "
            "(aggregate). Choose the format and map the columns.",
        }
    mapping = mapping or auto_map(fmt, columns)
    missing = [label for key, label, req, _ in fields_for(fmt) if req and not mapping.get(key)]
    checker = check_micro if fmt == "microdata" else check_aggregate
    checked = []
    kinds: Counter = Counter()
    totals: Counter = Counter()
    valid = err = warn = 0
    for i, raw in enumerate(rows):
        values = {key: (raw.get(mapping[key], "") if mapping.get(key) else "") for key, *_ in fields_for(fmt)}
        issues = checker(values)
        has_error = any(x["level"] == "error" for x in issues)
        for x in issues:
            kinds[x["kind"]] += 1
        if has_error:
            err += 1
        else:
            valid += 1
            if issues:
                warn += 1
            if fmt == "microdata":
                totals[values["district_code"]] += 1
            else:
                totals[values["sub_region_id"][:2]] += int(values["population_count"] or 0)
        checked.append({"line": i + 2, "values": values, "issues": issues})
    flagged = [r for r in checked if r["issues"]]
    return {
        "columns": columns,
        "detectedFormat": detected,
        "format": fmt,
        "mapping": mapping,
        "missingFields": missing,
        "summary": {
            "totalRows": len(rows),
            "checkedRows": len(rows),
            "validRows": valid,
            "errorRows": err,
            "warningRows": warn,
            "breakdown": [{"kind": k, "count": c} for k, c in kinds.most_common()],
            "partial": False,
            "preview": checked[:PREVIEW_ROWS],
            "flagged": flagged[:FLAGGED_LIMIT],
        },
        "districtTotals": dict(sorted(totals.items())),
    }
