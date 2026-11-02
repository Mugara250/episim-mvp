"""In-process background worker for simulation runs (no Celery/Redis: DECISIONS, docs D12).

Status, progress and the cancel flag live in the simulation_runs row so any API process can read them.
"""

import logging
import threading
import time
from concurrent.futures import Future, ThreadPoolExecutor

from sqlalchemy import select, update

from app import db as dbmod
from app.models import SimulationResult, SimulationRun
from app.models.common import utcnow

log = logging.getLogger("episim.worker")

PROGRESS_INTERVAL = 0.5
CANCEL_INTERVAL = 0.3


class Cancelled(Exception):
    """Fallback when the engine package is unavailable."""


def _engine():
    """Returns (run_model, Cancelled, engine_version). Tests replace this via set_engine()."""
    from app.simulation import errors, registry, version

    return registry.run_model, errors.Cancelled, version.ENGINE_VERSION


_engine_override = None


def set_engine(factory) -> None:
    global _engine_override
    _engine_override = factory


def engine():
    return (_engine_override or _engine)()


def engine_version() -> str | None:
    try:
        return engine()[2]
    except Exception:  # noqa: BLE001 - engine missing while it is being built
        return None


def failure_message(exc: Exception) -> str:
    return (
        "The run stopped because the model could not finish with these inputs "
        f"({type(exc).__name__}: {exc}). Check the scenario’s dataset and preset, then try again."
    )


def _num(block: dict | None, key: str):
    return None if not isinstance(block, dict) else block.get(key)


def store_result(run_id: str, result: dict) -> SimulationResult:
    s = result.get("summary", {})
    return SimulationResult(
        run_id=run_id,
        p_take_off=s.get("p_take_off"),
        p_over_50=s.get("p_over_50"),
        p_over_100=s.get("p_over_100"),
        final_cases_low=_num(s.get("final_cases"), "low"),
        final_cases_median=_num(s.get("final_cases"), "median"),
        final_cases_high=_num(s.get("final_cases"), "high"),
        final_deaths_low=_num(s.get("final_deaths"), "low"),
        final_deaths_median=_num(s.get("final_deaths"), "median"),
        final_deaths_high=_num(s.get("final_deaths"), "high"),
        peak_beds_low=_num(s.get("peak_beds"), "low"),
        peak_beds_median=_num(s.get("peak_beds"), "median"),
        peak_beds_high=_num(s.get("peak_beds"), "high"),
        hcw_share_low=_num(s.get("hcw_share"), "low"),
        hcw_share_median=_num(s.get("hcw_share"), "median"),
        hcw_share_high=_num(s.get("hcw_share"), "high"),
        peak_infectious_median=_num(s.get("peak_infectious"), "median"),
        peak_day_median=(
            round(_num(s.get("peak_day"), "median"))
            if _num(s.get("peak_day"), "median") is not None
            else None
        ),
        recovered_median=_num(s.get("recovered"), "median"),
        summary=s,
        run_peaks=list(result.get("run_peaks", [])),
        series=result.get("series", {}),
        districts=result.get("districts", []),
        movement=result.get("movement", {}),
    )


class SimulationWorker:
    def __init__(self, threads: int = 2):
        self.executor = ThreadPoolExecutor(max_workers=max(1, threads), thread_name_prefix="episim-sim")
        self._pending: dict[str, Future] = {}
        self._lock = threading.Lock()

    @property
    def queue_depth(self) -> int:
        with self._lock:
            return sum(1 for f in self._pending.values() if not f.done())

    def submit(self, run_id: str) -> Future:
        fut = self.executor.submit(self._execute, run_id)
        with self._lock:
            self._pending = {k: v for k, v in self._pending.items() if not v.done()}
            self._pending[run_id] = fut
        return fut

    def shutdown(self) -> None:
        self.executor.shutdown(wait=False, cancel_futures=True)

    def _execute(self, run_id: str) -> None:
        with dbmod.SessionLocal() as db:
            run = db.get(SimulationRun, run_id)
            if run is None or run.status != "queued":
                return  # cancelled while queued
            run.status = "running"
            run.started_at = utcnow()
            db.commit()
            snapshot = dict(run.inputs_snapshot)
        started = time.monotonic()
        last_progress = [0.0]
        last_cancel = [0.0, False]

        def progress(fraction: float) -> None:
            now = time.monotonic()
            if now - last_progress[0] < PROGRESS_INTERVAL and fraction < 1:
                return
            last_progress[0] = now
            with dbmod.SessionLocal() as s:
                s.execute(
                    update(SimulationRun)
                    .where(SimulationRun.id == run_id, SimulationRun.status == "running")
                    .values(progress=max(0.0, min(0.99, float(fraction))))
                )
                s.commit()

        def should_cancel() -> bool:
            now = time.monotonic()
            if now - last_cancel[0] >= CANCEL_INTERVAL:
                last_cancel[0] = now
                with dbmod.SessionLocal() as s:
                    last_cancel[1] = bool(
                        s.scalar(select(SimulationRun.cancel_requested).where(SimulationRun.id == run_id))
                    )
            return last_cancel[1]

        cancelled_exc: type[BaseException] = Cancelled
        try:
            run_model, cancelled_exc, _version = engine()
            result = run_model(snapshot, progress, should_cancel)
            if should_cancel():
                raise cancelled_exc()
        except BaseException as exc:  # noqa: BLE001
            with dbmod.SessionLocal() as db:
                run = db.get(SimulationRun, run_id)
                run.duration_sec = round(time.monotonic() - started, 2)
                run.completed_at = utcnow()
                if isinstance(exc, cancelled_exc) or isinstance(exc, Cancelled):
                    run.status = "cancelled"
                else:
                    log.exception("Run %s failed", run_id)
                    run.status = "failed"
                    run.error_message = failure_message(exc)
                db.commit()
            if not isinstance(exc, Exception):
                raise
            return
        with dbmod.SessionLocal() as db:
            run = db.get(SimulationRun, run_id)
            db.add(store_result(run_id, result))
            run.status = "completed"
            run.progress = 1.0
            run.completed_at = utcnow()
            run.duration_sec = round(time.monotonic() - started, 2)
            db.commit()


def mark_stale_runs() -> int:
    """On startup, runs left queued or running by a previous process can never finish."""
    with dbmod.SessionLocal() as db:
        stale = db.scalars(select(SimulationRun).where(SimulationRun.status.in_(["queued", "running"]))).all()
        for run in stale:
            run.status = "failed"
            run.completed_at = utcnow()
            run.error_message = "The server restarted while this run was waiting or running. Start it again."
        db.commit()
        return len(stale)


_worker: SimulationWorker | None = None


def get_worker() -> SimulationWorker:
    global _worker
    if _worker is None:
        from app.config import get_settings

        _worker = SimulationWorker(get_settings().worker_threads)
    return _worker
