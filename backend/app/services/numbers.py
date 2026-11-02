"""Display rounding shared by the API and PDF so they match the browser (JavaScript rounds halves up)."""

import math


def half_up(value: float) -> int:
    """Round to the nearest whole number, halves away from zero (Python's round() goes to even)."""
    return int(math.copysign(math.floor(abs(value) + 0.5), value))


def pct(share: float) -> str:
    return f"{half_up(share * 100)}%"
