# Reference engine (TypeScript prototype)

`src/` is a copy of the prototype's in-browser engine (`frontend/src/lib/models/*.ts`). Only the import
lines were changed, adding `.ts` extensions and `type` modifiers, so Node can run it with type stripping.
The equations are untouched. It is kept here only to produce reference outputs for the Python port; the app
does not use it.

## Regenerate

From the repository root (Node 22.6+ with type stripping; Node 24 runs `.ts` directly):

```bash
node tools/reference-engine/generate.ts
```

This writes `backend/tests/simulation/reference/`:

- `ebola.json`, `marburg.json`: `runSEIHFR(defaultSettings(id))` over seeds 2026, 11, 42, 777 and 9001
  (5 × 200 = 1000 Monte Carlo runs). The files hold distribution statistics (5th, 50th and 95th
  percentile and the mean) of final cases, deaths, peak hospitalised and health-worker infections, the
  take-off probabilities, and cumulative, active, hospitalised and death counts on days 30, 60, 90, 120 and 180.
- `rt.json`: `estimateRt` on a fixed 30-day case series with each disease's serial interval (window 7).

`backend/tests/simulation/test_parity.py` and `test_analysis_rt.py` compare the NumPy engine against
these files. Parity is checked at the distribution level, because the two random number generators
differ and the TS engine approximates large binomials.
