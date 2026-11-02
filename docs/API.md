# EpiSim API index

All routes are under `/api`; JSON bodies and query parameters are camelCase. Interactive docs: `http://localhost:8000/docs`.
Auth: `Authorization: Bearer <accessToken>` from `POST /api/auth/login`. Permission checks mirror `frontend/src/lib/rbac.ts`.

| Module | Endpoints |
|---|---|
| Meta | `GET /meta` (public: demo mode, versions, honesty labels, demo users), `GET /health` |
| 1 Auth | `POST /auth/login`, `POST /auth/demo-login {role}` (demo mode), `GET /auth/me`, `POST /auth/logout`, `POST /access-requests` (public), `GET /access-requests/status?email=` |
| 2 Dashboard | `GET /dashboard/analyst`, `GET /dashboard/officer`, `GET /dashboard/policymaker` |
| 3 Population | `GET /population/datasets`, `GET /population/datasets/options`, `GET /population/datasets/{id}`, `GET /population/datasets/{id}/versions/{v}`, `GET /population/fields`, `POST /population/imports/check` (multipart), `POST /population/imports` (multipart → job), `GET /population/imports`, `GET /population/imports/{id}` |
| 4 Disease presets | `GET/POST /disease-presets`, `GET/PUT/DELETE /disease-presets/{id}`, `POST /disease-presets/{id}/clone`, `POST /disease-presets/{id}/approve` |
| 8 Interventions | `GET /intervention-levers`, `GET/POST /intervention-types`, `PUT /intervention-types/{id}`, `POST /intervention-types/{id}/clone`, `GET/POST /intervention-packages`, `GET/PUT/DELETE /intervention-packages/{id}` |
| 10 Capacity | `GET/POST /capacity-profiles`, `GET /capacity-profiles/options`, `GET/PUT/DELETE /capacity-profiles/{id}`, `GET /capacity-profiles/{id}/comparisons`, `GET /institutions` |
| Scenario Builder | `GET/POST /scenarios` (`?tab=mine|shared`), `GET /scenarios/share-targets`, `GET/PUT/DELETE /scenarios/{id}`, `POST /scenarios/{id}/clone`, `PUT /scenarios/{id}/shares` |
| 5 Simulations | `POST /simulations` (202, queued), `GET /simulations` (`?scenarioId=&status=`), `GET /simulations/{id}`, `POST /simulations/{id}/cancel` |
| 6/11 Results | `GET /simulations/{id}/results?capacityProfileId=`, `GET /simulations/{id}/results/series` |
| 15 Health workers | `GET /simulations/{id}/results/health-workers`, `POST /simulations/{id}/health-workers/what-if` |
| 16 Rt | `GET /simulations/{id}/results/rt`, `GET/POST /rt/datasets`, `POST /rt/datasets/{id}/records`, `DELETE /rt/datasets/{id}/records/last`, `GET /rt/datasets/{id}/quality`, `GET /rt/estimate?datasetId=&diseaseKey=&window=` |
| 9 Geographic | `GET /geographic/districts` (GeoJSON + attribution), `GET /geographic/movement`, `GET/PUT /geographic/border-risks`, `GET /simulations/{id}/geographic?capacityProfileId=`, `POST /simulations/{id}/geographic/what-if` |
| 12 Comparison | `GET /comparison?runIds=a,b[,c]&capacityProfileId=&baselineId=`, `GET/POST /scenario-comparisons`, `GET/PUT/DELETE /scenario-comparisons/{id}` |
| 13 Reports | `GET/POST /reports`, `GET/PUT/DELETE /reports/{id}`, `POST /reports/{id}/submit`, `POST /reports/{id}/return`, `POST /reports/{id}/approve`, `POST /reports/{id}/exports`, `GET /reports/{id}/exports`, `GET /reports/{id}/exports/{exportId}/download` |
| 13 Policy | `GET /approved-scenarios`, `POST /scenarios/{id}/approve`, `GET /intervention-reviews`, `PUT /intervention-reviews/{id}`, `GET /policy-alerts` |
| 17 Hospital ops | `GET /hospital/me`, `GET/POST /hospital/entries`, `GET/POST /hospital/instructions`, `PUT /hospital/instructions/{id}/status`, `GET/POST /hospital/plans`, `PUT/DELETE /hospital/plans/{id}` |
| 14 Admin | `GET/POST /admin/users`, `PUT /admin/users/{id}`, `PUT /admin/users/{id}/status`, `GET /admin/access-requests`, `POST /admin/access-requests/mark-seen`, `POST /admin/access-requests/{id}/approve|reject`, `GET /admin/audit-log`, `GET/POST /admin/hospitals`, `PUT /admin/hospitals/{id}`, `GET /admin/system-health`, `GET/POST /admin/announcements`, `PUT/DELETE /admin/announcements/{id}`, `GET /admin/tickets`, `PUT /admin/tickets/{id}/status`, `GET /admin/settings`, `PUT /admin/settings/{key}`; any user: `POST /support-tickets`, `GET /announcements` |
