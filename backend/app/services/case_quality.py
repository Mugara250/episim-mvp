"""Data-quality checks on daily case counts (docs Module 16). By facility or district, never by patient."""

from collections import Counter, defaultdict
from datetime import timedelta

from app.models import CaseRecord


def quality(records: list[CaseRecord]) -> tuple[str, list[dict]]:
    issues = []
    by_loc: dict[str, list[CaseRecord]] = defaultdict(list)
    for r in records:
        by_loc[r.location or "All"].append(r)
    dupes, missing, negative = [], [], []
    for loc, rows in by_loc.items():
        counts = Counter(r.record_date for r in rows)
        dupes += [
            {"where": loc, "field": "date", "value": d.isoformat(), "note": f"{n} entries for one day"}
            for d, n in counts.items()
            if n > 1
        ]
        days = sorted(counts)
        for a, b in zip(days, days[1:], strict=False):
            gap = (b - a).days
            if gap > 1:
                missing.append(
                    {
                        "where": loc,
                        "field": "date",
                        "value": (a + timedelta(days=1)).isoformat(),
                        "note": f"{gap - 1} day(s) with no report",
                    }
                )
        negative += [
            {"where": loc, "field": "new_cases", "value": str(r.new_cases), "note": "Negative count"}
            for r in rows
            if r.new_cases < 0
        ]
    if missing:
        issues.append({"type": "Missing days", "severity": "warning", "rows": missing})
    if dupes:
        issues.append({"type": "Duplicate entries", "severity": "warning", "rows": dupes})
    if negative:
        issues.append({"type": "Negative counts", "severity": "error", "rows": negative})
    status = "Failed" if negative else "Warnings" if issues else "Passed"
    return status, issues


def daily_counts(records: list[CaseRecord]) -> tuple[list[int], object]:
    """Sum per day from the first to the last date (missing days count as 0; negatives as 0)."""
    if not records:
        return [], None
    start = min(r.record_date for r in records)
    end = max(r.record_date for r in records)
    counts = [0] * ((end - start).days + 1)
    for r in records:
        counts[(r.record_date - start).days] += max(0, r.new_cases)
    return counts, start
