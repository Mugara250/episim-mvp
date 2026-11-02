import time

import numpy as np
import pytest

from app.simulation import Cancelled, run_model
from app.simulation.core import simulate
from app.simulation.levers import build_levers
from app.simulation.seihfr import core_inputs

SERIES = (
    "active",
    "hospitalised",
    "funerals",
    "cumulative",
    "deaths",
    "hcw_cumulative",
    "community_cumulative",
    "incidence",
)


@pytest.mark.parametrize("disease", ["ebola", "marburg"])
def test_compartments_and_staff_are_conserved(snapshot, disease):
    snap = snapshot(disease, runs=100, days=120)
    snap["interventions"]["items"] = [
        {
            "type_key": "vaccination",
            "lever": "vaccination",
            "mechanism": "shift",
            "start_day": 10,
            "end_day": 60,
            "coverage": 0.4,
            "effect": 0.9,
        },
    ]
    raw = simulate(core_inputs(snap), debug=True)
    assert raw["max_conservation_error"] == 0


def test_r0_zero_gives_no_outbreak(snapshot):
    snap = snapshot()
    snap["disease"]["r0"] = 0
    r = run_model(snap)
    comm = np.array(r["series"]["community_cumulative"]["high"])
    assert comm.max() == snap["initial_cases"]  # no community infections beyond the seeds
    assert r["summary"]["p_take_off"] == 0


def test_same_seed_gives_identical_output(snapshot):
    assert run_model(snapshot(runs=50)) == run_model(snapshot(runs=50))


def test_different_seeds_differ(snapshot):
    a = run_model(snapshot(runs=50, seed=1))
    b = run_model(snapshot(runs=50, seed=2))
    assert a["run_peaks"] != b["run_peaks"]


def test_bands_are_ordered(snapshot):
    r = run_model(snapshot())
    for name in SERIES:
        s = r["series"][name]
        assert len(s["median"]) == 181
        assert all(lo <= m <= hi for lo, m, hi in zip(s["low"], s["median"], s["high"], strict=True)), name
    for key in ("final_cases", "final_deaths", "peak_beds", "hcw_share", "peak_infectious", "recovered"):
        v = r["summary"][key]
        assert v["low"] <= v["median"] <= v["high"], key


def _items(strength):
    return [
        {
            "type_key": "contact_tracing",
            "lever": "contact_tracing",
            "start_day": 0,
            "end_day": None,
            "coverage": strength,
            "effect": 0.8,
        },
        {
            "type_key": "safe_burials",
            "lever": "safe_burial",
            "start_day": 0,
            "end_day": None,
            "coverage": strength,
            "effect": 0.9,
        },
        {
            "type_key": "case_isolation",
            "lever": "isolation",
            "start_day": 0,
            "end_day": None,
            "coverage": strength,
            "effect": 0.8,
        },
    ]


def test_stronger_interventions_reduce_expected_cases(snapshot):
    medians, means = [], []
    for strength in (0.0, 0.3, 0.6, 0.9):
        snap = snapshot(runs=400)
        snap["interventions"]["items"] = _items(strength)
        r = run_model(snap)
        medians.append(r["summary"]["final_cases"]["median"])
        means.append(np.mean(r["series"]["cumulative"]["median"]))
    assert medians == sorted(medians, reverse=True), medians
    assert medians[-1] < medians[0]


@pytest.mark.parametrize(
    "key,lever",
    [
        ("lockdown", "community"),
        ("masking", "masking"),
        ("testing", "detection"),
        ("vaccination", "vaccination"),
    ],
)
def test_each_new_lever_reduces_cases(snapshot, key, lever):
    base = run_model(snapshot(runs=300))
    snap = snapshot(runs=300)
    snap["interventions"]["items"] = [
        {"type_key": key, "lever": lever, "start_day": 0, "end_day": None, "coverage": 0.8, "effect": 0.6}
    ]
    r = run_model(snap)
    assert r["summary"]["final_cases"]["high"] < base["summary"]["final_cases"]["high"]


def test_levers_follow_time_windows():
    from .conftest import EBOLA

    lv = build_levers(
        EBOLA,
        [{"type_key": "contact_tracing", "start_day": 10, "end_day": 20, "coverage": 1, "effect": 0.5}],
        30,
    )
    assert lv["contact_tracing"][9] == pytest.approx(0.4)
    assert lv["contact_tracing"][10] == pytest.approx(0.4 + 0.6 * 0.5)
    assert lv["contact_tracing"][20] == pytest.approx(0.7)
    assert lv["contact_tracing"][21] == pytest.approx(0.4)
    # Two items combine multiplicatively on the remaining gap (docs D14).
    two = build_levers(
        EBOLA,
        [{"type_key": "contact_tracing", "start_day": 0, "end_day": None, "coverage": 1, "effect": 0.5}] * 2,
        5,
    )
    assert two["contact_tracing"][0] == pytest.approx(1 - 0.6 * 0.5 * 0.5)
    assert lv["detection"][0] == pytest.approx(4.5)


def test_progress_and_cancel(snapshot):
    seen = []
    run_model(snapshot(runs=20), progress=seen.append)
    assert seen[-1] == 1.0 and seen == sorted(seen)
    calls = {"n": 0}

    def cancel():
        calls["n"] += 1
        return calls["n"] > 10

    with pytest.raises(Cancelled):
        run_model(snapshot(runs=20), should_cancel=cancel)


def test_unknown_model_type(snapshot):
    with pytest.raises(ValueError):
        run_model(snapshot(model_type="abm"))


def test_performance_200_runs_180_days(snapshot):
    t = time.perf_counter()
    run_model(snapshot())
    assert time.perf_counter() - t < 5
