# Decisions, conflicts and deviations

Precedence when sources disagree: (1) the MVP build prompt, (2) the frontend prototype's
behaviour and `src/lib/rbac.ts`, (3) `epidemic-simulation-full-documentation.md`.
Each entry says what the sources said, what we did, and why. Entries marked **needs review**
should be looked at by an epidemiologist or the product owner.

| # | Topic | Sources say | What the MVP does | Why |
|---|---|---|---|---|
| X1 | Repository layout | The prototype zip unpacked to `frontend/frontend/` with Windows `Zone.Identifier` sidecar files | Flattened to `frontend/`, sidecars deleted | Prompt expects `frontend/` |
| X2 | District boundary file | Prompt: properties `name, province, cx, cy`. Docs: `code` (NISR-style) as primary key | File keeps all of `code, name, province, cx, cy`. `cx, cy` are area-weighted polygon centroids in lon/lat computed by `tools/normalise_geojson.py`. Codes follow the NISR province-first pattern (11 Nyarugenge … 57 Bugesera) | Satisfies both. **Codes should be confirmed against NISR** |
| X3 | API JSON casing | Docs schemas use snake_case | API bodies use camelCase (Pydantic alias generator); DB columns stay snake_case | Keeps the prototype's TypeScript types nearly unchanged |
| X4 | Primary keys | Docs: uuid PK plus a readable code | Readable string ids are the PK (`SC-1048`, `RUN-0143`, `RPT-032`); other tables use short string ids | Prototype links and seed data already use readable ids; still Postgres-compatible |
