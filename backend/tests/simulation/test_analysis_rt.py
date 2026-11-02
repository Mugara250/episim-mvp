import json
from pathlib import Path

import pytest

from app.simulation.analysis import district_bed_status, first_day_over, p_beds_exceeded, utilisation
from app.simulation.rt import estimate_rt, serial_weights, trend_of

REF = Path(__file__).parent / "reference"


def test_p_beds_exceeded_is_strictly_greater():
    assert p_beds_exceeded([10, 20, 40, 41, 100], 40) == pytest.approx(2 / 5)
    assert p_beds_exceeded([], 40) == 0
    assert p_beds_exceeded([0, 0], 0) == 0


def test_first_day_over():
    assert first_day_over([0, 5, 40, 41, 50], 40) == 3
    assert first_day_over([0, 5, 40], 40) is None


def test_district_bed_status():
    d = {
        "code": "33",
        "peak_hospitalised": {"low": 1, "median": 12, "high": 30},
        "series": {"hospitalised": {"median": [0, 2, 6, 12, 8]}},
        "run_peak_hospitalised": [3, 12, 30, 8],
    }
    rows = district_bed_status([d, {**d, "code": "11"}], {"33": 10})
    assert rows[0]["beds_run_out_day"] == 3 and rows[0]["status"] == "short"
    assert rows[0]["p_beds_exceeded"] == 0.5
    assert rows[1]["status"] == "unknown" and rows[1]["beds"] is None
    assert utilisation([0, 5, 20], 10) == [0, 0.5, 2.0]


def test_serial_weights_normalised():
    w = serial_weights(15.4, 9.3)
    assert w[0] == 0 and sum(w) == pytest.approx(1)


@pytest.mark.parametrize(
    "disease,si", [("ebola", {"mean": 15.4, "sd": 9.3}), ("marburg", {"mean": 9, "sd": 5})]
)
def test_rt_matches_typescript(disease, si):
    ref = json.loads((REF / "rt.json").read_text())
    ours = estimate_rt(ref["cases"], si, ref["window"])
    for a, b in zip(ours, ref["rt"][disease], strict=True):
        for key in ("rt", "low", "high"):
            if b[key] is None:
                assert a[key] is None
            else:
                assert a[key] == pytest.approx(b[key], rel=1e-9)


def test_trend_labels():
    assert trend_of({"rt": 1.5, "low": 1.1, "high": 2}) == "growing"
    assert trend_of({"rt": 0.7, "low": 0.5, "high": 0.9}) == "shrinking"
    assert trend_of({"rt": 1, "low": 0.8, "high": 1.3}) == "uncertain"
    assert trend_of({"rt": None, "low": None, "high": None}) == "not-enough-data"
    assert trend_of(None) == "not-enough-data"
