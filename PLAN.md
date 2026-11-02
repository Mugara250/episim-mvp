# EpiSim MVP — build plan

Goal: turn the Magic Patterns React prototype into a working full-stack demo
(FastAPI + SQLite + NumPy engine) that runs the P0 demo path end to end with no
mock engine or mock data in P0 pages. Honesty rules (labels, provisional flags,
"scenario estimates, not forecasts") apply everywhere.

Spec precedence: build prompt → frontend behaviour + `src/lib/rbac.ts` →
`docs/epidemic-simulation-full-documentation.md`. Every other conflict or
deviation goes in `docs/DECISIONS.md`.

## Phases (commit after each)

| # | Phase | Output |
|---|---|---|
| 0 | Repo setup | flatten `frontend/`, git init, boundary file normalised, PLAN.md, DECISIONS.md, Makefile, .env.example, backend skeleton + venv, frontend deps |
| 1a | Engine port (parallel) | `backend/app/simulation/` (NumPy, vectorised over runs), `tools/reference-engine/` (TS engine moved out of the app) + reference outputs, engine tests incl. parity |
| 1b | Backend API (parallel) | SQLAlchemy models, Alembic, auth (argon2 + JWT), RBAC mirroring `PERMISSION_MATRIX`, all module routers, background worker, seed script, API tests |
| 2 | Frontend wiring | React Router, TanStack Query, typed client from OpenAPI (`openapi-typescript` + `openapi-fetch`), Vite proxy, real login, P0 pages on the API, demo ribbon, About page |
| 3 | Geographic + reports | d3-geo choropleth, timeline, district panel, what-if; server PDF reports + approval workflow; policymaker view |
| 4 | P1 / P2 | officer, policymaker, admin pages on the API; anything left labelled "Demo data" |
| 5 | Hardening | review agent pass, `make test` green, clean-clone `make dev` check, README with demo script + architecture diagram, stretch back-test |

## File layout

```
backend/
  pyproject.toml            deps, ruff, pytest config
  alembic.ini, alembic/     migrations (SQLite now, Postgres-compatible types)
  app/
    main.py                 FastAPI app, routers, CORS, startup (worker pool)
    config.py               pydantic-settings: DATABASE_URL, JWT_SECRET, DEMO_MODE, ...
    db.py                   engine/session, Base
    models/                 SQLAlchemy 2 tables, one file per module
    schemas/                Pydantic v2 request/response models (camelCase JSON)
    core/security.py        argon2 hashing, JWT
    core/rbac.py            PERMISSION_MATRIX (mirror of src/lib/rbac.ts) + require(module, level)
    api/                    routers grouped by documentation module
    services/               resolver (scenario → snapshot), worker, comparison, geo analysis, pdf, audit
    simulation/             the engine (no DB, no FastAPI imports)
    data/                   rwanda-districts.geojson, seed/*.json (illustrative)
    seed.py                 `make seed`
  tests/                    api + engine tests
frontend/                   existing Vite app (design unchanged)
  src/api/                  generated schema.d.ts, client, query hooks
tools/reference-engine/     original TS engine + script that writes reference outputs
tools/backtest/             stretch: Ebola back-test
docs/DECISIONS.md           conflicts and deviations
```

## Engine contract (shared by 1a and 1b)

`app.simulation.registry.run_model(snapshot: dict, progress: Callable[[float], None], should_cancel: Callable[[], bool]) -> dict`
dispatches on `snapshot["model_type"]` (`seihfr`, `seihfr_geo`) and raises
`app.simulation.errors.Cancelled` when `should_cancel()` turns true.

Snapshot (JSON, stored on the run, enough to reproduce it):

```jsonc
{
  "model_type": "seihfr",           // or "seihfr_geo"
  "engine_version": "...",          // filled by the engine module constant
  "seed": 2026, "runs": 200, "days": 180, "initial_cases": 3,
  "branching_until": 20,
  "population": { "dataset_id": "...", "dataset_name": "...", "dataset_version": 3, "total": 403000,
                  "districts": [{ "code": "33", "name": "Rubavu", "population": 546683 }] },
  "disease": { "key": "ebola", "name": "Ebola", "preset_id": "...", "preset_version": 1,
               "r0": 1.8, "k": 0.18, "incubation": 8.5, "onset_to_admission": 4.5,
               "onset_to_death": 9.3, "onset_to_recovery": 13.0, "cfr_community": 0.646,
               "cfr_hospital": 0.5, "hospitalised": 0.6, "burial_delay": 2, "hcw_risk": 0.08,
               "serial_interval_mean": 15.4, "serial_interval_sd": 9.3,
               "route_share": { "community": 0.55, "hospital": 0.15, "funeral": 0.30 },
               "baseline": { "safe_burial": 0.5, "contact_tracing": 0.4, "isolation": 0.5 },
               "provisional": false, "reference": "..." },
  "interventions": { "package_id": null, "package_name": null,
                     "items": [{ "type_key": "contact_tracing", "lever": "contact_tracing",
                                 "mechanism": "rate", "start_day": 0, "end_day": null,
                                 "coverage": 0.8, "effect": 0.6 }] },
  "hcw": { "pool": 600, "ppe_before": 0.3, "ppe_after": 0.85, "recognition_day": 14 },
  "geo": { "seed_district_code": "33", "movement": { "method": "gravity", ... },
           "response": { "district_code": "33", "start_day": 20 } }   // geo only; response optional
}
```

Result (JSON): `summary` (p_take_off, p_over_50, p_over_100, final_cases/final_deaths/peak_beds/
hcw_share/peak_infectious/peak_day/recovered as `{low, median, high}`), `run_peaks` (per-run peak
hospitalised, so P(beds exceeded) is recomputed for any capacity profile), `series` (columnar bands
`{low:[], median:[], high:[]}` for active, hospitalised, funerals, cumulative, deaths, hcw_cumulative,
community_cumulative, incidence), and for `seihfr_geo` a `districts` list (per district: p_reached,
first_case_day / total_cases / peak_day / peak_hospitalised bands, cumulative + hospitalised series bands,
per-run peak hospitalised) plus `movement` (top links, method "gravity", label "estimated").

Capacity is never an engine input: beds-exceeded and "beds run out from day N" are computed at
analysis time from the stored results.

## Key design choices

- **One engine** (stochastic SEIHFR); the deterministic `utils/seihfr.ts` is retired (docs D1).
- **Interventions are day-by-day lever windows**: contact tracing, isolation, safe burial, detection
  delay (testing), community multiplier (masking, lockdown), hospital multiplier (masking), vaccination
  (S → R shift). Combination rule docs D14: `effective = baseline + (1 − baseline) × coverage × effect`,
  several items combine multiplicatively on the remaining gap.
- **API JSON is camelCase** so the existing frontend types survive with minimal change.
- **Readable string ids** (`SC-1048`, `RUN-0143`, `RPT-032`) as primary keys.
- **Background worker**: `ThreadPoolExecutor` inside the API process; NumPy releases the GIL in its
  heavy calls. Status, progress and cancel flag live in the `simulation_runs` row.

## Risks

| Risk | Mitigation |
|---|---|
| Frontend is 24k lines of prototype with mocks threaded through contexts | Replace contexts/hooks with API-backed versions behind the same interface where possible; pages keep their markup |
| NumPy RNG cannot match the TS RNG bit for bit | Parity is distribution-level (medians within tolerance over many runs), as specified |
| Geographic model calibration (movement scale) is invented | Labelled "estimated"; movement parameters stored in the snapshot; DECISIONS.md entry |
| Python 3.14 is the system default; some wheels may lag | Pin `>=3.11`; use the 3.12 pyenv interpreter for the venv if 3.14 wheels fail |
| PDF generation | ReportLab, pure Python, no system deps |
| Time: the full surface is large | P0 first and verified; P1 on the API where cheap; P2 visibly labelled "Demo data" |
