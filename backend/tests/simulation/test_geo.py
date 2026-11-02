import time

import numpy as np
import pytest

from app.simulation import run_model
from app.simulation.core import simulate
from app.simulation.movement import gravity_matrix
from app.simulation.seihfr_geo import core_inputs


def test_movement_matrix_is_row_stochastic(geo_snapshot):
    inp, districts, trips = core_inputs(geo_snapshot())
    assert np.allclose(inp.movement.sum(1), 1)
    assert np.allclose(np.diag(inp.movement), 0.98)
    assert (trips >= 0).all()
    m, _ = gravity_matrix(districts, {"away_share": 0.05})
    assert np.allclose(np.diag(m), 0.95)


def test_population_conserved_per_district(geo_snapshot):
    raw = simulate(core_inputs(geo_snapshot(runs=50, days=90))[0], debug=True)
    assert raw["max_conservation_error"] == 0


def test_r0_zero_keeps_outbreak_in_seed(geo_snapshot):
    snap = geo_snapshot(runs=50)
    snap["disease"]["r0"] = 0
    r = run_model(snap)
    others = [d for d in r["districts"] if d["code"] != "33"]
    assert all(d["p_reached"] == 0 for d in others)


@pytest.fixture(scope="module")
def geo_result():
    from .conftest import make_geo_snapshot

    snap = make_geo_snapshot(runs=200, days=180, initial_cases=10)
    snap["geo"]["movement"] = {"away_share": 0.05}
    return run_model(snap)


def test_seed_district_reached_first(geo_result):
    by_code = {d["code"]: d for d in geo_result["districts"]}
    seed = by_code["33"]
    assert seed["p_reached"] == 1 and seed["first_case_day"]["median"] == 0
    for d in geo_result["districts"]:
        if d["code"] != "33" and d["first_case_day"]["median"] is not None:
            assert d["first_case_day"]["median"] > 0
    assert sum(d["p_reached"] > 0 for d in geo_result["districts"]) > 1  # it does spread


def test_district_outputs_shape(geo_result):
    assert len(geo_result["districts"]) == 30
    for d in geo_result["districts"]:
        for band in ("cumulative", "hospitalised"):
            s = d["series"][band]
            assert len(s["median"]) == 181
            assert all(lo <= m <= hi for lo, m, hi in zip(s["low"], s["median"], s["high"], strict=True))
        assert len(d["run_peak_hospitalised"]) == 200
        assert len(d["series"]["incidence"]) == 181
    national = np.array(geo_result["series"]["cumulative"]["median"])
    assert (np.diff(national) >= 0).all()
    links = geo_result["movement"]["links"]
    assert len(links) == 10 and geo_result["movement"]["estimated"] is True


def test_response_what_if_lowers_cases_in_district(geo_snapshot):
    base = geo_snapshot(runs=150, initial_cases=10)
    what_if = geo_snapshot(runs=150, initial_cases=10)
    what_if["geo"]["response"] = {"district_code": "33", "start_day": 10}
    a = {d["code"]: d for d in run_model(base)["districts"]}["33"]
    b = {d["code"]: d for d in run_model(what_if)["districts"]}["33"]
    assert b["total_cases"]["median"] < a["total_cases"]["median"]
    assert b["total_cases"]["high"] < a["total_cases"]["high"]


def test_border_importation_seeds_entry_district(geo_snapshot):
    snap = geo_snapshot(runs=50, days=60)
    snap["disease"]["r0"] = 0
    snap["geo"]["border_importation"] = [
        {"country": "Uganda", "risk": "Medium", "entry_district_code": "52", "weekly_rate": 3}
    ]
    by_code = {d["code"]: d for d in run_model(snap)["districts"]}
    assert by_code["52"]["p_reached"] > 0.9


def test_unknown_seed_district(geo_snapshot):
    with pytest.raises(ValueError):
        run_model(geo_snapshot(seed_code="99"))


def test_geo_performance(geo_snapshot):
    t = time.perf_counter()
    run_model(geo_snapshot())
    assert time.perf_counter() - t < 15
