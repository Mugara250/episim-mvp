"""Distribution-level parity with the original TypeScript engine (tools/reference-engine).

Bit-for-bit equality is impossible: the RNGs differ, and NumPy draws exact binomials where the TS engine uses
Poisson/normal approximations for n >= 40. So we compare distributions over the same 5 seeds × 200 runs:
- probabilities (take-off, >50, >100 cases) within 0.07 absolute (≈3 standard errors of a two-sample
  difference at n = 1000, p ≈ 0.7);
- medians and 95th percentiles within 25% relative (+5 absolute for small counts). Outbreak sizes are
  heavy-tailed, so medians over 1000 runs move by ~10–15% between seed sets.
"""

import json
from pathlib import Path

import numpy as np
import pytest

from app.simulation.core import simulate
from app.simulation.seihfr import core_inputs

from .conftest import make_snapshot

REF = Path(__file__).parent / "reference"
SEEDS = (2026, 11, 42, 777, 9001)
REL, ABS = 0.25, 5.0


def close(ours, ref):
    return abs(ours - ref) <= REL * abs(ref) + ABS


@pytest.fixture(scope="module", params=["ebola", "marburg"])
def pair(request):
    ref = json.loads((REF / f"{request.param}.json").read_text())
    raws = [simulate(core_inputs(make_snapshot(request.param, seed=s))) for s in SEEDS]
    return ref, {
        k: np.concatenate([r[k] for r in raws]) for k in raws[0] if isinstance(raws[0][k], np.ndarray)
    }


def test_reference_uses_same_settings(pair):
    ref, _ = pair
    s = ref["settings"]
    snap = make_snapshot(ref["disease"])
    assert (s["runs"], s["days"], s["initialCases"], s["population"]) == (
        200,
        180,
        snap["initial_cases"],
        403000,
    )
    assert (s["contactTracing"], s["isolation"], s["safeBurial"]) == (0.4, 0.5, 0.5)
    assert ref["nRuns"] == 200 * len(SEEDS)


def test_probabilities(pair):
    ref, ours = pair
    fc = ours["final_cases"]
    assert abs(np.mean(fc >= 20) - ref["pTakeOff"]) <= 0.07
    assert abs(np.mean(fc > 50) - ref["pOver50"]) <= 0.07
    assert abs(np.mean(fc > 100) - ref["pOver100"]) <= 0.07
    assert abs(np.mean(ours["peak_hospitalised"] > 40) - ref["pBedsExceeded"]) <= 0.07


@pytest.mark.parametrize(
    "ours_key,ref_key",
    [
        ("final_cases", "finalCases"),
        ("final_deaths", "finalDeaths"),
        ("peak_hospitalised", "peakHospitalised"),
        ("hcw_infections", "hcwInfections"),
    ],
)
def test_outcome_quantiles(pair, ours_key, ref_key):
    ref, ours = pair
    v = ours[ours_key]
    assert close(np.quantile(v, 0.5), ref[ref_key]["median"])
    assert close(np.quantile(v, 0.95), ref[ref_key]["high"])


@pytest.mark.parametrize(
    "series,ref_key",
    [
        ("cumulative", "cumulativeAt"),
        ("active", "activeAt"),
        ("hospitalised", "hospitalisedAt"),
        ("deaths", "deathsAt"),
    ],
)
def test_daily_medians(pair, series, ref_key):
    ref, ours = pair
    for day, stats in ref[ref_key].items():
        assert close(np.quantile(ours[series][:, int(day)], 0.5), stats["median"]), (series, day)
