"""Back-test: run EpiSim's built-in Ebola preset against the 2014 West Africa outbreak.

What it does
- Downloads the WHO-derived country time series compiled by Caitlin Rivers
  (https://github.com/cmrivers/ebola, country_timeseries.csv). The file is not vendored
  because its licence is unstated; it is cached in backend/var/backtest/.
- For Guinea, Liberia and Sierra Leone, starts the model on the date of the country's first
  report, using only what was known then: the first reported cumulative count becomes the
  initial infectious cases, and the population is the approximate 2014 national total.
- Runs the built-in Ebola preset exactly as seeded (no fitting, no interventions, baseline
  response levers) for 180 days, 200 Monte Carlo runs, seed 2026.
- Compares the model's cumulative-cases band with every later reported cumulative count,
  writes docs/backtest/ebola_west_africa_2014.png and docs/backtest/RESULTS.md.

What it does not do
- It does not calibrate anything. A miss is reported as a miss.
- Reported counts mix confirmed, probable and suspected cases and were revised over time;
  real interventions (which the model run does not include) changed during the period.

Run from the repository root with `make backtest`.
"""

from __future__ import annotations

import csv
import io
import json
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.simulation.registry import run_model  # noqa: E402
from app.simulation.version import ENGINE_VERSION  # noqa: E402

SOURCE_URL = "https://raw.githubusercontent.com/cmrivers/ebola/master/country_timeseries.csv"
CACHE = BACKEND / "var" / "backtest" / "country_timeseries.csv"
OUT_DIR = ROOT / "docs" / "backtest"
DAYS = 180
RUNS = 200
SEED = 2026

# Approximate 2014 national populations (World Bank estimates, rounded). Used only as the
# susceptible pool; the early outbreak is far too small for the exact figure to matter.
COUNTRIES = {
    "Guinea": 11_800_000,
    "Liberia": 4_400_000,
    "SierraLeone": 7_100_000,
}

# Docs Module 4 defaults; the seed file leaves these to the database column defaults.
DEFAULT_ROUTE_SHARE = {"community": 0.55, "hospital": 0.15, "funeral": 0.30}
DEFAULT_BASELINE = {"safe_burial": 0.5, "contact_tracing": 0.4, "isolation": 0.5}


def load_series() -> list[dict]:
    if not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(SOURCE_URL, timeout=30) as resp:
            CACHE.write_bytes(resp.read())
    rows = list(csv.DictReader(io.StringIO(CACHE.read_text())))
    for r in rows:
        r["date"] = datetime.strptime(r["Date"], "%m/%d/%Y").date()
    return sorted(rows, key=lambda r: r["date"])


def ebola_profile() -> dict:
    seed = json.loads((BACKEND / "app" / "data" / "seed" / "disease_presets.json").read_text())
    p = next(x for x in seed["presets"] if x["id"] == "ebola-zaire")
    return {
        "key": p["disease"],
        "name": p["name"],
        "r0": p["r0_likely"],
        "k": p["overdispersion_k"],
        "incubation": p["incubation_days"],
        "onset_to_admission": p["onset_to_admission_days"],
        "onset_to_death": p["onset_to_death_days"],
        "onset_to_recovery": p["onset_to_recovery_days"],
        "cfr_community": p["cfr_community"],
        "cfr_hospital": p["cfr_hospital"],
        "hospitalised": p["share_hospitalised"],
        "burial_delay": p["burial_delay_days"],
        "hcw_risk": p["hcw_risk"],
        "serial_interval_mean": p["serial_interval_mean"],
        "serial_interval_sd": p["serial_interval_sd"],
        "route_share": {
            "community": p.get("route_share_community", DEFAULT_ROUTE_SHARE["community"]),
            "hospital": p.get("route_share_hospital", DEFAULT_ROUTE_SHARE["hospital"]),
            "funeral": p.get("route_share_funeral", DEFAULT_ROUTE_SHARE["funeral"]),
        },
        "baseline": {
            "safe_burial": p.get("baseline_safe_burial", DEFAULT_BASELINE["safe_burial"]),
            "contact_tracing": p.get("baseline_contact_tracing", DEFAULT_BASELINE["contact_tracing"]),
            "isolation": p.get("baseline_isolation", DEFAULT_BASELINE["isolation"]),
        },
        "provisional": p["provisional"],
        "reference": p["reference"],
    }


def observations(rows: list[dict], country: str) -> list[tuple[int, int, int]]:
    """(day since first report, cumulative reported cases, cumulative deaths) for one country."""
    # Blank cells are days without a report; a 0 after an earlier non-zero count is a placeholder
    # in the source file, so it is treated as missing too.
    obs = [(r["date"], int(r[f"Cases_{country}"]), int(r[f"Deaths_{country}"] or 0))
           for r in rows if r[f"Cases_{country}"].strip() and int(r[f"Cases_{country}"]) > 0]
    start = obs[0][0]
    return [((d - start).days, c, deaths) for d, c, deaths in obs]


def backtest_country(country: str, population: int, obs: list[tuple[int, int, int]], disease: dict,
                     start_rule: str = "reported") -> dict:
    """start_rule "reported": initial cases = first reported cumulative count (primary, fixed in advance).
    "alive": first reported count minus reported deaths (sensitivity check, added after the first run)."""
    initial = obs[0][1] if start_rule == "reported" else max(1, obs[0][1] - obs[0][2])
    snapshot = {
        "model_type": "seihfr",
        "seed": SEED,
        "runs": RUNS,
        "days": DAYS,
        "initial_cases": initial,
        "branching_until": 20,
        "population": {"dataset_id": "backtest", "dataset_version": 1, "total": population},
        "disease": disease,
        "interventions": {"package_id": None, "items": []},
        "hcw": {"pool": 600, "ppe_before": 0.3, "ppe_after": 0.85, "recognition_day": 14},
    }
    cum = run_model(snapshot)["series"]["cumulative"]
    points = []
    for day, observed, _deaths in obs[1:]:
        if day > DAYS:
            break
        low, med, high = cum["low"][day], cum["median"][day], cum["high"][day]
        points.append({"day": day, "observed": observed, "low": low, "median": med, "high": high,
                       "inside": low <= observed <= high})
    return {"country": country, "start_rule": start_rule, "initial": initial, "population": population, "band": cum, "points": points}


def checkpoint(points: list[dict], target_day: int) -> dict | None:
    eligible = [p for p in points if p["day"] <= target_day]
    return eligible[-1] if eligible else None


def plot(results: list[dict], path: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(1, len(results), figsize=(5 * len(results), 4), sharey=False)
    for ax, res in zip(axes, results, strict=True):
        band = res["band"]
        days = list(range(len(band["median"])))
        ax.fill_between(days, band["low"], band["high"], color="#10B981", alpha=0.2, label="Model 5–95%")
        ax.plot(days, band["median"], color="#047857", label="Model median")
        ax.scatter([p["day"] for p in res["points"]], [p["observed"] for p in res["points"]],
                   s=10, color="#111827", label="Reported (WHO)", zorder=3)
        ax.set_title(f"{res['country']} (start: {res['initial']} reported cases)")
        ax.set_xlabel("Days since first report")
        ax.set_yscale("symlog")
        ax.grid(alpha=0.3)
    axes[0].set_ylabel("Cumulative cases")
    axes[0].legend(loc="upper left", fontsize=8)
    fig.suptitle("EpiSim back-test: built-in Ebola preset vs 2014 West Africa reports — not calibrated", fontsize=11)
    fig.tight_layout()
    fig.savefig(path, dpi=130)


def fmt(x: float) -> str:
    return f"{x:,.0f}"


def summary_rows(results: list[dict]) -> list[str]:
    rows = []
    for res in results:
        pts = res["points"]
        inside = sum(p["inside"] for p in pts)
        cells = []
        for target in (60, 120, 180):
            c = checkpoint(pts, target)
            cells.append(f"{fmt(c['observed'])} vs {fmt(c['median'])} (day {c['day']})" if c else "—")
        share = f"{inside}/{len(pts)} ({inside / len(pts):.0%})" if pts else "—"
        rows.append(f"| {res['country']} | {res['initial']} | {len(pts)} | {share} | " + " | ".join(cells) + " |")
    return rows


def write_report(results: list[dict], sensitivity: list[dict], path: Path) -> None:
    lines = [
        "# Back-test: Ebola preset vs the 2014 West Africa outbreak",
        "",
        f"Generated by `tools/backtest/backtest_ebola.py` (engine `{ENGINE_VERSION}`, {RUNS} runs, seed {SEED}).",
        "",
        "**Data:** WHO situation reports as compiled in Caitlin Rivers' `cmrivers/ebola` "
        "`country_timeseries.csv` (cumulative reported cases: confirmed, probable and suspected).",
        "",
        "**Method:** the built-in Ebola preset as seeded, with no fitting and no interventions, "
        "started on each country's first report with the first reported count as the initial cases. "
        "Every later report up to day 180 is compared with the model's 5–95% band of cumulative cases.",
        "",
        "![back-test](ebola_west_africa_2014.png)",
        "",
        "| Country | Start cases | Reports compared | Inside 5–95% band | Day ~60: reported vs median | Day ~120 | Day ~180 |",
        "|---|---|---|---|---|---|---|",
    ]
    lines += summary_rows(results)
    lines += [
        "",
        "### Sensitivity: start from reported cases minus reported deaths",
        "",
        "Added after the first run, because Guinea's first report (49 cases) already included 29 deaths, "
        "and treating every reported case as still infectious overstates the start. Shown alongside the "
        "primary result, not instead of it.",
        "",
        "| Country | Start cases | Reports compared | Inside 5–95% band | Day ~60: reported vs median | Day ~120 | Day ~180 |",
        "|---|---|---|---|---|---|---|",
    ]
    lines += summary_rows(sensitivity)
    lines += ["", "## Reading the primary result honestly", ""]
    for res in results:
        pts = res["points"]
        if not pts:
            continue
        below = sum(p["observed"] < p["low"] for p in pts)
        above = sum(p["observed"] > p["high"] for p in pts)
        last = pts[-1]
        ratio = last["observed"] / last["median"] if last["median"] else float("inf")
        verdict = "inside the band" if last["inside"] else ("above the band" if last["observed"] > last["high"] else "below the band")
        lines.append(
            f"- **{res['country']}:** {below} reports fell below the band and {above} above it. "
            f"At day {last['day']} the reported total was {fmt(last['observed'])} against a model median of "
            f"{fmt(last['median'])} (ratio {ratio:.2f}), {verdict}."
        )
    lines += [
        "",
        "## Caveats",
        "",
        "- The preset values are provisional and have not been reviewed for EpiSim (docs section 10).",
        "- The model run has no interventions, while the real response changed over the period.",
        "- Each country is treated as one well-mixed population; the real outbreak spread between "
        "places and across borders.",
        "- Reported counts were revised, mix case definitions and lag behind onset.",
        "- The two start rules give very different answers (Liberia and Sierra Leone die out early in most "
        "runs when started from 1–2 cases). Early-outbreak projections are highly sensitive to the starting "
        "count and to chance; treat any single band with caution.",
        "- This is one back-test on one outbreak. It does not validate the model.",
        "",
    ]
    path.write_text("\n".join(lines))


def main() -> None:
    rows = load_series()
    disease = ebola_profile()
    results = [backtest_country(c, pop, observations(rows, c), disease) for c, pop in COUNTRIES.items()]
    sensitivity = [backtest_country(c, pop, observations(rows, c), disease, "alive") for c, pop in COUNTRIES.items()]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    plot(results, OUT_DIR / "ebola_west_africa_2014.png")
    write_report(results, sensitivity, OUT_DIR / "RESULTS.md")
    for label, group in (("primary", results), ("sensitivity", sensitivity)):
        for res in group:
            inside = sum(p["inside"] for p in res["points"])
            print(f"[{label}] {res['country']}: {inside}/{len(res['points'])} reports inside the 5-95% band")
    print(f"Wrote {OUT_DIR / 'RESULTS.md'}")


if __name__ == "__main__":
    main()
