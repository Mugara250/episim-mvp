"""Who may see or act on scenarios and runs. Mirrors accessFor() in frontend/src/utils/scenarios.ts."""

from app.models import Scenario, User


def scenario_access(s: Scenario, user: User) -> str | None:
    """'owner' | 'admin' | 'clone' | 'view' | None (no access)."""
    if s.owner_id == user.id:
        return "owner"
    if user.role == "admin":
        return "admin"
    if s.draft:
        return None
    matches = [
        sh
        for sh in s.shares
        if (sh.kind == "user" and sh.target_id == user.id)
        or (sh.kind == "institution" and user.institution_id and sh.target_id == user.institution_id)
    ]
    if not matches:
        return None
    return "clone" if any(m.permission == "clone" for m in matches) else "view"


def can_run(s: Scenario, user: User) -> bool:
    """Running needs simulation write and owner/admin/clone access (officers: own and shared scenarios)."""
    from app.core.rbac import has_level

    return has_level(user.role, "simulation", "write") and scenario_access(s, user) in (
        "owner",
        "admin",
        "clone",
        "view",
    )
