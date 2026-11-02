"""Server-side permission matrix. Exact mirror of PERMISSION_MATRIX in frontend/src/lib/rbac.ts.

tests/test_rbac.py parses the TypeScript file and fails if the two drift apart.
"""

from typing import Literal

Role = Literal["admin", "analyst", "officer", "policymaker"]
ROLES: list[str] = ["admin", "analyst", "officer", "policymaker"]

ROLE_LABELS = {
    "admin": "Administrator",
    "officer": "Public Health Officer",
    "policymaker": "Policy Maker",
    "analyst": "Epidemiologist",
}

MODULES = [
    "auth",
    "dashboard",
    "population",
    "disease",
    "simulation",
    "branching",
    "hcw",
    "rt",
    "interventions",
    "geographic",
    "healthcare",
    "visualization",
    "scenario",
    "reports",
    "users",
    "dataquality",
    "instructions",
    "presets",
    "capacity",
    "scenarios",
]

PERMISSION_MATRIX: dict[str, dict[str, str]] = {
    "admin": {
        "auth": "full",
        "dashboard": "none",
        "population": "none",
        "disease": "none",
        "simulation": "none",
        "branching": "none",
        "hcw": "none",
        "rt": "none",
        "interventions": "none",
        "geographic": "none",
        "healthcare": "none",
        "visualization": "none",
        "scenario": "none",
        "reports": "none",
        "users": "full",
        "dataquality": "none",
        "instructions": "none",
        "presets": "none",
        "capacity": "full",
        "scenarios": "full",
    },
    "officer": {
        "auth": "self",
        "dashboard": "full",
        "population": "none",
        "disease": "none",
        "simulation": "write",
        "branching": "none",
        "hcw": "write",
        "rt": "write",
        "interventions": "full",
        "geographic": "none",
        "healthcare": "full",
        "visualization": "none",
        "scenario": "none",
        "reports": "read",
        "users": "none",
        "dataquality": "none",
        "instructions": "write",
        "presets": "read",
        "capacity": "write",
        "scenarios": "full",
    },
    "policymaker": {
        "auth": "self",
        "dashboard": "read",
        "population": "none",
        "disease": "none",
        "simulation": "read",
        "branching": "none",
        "hcw": "none",
        "rt": "none",
        "interventions": "review",
        "geographic": "none",
        "healthcare": "none",
        "visualization": "none",
        "scenario": "read",
        "reports": "read",
        "users": "none",
        "dataquality": "none",
        "instructions": "none",
        "presets": "read",
        "capacity": "read",
        "scenarios": "review",
    },
    "analyst": {
        "auth": "self",
        "dashboard": "full",
        "population": "write",
        "disease": "full",
        "simulation": "full",
        "branching": "full",
        "hcw": "full",
        "rt": "full",
        "interventions": "full",
        "geographic": "full",
        "healthcare": "none",
        "visualization": "full",
        "scenario": "full",
        "reports": "full",
        "users": "none",
        "dataquality": "full",
        "instructions": "none",
        "presets": "full",
        "capacity": "none",
        "scenarios": "full",
    },
}

# Ordering used for "at least" checks. read, review and self are all read-type levels;
# review additionally allows cloning shared scenarios (handled in the scenarios router).
LEVEL_RANK = {"none": 0, "read": 1, "review": 1, "self": 1, "limited": 2, "write": 3, "full": 4}


def access_level(role: str, module: str) -> str:
    return PERMISSION_MATRIX.get(role, {}).get(module, "none")


def has_level(role: str, module: str, minimum: str = "read") -> bool:
    return LEVEL_RANK[access_level(role, module)] >= LEVEL_RANK[minimum]


def has_any(role: str, modules: list[str], minimum: str = "read") -> bool:
    return any(has_level(role, m, minimum) for m in modules)
