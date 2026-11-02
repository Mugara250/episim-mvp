"""Model dispatch by model_type. Adding a model means adding an entry here, not changing the schema."""

from __future__ import annotations

from collections.abc import Callable

from .seihfr import run_seihfr
from .seihfr_geo import run_seihfr_geo
from .version import ENGINE_VERSION

MODELS: dict[str, Callable[..., dict]] = {
    "seihfr": run_seihfr,
    "seihfr_geo": run_seihfr_geo,
}
MODEL_TYPES = tuple(MODELS)


def run_model(
    snapshot: dict,
    progress: Callable[[float], None] = lambda f: None,
    should_cancel: Callable[[], bool] = lambda: False,
) -> dict:
    """Run the model named by snapshot["model_type"]. ValueError for unknown types, Cancelled on cancel."""
    model_type = snapshot.get("model_type")
    if model_type not in MODELS:
        raise ValueError(f"Unknown model_type {model_type!r}; expected one of {', '.join(MODEL_TYPES)}")
    snapshot.setdefault("engine_version", ENGINE_VERSION)
    return MODELS[model_type](snapshot, progress, should_cancel)
