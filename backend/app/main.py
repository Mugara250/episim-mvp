"""EpiSim MVP API."""

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.encoders import ENCODERS_BY_TYPE
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    admin,
    auth,
    capacity,
    comparison,
    dashboard,
    geographic,
    interventions,
    officer,
    policy,
    population,
    presets,
    reports,
    rt,
    scenarios,
    simulations,
)
from app.config import APP_VERSION, ESTIMATE_LABEL
from app.schemas.base import as_utc
from app.services import worker

# Endpoints that return plain dicts go through FastAPI's encoder rather than a response model;
# give their timestamps the same explicit UTC offset (see app.schemas.base.as_utc).
ENCODERS_BY_TYPE[datetime] = lambda d: as_utc(d).isoformat()

logging.basicConfig(level=logging.INFO)

TAGS = [
    {"name": "auth", "description": "Module 1 — sign in, current user, account requests"},
    {"name": "meta", "description": "Demo mode, versions and honesty labels"},
    {"name": "dashboard", "description": "Module 2 — per-role dashboard summaries"},
    {"name": "population", "description": "Module 3 — population datasets, versions and CSV import"},
    {"name": "disease-presets", "description": "Module 4 — SEIHFR disease presets"},
    {"name": "interventions", "description": "Module 8 — intervention types and packages"},
    {"name": "capacity", "description": "Module 10 — healthcare capacity profiles"},
    {"name": "scenarios", "description": "Scenario Builder; scenario approval (Module 13)"},
    {"name": "simulations", "description": "Modules 5, 6, 9, 11, 15 — runs and results"},
    {"name": "comparison", "description": "Module 12 — comparison of completed runs"},
    {"name": "geographic", "description": "Module 9 — districts, movement, border risks"},
    {"name": "rt", "description": "Module 16 — Rt tracking"},
    {"name": "reports", "description": "Module 13 — reports, approval and PDF export"},
    {"name": "policy", "description": "Module 13 — intervention reviews, alerts"},
    {"name": "hospital-operations", "description": "Module 17 — hospital data and response operations"},
    {"name": "admin", "description": "Module 14 — administrator console"},
]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    stale = worker.mark_stale_runs()
    if stale:
        logging.getLogger("episim").warning("Marked %s stale runs as failed", stale)
    yield
    worker.get_worker().shutdown()


app = FastAPI(
    title="EpiSim API",
    version=APP_VERSION,
    description=f"Epidemic scenario simulation for Rwanda (MVP demo). "
    f"All outputs are {ESTIMATE_LABEL.lower()}.",
    openapi_tags=TAGS,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (
    auth,
    dashboard,
    population,
    presets,
    interventions,
    capacity,
    scenarios,
    simulations,
    comparison,
    geographic,
    rt,
    reports,
    policy,
    officer,
    admin,
):
    app.include_router(module.router)
app.include_router(admin.public_router)


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
