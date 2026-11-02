# EpiSim — Epidemic Spread Simulation System: Project Documentation

*Revised 2 November 2026 to match the current prototype and the product decisions made since the first version.*

This is a living document covering every module of EpiSim: its purpose, screens, API endpoints and database tables. Each module is filed under the layer it belongs to. Updates to any module are made here, not in a standalone file.

---

## Contents

- **0.** About this revision
- **1.** Product overview
- **2.** Architecture overview and module list
- **3.** Roles and permissions
- **Layer 1: User & Access:** Module 1 (Authentication), Module 2 (Dashboard), Module 14 (User & Access Management)
- **Layer 2: Configuration Data:** Reference data (districts), Module 3 (Population Data), Module 4 (Disease Parameters), Module 8 (Interventions), Module 10 (Healthcare Capacity), Scenario Builder, Module 17 (Hospital Data & Response Operations)
- **Layer 3: Simulation Engine:** Module 5 (Orchestration), Module 6 (Stochastic SEIHFR), Module 15 (Health-Worker Layer), Module 9 (Geographic Spread), Module 7 (Agent-Based, out of scope)
- **Layer 4: Analysis & Output:** Module 11 (Visualization), Module 12 (Comparison), Module 13 (Reporting & Approval), Module 16 (Rt Tracking)
- **8.** Data sources and integration
- **9.** MVP technical architecture
- **10.** Limitations and validation status
- **11.** Decision log
- **Appendix A:** Built-in disease preset values; **Appendix B:** Glossary

---

# 0. About this revision

## What changed from the previous version

| # | Change | Why |
|---|---|---|
| 1 | **The model is a stochastic SEIHFR model, not SEIR.** Compartments: Susceptible, Exposed, Infectious (community), Hospitalised, Funeral, Removed. Each scenario is run many times (Monte Carlo) and results are shown as ranges. | Ebola and Marburg spread through three routes (community, hospital, funeral). A plain SEIR model cannot show the effect of safe burials or hospital infection control. |
| 2 | **Four roles, not five.** Administrator, Epidemiologist, Public Health Officer, Policy Maker. The old `analyst` and `epidemiologist` entries were the same role. | Matches the prototype and its permission matrix. |
| 3 | **Geographic Spread (Module 9) is in scope**, as a district-level model of the 30 districts of Rwanda. Agent-based modelling (Module 7) stays out of scope. | Spread between districts is central to deciding where to send beds, staff and supplies. |
| 4 | **Scenario Comparison works only on completed simulation runs**, and the capacity profile is chosen when analysing, not when running. | Comparison should reflect real runs, and the same bed numbers should apply to every compared run. |
| 5 | **Three new modules were added:** Module 15 (Health-Worker Layer), Module 16 (Rt Tracking), Module 17 (Hospital Data and Response Operations). | They exist in the prototype and were not documented. |
| 6 | **Disease presets are restructured** for the SEIHFR model (Module 4). | The old fields (R0, incubation, infectious period, mortality) are not enough for a three-route model. |
| 7 | **Accounts are requested and approved** by an administrator, who assigns the role. Users do not pick their own role. | Matches the prototype's Request Account and Access Requests screens. |
| 8 | **Reports have an approval workflow.** Policy makers only see approved reports and approved scenarios. | Matches the prototype's Draft, Pending approval and Approved flow. |
| 9 | **New sections:** data sources and integration (Section 8), MVP architecture (Section 9), limitations and validation status (Section 10), decision log (Section 11). | These were missing and are needed for investors and expert reviewers. |

## Sources of truth

When sources disagree, use this order: (1) project decisions recorded in this document, (2) the behaviour of the frontend prototype and its permission matrix, (3) earlier versions of this documentation.

## Known gaps between this document and the prototype

The prototype is a front-end design export built with sample data. Where it differs from this document, this document describes the target.

| Area | State of the prototype | Target |
|---|---|---|
| Simulation engine | Two different engines exist: a stochastic SEIHFR engine (used for the Epidemiologist's scenario work) and a simpler deterministic SEIHFR used for run summary tiles. | One engine, stochastic SEIHFR (decision D1). |
| Disease Presets page | Still shows generic fields (R0, incubation days, infectious days, mortality, asymptomatic share, route). | SEIHFR preset fields (Module 4). |
| Interventions | Items have start and end days, but the stochastic engine uses constant levers. Lockdown, masking and vaccination have no lever in that engine. | Time-windowed levers for every intervention type (Module 6). |
| Scenario Comparison page | The exported page still shows placeholder radar and bar charts. | Comparison of completed runs with ranges (Module 12). |
| Geographic Spread page | Tile-grid map and illustrative bell-shaped curves per district, not a spread model. | District model with real boundaries (Module 9). |
| Dashboards, hospital data, reports, admin pages | Sample data held in the browser. | Database-backed (Section 9). |

---

# 1. Product overview

**EpiSim is a decision-support platform for health decision-makers in Rwanda.** It lets them test "what if" response scenarios during an outbreak and see how choices such as earlier isolation or safer burials change expected cases, hospital bed demand, health-worker infections and spread between districts.

- **First diseases:** Ebola and Marburg. The design allows other infectious diseases to be added as presets and models.
- **Users:** public and private health organisations, from hospitals to national agencies.
- **Core loop:** configure, simulate, analyse, refine. Results send users back to adjust a scenario and run again.

## What EpiSim is not

- **Not a surveillance system.** It does not replace eIDSR, DHIS2 or any system that collects case reports. It is a scenario layer that can sit on top of them.
- **Not a forecasting tool.** Outputs are scenario estimates with uncertainty ranges, not predictions of what will happen.
- **Not clinical decision support.** It works on populations, never on individual patients.

## Honesty principles

These apply to every screen, report and demonstration.

1. Results are labelled "scenario estimates, not forecasts".
2. Parameters that have not been reviewed by an epidemiologist are labelled "Provisional".
3. Every preset and intervention effect shows where its numbers came from.
4. Sample data, estimated movement between districts and placeholder figures are labelled as such.
5. The system holds counts only. It never holds patient names or patient-level records in the simulation and response modules.
6. No claim of validation or accuracy is made until the model has been tested against real outbreak data (see Section 10).

---

# 2. Architecture overview

The system has four layers. A user's role decides what they see and do in every layer.

![System layers](layers.png)

**The feedback loop:** results from Layer 4 routinely send users back to Layer 2 to adjust a scenario and run it again. This loop (configure, simulate, analyse, refine) is the core workflow, not a one-way pipeline.

## What each layer does

**1. User & Access** handles accounts, roles and permissions. Every request starts here.

**2. Configuration Data** defines a scenario before anything runs: the population, the disease, the interventions and (when analysing) the healthcare capacity. It also holds hospital and response data entered by public health officers.

**3. Simulation Engine** runs the stochastic SEIHFR model, the health-worker sub-model and the district-level geographic model.

**4. Analysis & Output** turns raw results into charts, side-by-side comparisons, Rt estimates and reports for different audiences.

## Module list

| # | Module | Layer | Scope in the MVP |
|---|---|---|---|
| 1 | User Registration & Authentication | 1 | Build |
| 2 | Dashboard | 1 | Build (role-based) |
| 14 | User & Access Management (administrator console) | 1 | Build |
| 3 | Population Data Management | 2 | Build |
| 4 | Disease Parameter Configuration | 2 | Build |
| 8 | Intervention Scenarios | 2 | Build |
| 10 | Healthcare Capacity Planning | 2 | Build |
| 17 | Hospital Data & Response Operations | 2 | Build (basic) |
| — | Scenario Builder (connects Modules 3, 4, 8) | 2 | Build |
| 5 | Simulation Engine (orchestration) | 3 | Build |
| 6 | Compartmental Model (stochastic SEIHFR) | 3 | Build |
| 15 | Health-Worker Layer | 3 | Build |
| 9 | Geographic Spread | 3 | Build (district model) |
| 7 | Agent-Based Modelling | 3 | Out of scope |
| 11 | Visualization | 4 | Build |
| 12 | Scenario Analysis & Comparison | 4 | Build |
| 13 | Reporting & Approval | 4 | Build (PDF first) |
| 16 | Rt Tracking | 4 | Build |

---

# 3. Roles and permissions

## The four roles

| Role | Prototype key | Who they are | What they mainly do |
|---|---|---|---|
| **Administrator** | `admin` | Staff who manage the platform | Approve accounts, manage users and hospitals, read audit logs, check system health. Sees only the administrator area by default. |
| **Epidemiologist** | `analyst` | Epidemiologists, researchers, public health analysts | Own the science: manage population data and disease presets, build and run scenarios, compare them, track Rt, run the geographic model, write reports and approve parameter sets and reports. |
| **Public Health Officer** | `officer` | Staff at one hospital or district | Enter daily hospital counts, track beds and supplies, follow response instructions, draft local response plans, run their own scenarios and view reports for their hospital. |
| **Policy Maker** | `policymaker` | Ministry and executive staff | Read-only view: dashboard, approved scenarios, approved reports, intervention review, shared run history. |

## Access by module

Levels: **full** (view and change), **write** (view and add or edit own items), **review** (view and comment or clone), **read** (view only), **self** (own profile only), **none**.

| Area | Administrator | Epidemiologist | Public Health Officer | Policy Maker |
|---|---|---|---|---|
| Dashboard | none | full | full | read |
| Population data | none | write | none | none |
| Disease presets and intervention library | none | full (create and edit custom) | read | read |
| Healthcare capacity | full* | none (can select a profile when analysing) | write (own institution) | read |
| Scenario library | full* | full | full (own scenarios) | review (shared scenarios; may clone) |
| Simulations | none | full | write (own and shared scenarios) | read (run history for shared scenarios) |
| Health-worker layer | none | full | write | none |
| Rt tracking | none | full | write (daily case entry) | none |
| Interventions page | none | full (intervention library and packages) | full (local response plans) | review (intervention review list) |
| Geographic spread | none | full | none | none |
| Hospital tracker | none | none | full | none |
| Response instructions | none | none | write | none |
| Scenario comparison | none | full | none | read (approved scenarios only) |
| Reports | none | full (draft, submit, approve, export) | read (own hospital) | read (approved only) |
| User management | full | none | none | none |

\* Only if an administrator is given access to the main application. By default administrators see the administrator area only.

This table is the prototype's permission matrix (`src/lib/rbac.ts`). The server enforces it; hiding a menu item is never the only protection. Module 14 describes how defaults can be changed and overridden for individual users.

## Navigation by role

- **Epidemiologist:** Dashboard; Data Management (Population Data, Disease Presets, Interventions); Simulations (Scenario Library, Simulations, Health-Worker Layer, Rt Tracking); Response & Analysis (Scenario Comparison, Geographic Spread); Reports.
- **Public Health Officer:** Dashboard; Hospital Data (Rt Tracking, Hospital Tracker); Response (Health-Worker Layer, Interventions, Response Instructions); Data Management (Disease Presets, Intervention Library, Healthcare Capacity); Simulations (Scenario Library, Simulations); Reports.
- **Policy Maker:** Dashboard; Scenario Comparison; Shared Scenarios; Simulation Runs; Interventions; Disease Presets; Intervention Library; Healthcare Capacity; Reports.
- **Administrator:** User Management, Roles and Permissions, Hospitals, Access Requests, Audit Logs, System Health, Announcements, Support Tickets, Settings.

## Open points on roles

- **Public Health Officers building and running scenarios.** The prototype lets officers build and run their own scenarios (the "scenarios: full" and "simulation: write" entries). A stricter option would make them read-only on scenarios. The MVP follows the prototype. See decision D6.
- **Capacity profile selection.** Epidemiologists cannot edit capacity profiles, but they need to pick one when comparing runs or viewing geographic spread. The server must allow read access to profiles for anyone who can analyse. See decision D7.
- **Geographic Spread access.** Only epidemiologists have it. Whether policy makers should get read access is open. See decision D8.

---

# Layer 1 — User & Access

## Module 1 — User Registration & Authentication

**Purpose:** every request into the system starts here. This module handles who a user is, what role they hold and which institution they belong to, which in turn decides what they can see and do across every other layer.

### Frontend components
- Landing page and sign-in entry
- **Request account** form: full name, work email, institution (from a list, or "other" with a free-text name), institution account ID (staff or employee ID), role or position title, password and confirmation. The user does **not** choose a system role; an administrator assigns it on approval
- Request status banner (pending, approved, rejected with reason)
- Login page (email and password)
- Password recovery and reset flow
- Multi-factor authentication step (a mock screen in the MVP)
- Session timeout and profile management
- Login attempt history (administrator-facing)

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/account-requests` | Public. Submit a request for an account (replaces open registration) |
| POST | `/auth/login` | Authenticate with email and password |
| POST | `/auth/mfa/verify` | Confirm an MFA code (mock in the MVP) |
| POST | `/auth/password/forgot` | Request a password reset token |
| POST | `/auth/password/reset` | Set a new password using a valid token |
| POST | `/auth/logout` | Revoke the current session |
| GET | `/users/me` | Profile, role, institution and effective permissions |
| PUT | `/users/me` | Update profile fields |
| GET | `/users/me/sessions` | List active sessions |
| DELETE | `/users/me/sessions/{id}` | Revoke one session |
| GET | `/institutions` | Institutions for the request form |

### Schema

**`institutions`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | e.g. "Rwanda Biomedical Centre" |
| type | enum | ministry, research_institute, university, hospital, district_health_office |

**`users`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| full_name | text | |
| email | text | unique |
| phone | text | nullable |
| institution_id | uuid (FK → institutions) | |
| hospital_id | uuid (FK → hospitals) | required when role is `officer`; scopes their hospital data |
| role | enum | `admin`, `analyst` (Epidemiologist), `officer` (Public Health Officer), `policymaker` (Policy Maker) |
| position_title | text | nullable; the title they gave in the request |
| password_hash | text | argon2 or bcrypt; never store plaintext |
| email_verified_at | timestamp | nullable |
| status | enum | active, inactive, pending |
| last_login_at | timestamp | nullable |
| created_at | timestamp | |

**`account_requests`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name, email | text | as entered |
| institution_id | uuid (FK → institutions) | nullable when "other" is chosen |
| institution_name_other | text | nullable |
| institution_account_id | text | staff or employee ID |
| position_title | text | |
| password_hash | text | the password chosen at request time, hashed, applied when the request is approved |
| status | enum | pending, approved, rejected |
| submitted_at | timestamp | |
| decided_at, decided_by | timestamp, uuid (FK → users) | nullable until decided |
| assigned_role | enum | set by the administrator on approval |
| rejection_reason | text | nullable |
| seen_by_admin | boolean | drives the unread indicator |

**`sessions`**, **`mfa_settings`**, **`login_attempts`** and **`password_reset_tokens`** are unchanged from the earlier design: a revocable session per login with expiry, an optional MFA method per user, a record of every login attempt (including failures against unknown emails), and single-use hashed reset tokens that expire after about an hour.

### Entity relationships

![Module 1 entity relationships](auth_erd.png)

### Design notes
- **The prototype stores the chosen password in plain text inside the request.** That is for demonstration only. The real system hashes it at submission and never stores plaintext.
- **Role and institution drive everything downstream.** Every query is scoped by the logged-in user's role and institution, and for officers by their hospital.
- **Login attempts are logged whatever the outcome**, because audit readiness depends on seeing attack patterns, not only successful logins.
- **MFA is optional per user but can be enforced per role.** In the MVP the MFA screen is a mock.

## Module 2 — Dashboard

**Purpose:** the landing view after login. It is role-aware and built from data other modules already own, plus a notification feed.

### Frontend components
- **Epidemiologist dashboard:** recent scenarios and runs, data quality status of datasets, Rt trend, parameter sets awaiting approval, reports awaiting approval, quick actions
- **Public Health Officer dashboard:** the hospital's bed occupancy, open response instructions, latest daily entry, alerts for the hospital
- **Policy Maker dashboard:** alerts (high, medium, info), approved scenarios, approved reports, headline ranges
- Notification centre with unread count, and a system announcements banner
- Data freshness indicator

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/dashboard` | Role-specific summary payload |
| GET | `/notifications` | The current user's notifications |
| POST | `/notifications/{id}/read` | Mark one read |
| POST | `/notifications/read-all` | Mark all read |
| GET | `/alerts` | Alerts for the current user's role and scope (derived, see below) |

### Schema

**`notifications`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| type | enum | simulation_completed, simulation_failed, report_submitted, report_approved, parameter_set_approved, instruction_received, capacity_gap_flagged, access_request, system_announcement |
| title, body | text | |
| link_url | text | nullable; deep link |
| read_at, created_at | timestamp | |

### Design notes
- **Almost no schema of its own.** Everything shown is read from tables other modules own. Alerts (for example "Isolation beds in a district are almost full") are derived from hospital entries and capacity profiles, not stored.
- **This is not live outbreak monitoring.** The dashboard summarises the user's own activity and the data entered into EpiSim. It does not receive live case data from eIDSR unless that connection is built (Section 8).

## Module 14 — User & Access Management (administrator console)

**Purpose:** the administrator-facing layer over Module 1: who has access, to what, and a record of what happened.

### Frontend components
- **User management:** search and filter by institution, role and status; create or edit a user in a drawer; hospital selection is required for officers; status active, inactive or pending
- **Access requests:** pending queue; approve and assign a role, or reject with a reason
- **Roles and permissions:** a grid of roles against permissions, plus per-user overrides
- **Hospitals:** register and edit hospitals (name, district, isolation beds)
- **Audit logs:** time, user, role, action, target, details
- **System health, announcements, support tickets and settings** pages (simple in the MVP)

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/users` | List and search users |
| POST | `/admin/users` | Create a user |
| PUT | `/admin/users/{id}` | Edit role, institution, hospital or status |
| POST | `/admin/users/bulk-import` | Create users from CSV (same asynchronous pattern as population imports) |
| GET | `/admin/account-requests` | List requests |
| PUT | `/admin/account-requests/{id}` | Approve (with `assigned_role`) or reject (with reason) |
| GET / POST / PUT | `/admin/hospitals`, `/admin/hospitals/{id}` | Manage hospitals |
| GET | `/admin/audit-log` | Query the audit log |
| GET | `/permissions` | All permission keys |
| GET / PUT | `/roles/{role}/permissions` | Read or replace a role's default permissions |
| GET | `/users/{id}/permissions` | Effective permissions, with overrides marked |
| PUT / DELETE | `/users/{id}/permissions/{key}` | Grant, revoke or remove an override |
| GET | `/admin/system-health` | Service status and recent run counts |
| GET / POST | `/admin/announcements` | Manage announcements |
| GET / POST | `/admin/support-tickets` | Manage support tickets |

### Schema

**`hospitals`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | e.g. "Gisenyi District Hospital" |
| district_code | text (FK → districts) | |
| isolation_beds | int | beds available for isolation and treatment |
| registered_on | date | |

**`audit_log`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| occurred_at | timestamp | |
| user_id | uuid (FK → users) | |
| role | text | role at the time |
| action | enum | parameter_change, parameter_set_approved, report_submitted, report_approved, report_published, simulation_run, user_created, user_updated, account_status_changed, hospital_registered, hospital_updated, sign_in |
| target | text | what was affected |
| details | text | |

**`permissions`**, **`role_permissions`** and **`user_permissions`** work as in the earlier design: a fixed catalogue of permission keys (for example `edit_builtin_presets`, `manage_users`, `view_all_scenarios`, `manage_all_scenarios`, `approve_reports`, `approve_parameter_sets`), a default grant per role, and per-user overrides that can grant or revoke a permission. A check starts from the role's defaults and then applies the user's override. The seed reproduces the prototype's permission matrix exactly.

**`announcements`** (title, body, audience, published_at, created_by) and **`support_tickets`** (subject, description, status, raised_by, created_at) are proposed minimal tables; their screens exist in the prototype but their fields are not final.

### Design notes
- **Roles are assigned by an administrator, not chosen by the user.** Account requests carry a position title for context only.
- **Changes to roles and status are always audited.** Direct administrator edits are allowed and recorded in the audit log.
- **Parameter changes and approvals are audited** because they affect every scenario that uses them.

---

# Layer 2 — Configuration Data

This layer covers Module 3 (Population Data), Module 4 (Disease Parameters), Module 8 (Interventions), Module 10 (Healthcare Capacity), the Scenario Builder and Module 17 (Hospital Data and Response Operations). The first four follow one pattern: a reusable library with browse, create and edit screens, a CRUD API and its own tables. A **Scenario** then references one item from each of the first three libraries.

## Architecture overview

![Layer 2 architecture diagram](architecture.png)

**Key design point:** a scenario stores references, not copies. This keeps scenarios cheap to create, lets each library be reused across many scenarios and makes two scenarios easy to compare by looking at their references. **Healthcare capacity is not part of a scenario.** It is chosen when results are analysed (Modules 11, 12 and 9), so the same bed numbers can be applied to every compared run.

## Reference data: districts

All geographic features rest on one reference table of Rwanda's 30 districts.

**`districts`**

| Field | Type | Notes |
|---|---|---|
| code | text (PK) | NISR-style hierarchical code, province digit first (for example 12 for Gasabo) |
| name | text | e.g. "Gasabo" |
| province | enum | kigali, northern, southern, eastern, western |
| centroid_lat, centroid_lng | float | label position |
| boundary_geojson | json | real district boundary |

Boundaries come from the open geoBoundaries dataset (RWA, level ADM2), understood to be licensed CC BY 4.0 (to be confirmed on the geoBoundaries site), and must be credited wherever a map is shown. The file holds exactly 30 districts.

## Module 3 — Population Data Management

**Purpose:** defines who is being simulated: the demographic and geographic facts about a population.

> **Real-world source check:** NISR publishes the Rwanda Population and Housing Census (RPHC5, 2022) as public-use microdata: a 10% anonymised sample (1,313,015 person records, 250 variables) documented in a DDI codebook. It is row-per-person microdata, not pre-aggregated counts, and geographic areas use hierarchical numeric codes (province 1 to 5; district as a 2-digit code that embeds the province digit; sector as a 4-digit code that embeds province and district). This means real source data needs a raw individual-level landing table, and region fields should follow the same code convention.

### Frontend components
- Dataset browser (filter by region, year, source), showing version, population, coverage and last import
- **Import wizard in four steps:** Upload, Details (name, province, district, sector, year, source), Check (validation), Review
- Format detection (individual-level microdata or pre-aggregated counts) and column mapping, with recognised column names suggested automatically
- Validation panel with counts of valid, warning and error rows, a preview and a downloadable error report
- Import status panel (queued, running, completed, failed)
- Version history and a count of scenarios using each dataset
- Map preview (density and boundaries)

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/population-datasets` | List and search |
| GET | `/population-datasets/{id}` | Detail and summary statistics |
| GET | `/population-datasets/{id}/versions` | Version history |
| POST | `/population-imports/preview` | Upload a file; return detected format, columns, sample rows and a suggested mapping |
| POST | `/population-imports/validate` | Validate with a mapping; return the validation summary and flagged rows |
| POST | `/population-imports` | Start the import as a background job |
| GET | `/population-imports/{id}` | Job status |
| POST | `/population-datasets/{id}/aggregate` | (Re)compute `population_records` from microdata |

### Schema

Population storage has two tiers, mirroring how real census sources are structured.

**`population_datasets`**: one row per dataset version

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | e.g. "Rwanda RPHC5 2022" |
| region_code | text | hierarchical NISR-style code |
| coverage | text | e.g. "Rwanda, all 30 districts" |
| year | int | |
| source | text | e.g. "NISR Census (10% sample)" |
| granularity | enum | microdata, aggregate |
| version | int | increments on re-import |
| total_population | bigint | |
| status | enum | draft, validated, archived |
| is_sample | boolean | true for seeded demonstration data |
| created_by, created_at | uuid, timestamp | |

**`population_microdata`**: raw row-per-person data close to the source (household_id, person_id, province_code, district_code, sector_code, area_type, sex, age 0 to 122, relationship_to_head, marital_status). Reserved for future individual-level modelling (Module 7). Not needed by the SEIHFR model.

**`population_records`**: the aggregate the model reads (dataset_id, district_code, age_band, population_count, density_per_km2, urban_rural). Computed from microdata, or imported directly when only aggregates exist.

### Validation rules at import
Rows are checked for: age out of range, invalid region code, missing required value and unrecognised value. Errors block a row; warnings do not. The wizard reports how many rows were checked (a large file may be checked in part) and lets the user download the flagged rows.

### Design notes
- **District totals in the MVP seed are approximate and illustrative.** They must be replaced by an NISR import before any real use.
- **The SEIHFR model needs only totals.** It reads `population_records`, aggregated to the district level for the geographic model.

## Module 4 — Disease Parameter Configuration

**Purpose:** defines how a specific pathogen behaves, independent of any population. Presets are the home of the evidence: each shows its source, and each value that has not been reviewed is marked provisional.

### Frontend components
- Preset library with filter (all, built-in, custom)
- Detail view and editing form with inline validation
- **Clone as custom:** built-in presets are read-only and are changed by cloning
- Source and reference field, provisional flag, last updated
- Approval status of the parameter set (epidemiologist approval)
- Notifications for save, clone and error states

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/disease-presets` | List presets |
| GET | `/disease-presets/{id}` | Detail |
| POST | `/disease-presets` | Create a custom preset |
| PUT | `/disease-presets/{id}` | Edit (custom only, unless the user holds `edit_builtin_presets`) |
| POST | `/disease-presets/{id}/clone` | Clone any preset into an editable custom copy |
| POST | `/disease-presets/{id}/approve` | Approve the current values (epidemiologist) |

### Schema

**`disease_presets`**: structured for the SEIHFR model. All times are in days; rates and shares are between 0 and 1.

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| key | text | unique, e.g. `ebola_zaire` |
| name, virus, description | text | e.g. "Ebola", "Zaire ebolavirus" |
| r0_low, r0_likely, r0_high | float | reproduction number range with a most likely value |
| overdispersion_k | float | small values mean a few people cause most infections |
| incubation_days | float | time from infection to symptoms |
| onset_to_admission_days | float | |
| onset_to_death_days | float | |
| onset_to_recovery_days | float | |
| cfr_community | float | fatality among cases not admitted |
| cfr_hospital | float | fatality among admitted cases |
| share_hospitalised | float | share of cases that reach a facility |
| burial_delay_days | float | how long a body stays infectious before burial |
| hcw_risk | float | expected health-worker infections per hospitalised patient-day with no protection |
| serial_interval_mean, serial_interval_sd | float | used by Rt estimation (Module 16) |
| route_share_community, route_share_hospital, route_share_funeral | float | share of R0 carried by each route; default 0.55, 0.15, 0.30; must sum to 1 |
| baseline_safe_burial, baseline_contact_tracing, baseline_isolation | float | the "current response" levers used when no intervention package is attached |
| provisional | boolean | true until reviewed by an epidemiologist |
| reference | text | citation or note on where the values come from |
| is_builtin | boolean | |
| cloned_from_id | uuid (FK → disease_presets) | nullable |
| approved_by, approved_on, version | uuid, date, int | approval status of this version |
| created_by, created_at, updated_at | | |

The two built-in presets (Ebola and Marburg) and their values are listed in Appendix A.

### Design notes
- **Built-in presets stay stable.** Scenarios reference presets by id; an edit to a built-in would silently change every scenario using it. Editing is therefore done on a clone, and editing a built-in needs the `edit_builtin_presets` permission.
- **Provisional means unreviewed.** The Marburg preset in the prototype is flagged provisional. Several of its values are borrowed or estimated because few outbreaks have published data.
- **Route shares and baseline levers are proposed preset fields.** In the prototype they are fixed constants in the engine (route shares 0.55, 0.15 and 0.30; baseline safe burial 0.5, contact tracing 0.4 and isolation 0.5). Moving them onto the preset makes them visible, reviewable and changeable. Their values are placeholders until an epidemiologist reviews them.
- **Adding a disease means adding a preset**, as long as it fits the SEIHFR structure. A disease with a different structure needs a new model type (Module 5).

## Module 8 — Intervention Scenarios

**Purpose:** defines what actions change the disease's baseline behaviour, and when.

> **Design note:** intervention type is a reference table, not an enum. The table gives each type a default effect size and a source, the same way presets carry sources, and a new type can be added as a data row rather than a code change.

### Frontend components
- Intervention library with type list, filter (all, built-in, custom) and a panel to view or clone a type
- Type editor: name, key, mechanism, default effect, source
- **Package builder:** stack several intervention items into one named package, each with start day, end day (or "ongoing"), coverage and an optional custom effect that overrides the type's default
- Package list with a visual timeline of when each item is active
- Discard confirmation for unsaved changes
- A review screen for policy makers (Module 13 describes the recommendation status)

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/intervention-types` | List types |
| POST | `/intervention-types` | Create a custom type |
| PUT | `/intervention-types/{id}` | Edit (custom only, or with elevated permission) |
| POST | `/intervention-types/{id}/clone` | Clone into an editable copy |
| GET | `/intervention-packages` | List packages |
| GET | `/intervention-packages/{id}` | Detail with items and resolved types |
| POST | `/intervention-packages` | Create |
| PUT | `/intervention-packages/{id}` | Edit name, description and items |
| DELETE | `/intervention-packages/{id}` | Delete (only if no scenario uses it) |

### Schema

**`intervention_types`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| key | text | unique, e.g. `contact_tracing` |
| name, description | text | |
| effect_mechanism | enum | `rate_multiplier` (reduces transmission while active) or `compartment_shift` (moves people from Susceptible to Removed, as vaccination does) |
| engine_lever | enum | which part of the model it acts on (see the table below) |
| default_effect_size | float | 0 to 1; effect at full coverage |
| source_citation | text | the seeded values are placeholders until backed by literature |
| is_placeholder | boolean | true for seeded values not yet sourced |
| is_builtin | boolean | |
| created_by, created_at | | |

**`intervention_packages`** (id, name, description, created_by, created_at, updated_at) and **`intervention_items`** (id, package_id, type_id, start_day, end_day nullable for "ongoing", coverage 0 to 1, effectiveness_override nullable).

**How an item's effect is resolved:** `effect = coverage × (effectiveness_override ?? default_effect_size)`. The override lives on the item, so adjusting one package does not change the default for every other package.

### Built-in types and the model levers they act on

| Type | Mechanism | Engine lever | In the stochastic engine today? |
|---|---|---|---|
| Contact tracing | rate | Contact tracing: reduces community transmission | Yes (as a constant) |
| Case isolation | rate | Isolation: reduces spread through the hospital route | Yes (as a constant) |
| Safe and dignified burials | rate | Safe burial: share of deaths buried safely, which removes funeral transmission | Yes (as a constant) |
| Testing | rate | Detection delay: shortens the time from onset to isolation | Yes (as a constant) |
| Masking | rate | Scales community and hospital transmission | To add |
| Lockdown | rate | Scales community transmission | To add |
| Vaccination | shift | Moves susceptible people to Removed over its active window | To add |

Health-worker protection (use of protective equipment) is configured in the Health-Worker Layer (Module 15), not as an intervention type.

### Design notes
- **Interventions modify the baseline; they do not replace the disease.** Each active item adjusts the model's levers during its window.
- **Combining with the baseline response (proposed rule).** A lever is the current-response baseline raised by the interventions active that day: `effective = baseline + (1 − baseline) × coverage × effect`, capped at 1. Several items on the same lever combine multiplicatively on the remaining gap. This rule is a proposal and needs epidemiologist review.
- **Time windows are required.** The prototype's stochastic engine holds each lever constant over the run. The MVP engine must apply levers day by day inside each item's start and end days (Module 6).
- **All effect sizes are placeholders** until an evidence review replaces them. Each type's source field says so.

## Module 10 — Healthcare Capacity Planning

**Purpose:** defines what resources exist, so results can be checked against real limits. Capacity is a check on results, not an input to the transmission model.

### Frontend components
- Capacity profile list and editor (inline validation), grouped by institution
- Institution selector (region, district hospital catchment, referral hospital)
- Source note and last-updated information, with a placeholder flag on sample data
- Saved comparisons checked against a profile, with capacity warnings

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/capacity-profiles` | List profiles the user can read |
| GET | `/capacity-profiles/{id}` | Detail, including per-district beds |
| POST | `/capacity-profiles` | Create |
| PUT | `/capacity-profiles/{id}` | Update |

### Schema

**`capacity_profiles`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | e.g. "Kigali Region — 2026" |
| institution_id | uuid (FK → institutions) | region, hospital catchment or referral hospital |
| institution_kind | enum | region, district_hospital_catchment, referral_hospital |
| hospital_beds | int | all beds |
| isolation_beds | int | beds usable for isolation and treatment of the disease; the number results are checked against |
| icu_beds, ventilators, healthcare_workers, daily_testing_capacity | int | |
| vaccine_doses | int | nullable; not applicable if no vaccine is used |
| source_note | text | where the numbers come from |
| is_placeholder | boolean | true for sample data |
| updated_by, updated_at | | |

**`capacity_profile_districts`**: optional per-district isolation beds (profile_id, district_code, isolation_beds), used by the geographic model. If a profile has no district rows, the geographic view splits the profile's isolation beds across districts in proportion to population and says so.

### Design notes
- **Capacity is chosen at analysis time.** Scenario Comparison and Geographic Spread each have a capacity profile selector. One selection applies to every run shown, so results are comparable.
- **Only bed demand is modelled directly.** The model produces hospitalised patients per day. Demand for ICU beds, ventilators and staff is derived from assumed ratios, shown on screen as indicative.
- **Who edits what.** Public health officers edit profiles for their own institution and administrators may edit any. Epidemiologists and policy makers can read and select profiles but not edit them (decision D7).
- **All seeded numbers are placeholders**, not official figures.

## The Scenario Builder

**Purpose:** bundles one population dataset, one disease preset and an optional intervention package into one reusable object the engine can run. It sits alongside Modules 3, 4 and 8 and is the handoff point where Layer 2 ends and Layer 3 begins. Pressing "Run" is a separate action handled by Module 5.

### Frontend components
- **Builder wizard in four steps:** dataset, disease, intervention package (optional), name and review. A summary panel stays visible beside the steps
- **Scenario library** with tabs "My scenarios" and "Shared with me"; open, clone, share and delete (with confirmation)
- **Drafts:** a scenario can be saved as a draft and finished later; only completed scenarios can be run
- **Share dialog:** share with a colleague or a whole institution, as *view* only or *clone*
- **Run simulation** shortcut that opens the Simulations page with the scenario selected

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/scenarios` | Scenarios the user owns, plus those shared with them or their institution |
| GET | `/scenarios/{id}` | Full scenario with its resolved references |
| POST | `/scenarios` | Create (or save as draft) |
| PUT | `/scenarios/{id}` | Edit a draft only |
| POST | `/scenarios/{id}/clone` | Clone into a new editable draft |
| DELETE | `/scenarios/{id}` | Delete (owner only; blocked if completed runs exist unless archived) |
| POST | `/scenarios/{id}/shares` | Share with a user or institution, at `view` or `clone` |
| GET | `/scenarios/{id}/shares` | List shares |
| DELETE | `/scenarios/{id}/shares/{share_id}` | Revoke a share |

### Schema

**`scenarios`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name, description | text | |
| population_dataset_id | uuid (FK) | required |
| population_dataset_version | int | pinned automatically when the scenario is saved |
| disease_preset_id | uuid (FK) | required |
| disease_preset_version | int | pinned when saved |
| intervention_package_id | uuid (FK) | nullable (no interventions is valid) |
| capacity_profile_id | uuid (FK) | nullable; only a suggested default for analysis screens |
| model_type | enum | `seihfr`, `seihfr_geo`; `agent_based` is reserved and rejected |
| is_draft | boolean | |
| visibility | enum | private, institution |
| created_by, created_at | | |

**`scenario_shares`** (id, scenario_id, shared_with_user_id or shared_with_institution_id with exactly one set, permission `view` or `clone`, shared_by, created_at).

### Validation rules
- The dataset and disease preset are required; the package is optional
- `model_type` accepts only `seihfr` and `seihfr_geo`. A request for `agent_based` is rejected with a clear message ("Agent-based models are not available in this version")
- The pinned dataset and preset versions are set by the server, never supplied by the client
- A share sets exactly one of user or institution
- Only the owner, or a user with `manage_all_scenarios`, can share or delete

### Design notes
- **Version pinning.** A scenario records the dataset and preset versions it was built with, so re-running it later does not silently use newer data or parameters.
- **A scenario describes; a run executes.** Run length and initial cases belong to the run request, so one scenario can be re-run at different lengths without cloning.
- **Sharing at "clone" lets the recipient copy** the scenario into their own draft. Nobody edits another user's saved scenario.
- **Visibility order for `GET /scenarios`:** the user's own scenarios; then scenarios shared with them or their institution; then scenarios with institution visibility. Administrators with `view_all_scenarios` see everything.

### Entity relationships

![Layer 2 entity relationship diagram](erd.png)

*The diagram shows the table structure. It does not show the newer fields described above (`disease_presets` SEIHFR fields, `isolation_beds`, `disease_preset_version`, the `districts` table) and should be regenerated.*

## Module 17 — Hospital Data & Response Operations

**Purpose:** lets a public health officer record what is happening at their hospital and act on instructions during a response. It is the only place in the system where day-to-day operational data is entered. It stores **counts only, never patient details.**

### Frontend components
- **Hospital Tracker:** daily entry form and bed occupancy chart for the officer's hospital
- **Response Instructions:** a list of actions received, each with a target, deadline, sender and status (not started, in progress, done, can't do). A reason is required for "can't do"
- **Local Response Plans:** draft or active plans with a title, disease, start and review dates, a list of actions with targets, and notes
- **Hospital reports:** weekly situation reports, scenario briefs and capacity reviews for the hospital (Module 13)

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET / POST | `/hospital-entries` | List or add daily entries for the officer's hospital |
| PUT | `/hospital-entries/{id}` | Correct an entry |
| GET | `/response-instructions` | Instructions addressed to the officer's hospital |
| PUT | `/response-instructions/{id}/status` | Update status (with a reason for "can't do") |
| POST | `/response-instructions` | Issue an instruction to one or more hospitals |
| GET / POST / PUT | `/response-plans`, `/response-plans/{id}` | Manage local response plans |

### Schema

**`hospital_entries`**: one row per hospital, disease and date

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| hospital_id | uuid (FK → hospitals) | |
| entry_date | date | |
| disease_key | text | the disease the counts refer to |
| suspected, confirmed, in_isolation, recovered, deaths | int | counts |
| hcw_infected | int | health-worker infections |
| beds_total, beds_occupied | int | isolation beds for the whole hospital |
| ppe_stock | enum | good, low, critical |
| trained_staff | int | |
| burial_team_ready | boolean | |
| contacts_in_follow_up | int | |
| entered_by, created_at | | |

**`response_instructions`** (id, action, target, deadline, issued_by, disease_key, received_at) with **`instruction_targets`** (instruction_id, hospital_id, status, reason, updated_at). **`response_plans`** (id, hospital_id, title, disease_key, status draft or active, start_date, review_date, notes, updated_at) with **`plan_actions`** (plan_id, name, target).

### Design notes
- **Counts only.** Patient-level data is deliberately out of scope for privacy and to keep approval for use simple.
- **Officers see their own hospital only.** Every query is scoped by `users.hospital_id`.
- **Daily entries feed other modules.** New cases feed Rt Tracking (Module 16), bed numbers feed alerts on the dashboards, and health-worker infections feed Module 15.
- **Who issues instructions is not finalised.** The prototype shows instructions arriving at the officer but not who writes them. The proposal is that epidemiologists and administrators can issue them (decision D9).
- **This data is entered by hand in the MVP.** Connecting it to eIDSR or hospital systems is a future step (Section 8).

---

# Cross-cutting note: how Layer 1 and Layer 2 connect

Every Layer 2 table with a `created_by` field points at Layer 1's `users`, and capacity profiles, scenarios and hospital data tie back to `institutions` and `hospitals`. Layer 1 must therefore be built first, or at least seeded, before Layer 2's create and edit screens can be tested end to end.

---

# Layer 3 — Simulation Engine

This layer covers Module 5 (Simulation Engine orchestration), Module 6 (stochastic SEIHFR model), Module 15 (Health-Worker Layer) and Module 9 (Geographic Spread). Module 7 (Agent-Based Modelling) is documented for completeness and is not built. The layer takes a scenario from Layer 2 and runs it.

## How this layer connects to Layer 2

A scenario describes a simulation but does not carry everything needed to run one. Two things happen at the boundary.

**1. The run request adds what the scenario does not carry.**

```
POST /simulations
{
  "scenario_id": "...",
  "time_horizon_days": 90,      // 1 to 365; the screen offers 30, 60, 90 and 180
  "initial_cases": 3,
  "monte_carlo_runs": 200,      // optional; default 200
  "seed": 2026,                 // optional; default set by the server and stored
  "seed_district_code": "...",  // required for model_type seihfr_geo
  "hcw": { "pool": 600, "ppe_before": 0.3, "ppe_after": 0.85, "recognition_day": 14 }  // optional
}
```

**2. A resolver turns references into runnable objects.** It:
- reads the population at the dataset version pinned in the scenario (district totals for the geographic model);
- loads the disease preset at its pinned version and builds the disease profile (Module 4);
- loads the intervention package and turns each item into a time window on a model lever, using `effect = coverage × (override ?? default)` and the combination rule in Module 8;
- does **not** read the capacity profile. Capacity is applied when results are analysed.

Everything the resolver produced is stored as a **snapshot** on the run, so a run can always be reproduced exactly.

## Module 5 — Simulation Engine (orchestration)

**Purpose:** accepts a run request, resolves it, sends it to the right model, and tracks progress. It is the layer's entry point, not a model.

### Frontend components
- **Run tab:** pick a scenario (the scenario library can pre-fill it), set the time horizon and initial cases, see a summary of what will run and the model information, then start
- Progress view with status (queued, running, completed, failed, cancelled), a progress bar and a cancel action
- A plain-language failure message with advice (for example check the dataset on Population Data and try again)
- **History tab:** past runs with status, duration, who ran them, key figures and a link to results
- Summary tiles for a completed run (peak infectious, peak day, deaths, recovered) with ranges
- Buttons to open the run in Scenario Comparison or in a report

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/simulations` | Submit a run. Returns immediately with the run in `queued` state |
| GET | `/simulations` | List the user's runs (and those on scenarios shared with them) |
| GET | `/simulations/{id}` | Status, progress and metadata |
| GET | `/simulations/{id}/results` | Summary results once completed |
| GET | `/simulations/{id}/results/series` | Daily bands for charts (Module 11) |
| POST | `/simulations/{id}/cancel` | Cancel a run that is queued or running |

### Schema

**`simulation_runs`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | with a readable code such as `RUN-0142` |
| scenario_id | uuid (FK → scenarios) | |
| model_type | enum | `seihfr`, `seihfr_geo` |
| time_horizon_days | int | |
| initial_cases | int | |
| monte_carlo_runs | int | |
| seed | int | the random seed used; makes the run reproducible |
| seed_district_code | text | nullable; required for `seihfr_geo` |
| engine_version | text | version of the model code that produced the result |
| inputs_snapshot | json | resolved population, disease profile, lever windows and health-worker settings |
| status | enum | queued, running, completed, failed, cancelled |
| progress | float | 0 to 1 |
| requested_by | uuid (FK → users) | |
| queued_at, started_at, completed_at | timestamp | |
| duration_sec | int | nullable |
| error_message | text | nullable |

### Design notes
- **Asynchronous by design.** `POST /simulations` returns at once; a background worker executes the model and the client polls for status. The same pattern is used for imports and report generation.
- **Model dispatch.** The worker reads `model_type` and calls the matching model. Adding a model is a new dispatch target, not a schema change.
- **Cancel only.** Pause and resume are out of scope; a run takes seconds to a minute, so cancelling covers the need.
- **Reproducibility.** The seed, engine version and input snapshot are stored with every run. Re-running with the same snapshot gives the same output.

## Module 6 — Compartmental Model (stochastic SEIHFR)

**Purpose:** the epidemiological model. It follows the structure of the Legrand and colleagues Ebola model, which separates spread in the community, in hospital and at funerals. The values in this module come from the prototype's engine and are **provisional until reviewed by an epidemiologist.**

### Compartments

| Letter | Compartment | Meaning |
|---|---|---|
| S | Susceptible | Can catch the disease |
| E | Exposed | Infected, not yet sick or infectious (incubation) |
| I | Infectious (community) | Sick and not yet admitted |
| H | Hospitalised | Admitted to a facility. Can still infect staff and others if infection control is weak |
| F | Funeral | Died, not yet buried. Bodies remain highly infectious |
| R | Removed | Recovered, or safely buried |

### How people move
S → E → I. From I a person is admitted (→ H), dies at home (→ F if buried unsafely, otherwise → R) or recovers (→ R). From H they recover (→ R) or die (→ F if unsafely buried, otherwise → R). From F they move to R once buried. Hospital staff form a separate pool tracked by Module 15.

### Three transmission routes
New exposures come from three sources, with transmission rates derived from R0 and the share of R0 carried by each route (default 55% community, 15% hospital, 30% funeral):

- **Community:** `beta_I = R0 × share_community ÷ onset_to_admission × (1 − 0.6 × contact_tracing)`
- **Hospital:** `beta_H = R0 × share_hospital ÷ (share_hospitalised × hospital_stay) × (1 − 0.8 × isolation)`
- **Funeral:** `beta_F = R0 × share_funeral ÷ (unsafe_deaths_per_case × burial_delay)`

where `hospital_stay` is derived from the preset's hospital fatality, onset-to-death and onset-to-recovery times, and `unsafe_deaths_per_case` is the expected number of deaths per case that end in an unsafe burial. The rates are fixed by the preset's baseline timings. The **detection delay** lever then sets how long cases actually remain in the community, so shortening it reduces infections without changing `beta_I`. The constants 0.6 and 0.8 (how strongly contact tracing and isolation cut transmission) and 0.3 (how much less likely a hospital death than a community death is to lead to an unsafe burial) are placeholders and are the first things an epidemiologist should check.

### Daily steps (every transition is a random draw)
1. **Exposures:** pressure = `beta_I × I + beta_H × H + beta_F × F`. While fewer than 20 cumulative cases have occurred, new infections are drawn from a **negative binomial** (overdispersed) process, so chance decides whether the outbreak dies out or takes off. After that, they are drawn from a binomial based on the susceptible share of the population.
2. **Health-worker infections** from Module 15.
3. **Progression:** exposed people become sick (rate 1 ÷ incubation); sick people leave the community (rate 1 ÷ detection delay), and of those a share are admitted; the rest die or recover; hospitalised patients leave (rate 1 ÷ hospital stay) and die with the hospital fatality rate; unsafe burials feed F; bodies are buried at rate 1 ÷ burial delay.

### Interventions in the model
The model has these levers: detection delay (time from onset to isolation), contact tracing, isolation, safe burial, isolation beds and health-worker protection. Interventions from Module 8 move the levers during their active days; with no package, the preset's baseline response is used. **To build in the MVP:** day-by-day lever values inside each item's window, plus levers for masking, lockdown and vaccination, which the prototype's stochastic engine does not yet have.

### Run settings (defaults from the prototype)
Population (from the dataset), initial cases (3 for Ebola, 2 for Marburg), 180 days, 200 Monte Carlo runs, seed 2026, isolation beds 40 (replaced by the capacity profile at analysis), health-worker pool 600.

### Outputs
**Per Monte Carlo run, per day:** active cases (I + H), hospitalised, bodies awaiting burial, cumulative cases, cumulative deaths, cumulative health-worker infections, cumulative community infections. **Per run:** final cases, final deaths, health-worker infections, total infections, peak hospitalised.

**Across runs (stored in the result):**
- Daily bands: 5th, 50th (median) and 95th percentile of each series
- Chance it takes off: share of runs reaching at least 20 cases; also the share above 50 and above 100
- Chance beds run out: share of runs whose peak hospitalised exceeds the available beds (computed at analysis time, so it is derived from the stored per-run peaks)
- Summaries (5th, median, 95th) of final cases, final deaths and peak beds
- Health-worker share of infections (5th, median, 95th), computed over runs with at least 10 infections

### Schema

**`simulation_results`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| simulation_run_id | uuid (FK → simulation_runs, unique) | |
| p_take_off, p_over_50, p_over_100 | float | |
| final_cases_low, final_cases_median, final_cases_high | float | |
| final_deaths_low, final_deaths_median, final_deaths_high | float | |
| peak_beds_low, peak_beds_median, peak_beds_high | float | |
| hcw_share_low, hcw_share_median, hcw_share_high | float | |
| peak_infectious_median, peak_day_median | float, int | summary tiles |
| run_peaks | json | per-run peak hospitalised, kept so the "chance beds run out" can be recomputed for any capacity profile |
| series_ref | text | where the daily bands are stored (a JSON file or column in the MVP; object storage later) |

### Design notes
- **Summaries live in the row; the daily series is stored apart.** Comparison only needs the summaries, and the chart reads the series when a user opens it.
- **One engine.** The prototype has a second, simpler deterministic SEIHFR used for summary tiles. It is replaced by this engine (decision D1) so tiles, charts and comparisons always agree.
- **Stochastic output is shown as ranges.** A single run is one possible course. The median and the 5 to 95% band summarise many.
- **Engine requirements for the build:** vectorised across Monte Carlo runs (200 runs over 180 days should finish in seconds), seeded random numbers, tests for conservation of population, no outbreak when R0 is zero, identical output for identical seed and stronger interventions never raising expected cases.
- **Calibration and back-testing** are described in Section 10. They are not yet done.

## Module 15 — Health-Worker Layer

**Purpose:** shows how many health workers get infected by the patients they care for, and how much protective equipment and early recognition of the outbreak reduce this. It is a small sub-model attached to the hospitalised compartment, **not** an agent-based model.

### Frontend components
- Settings: number of health workers in the area, protection before and after the outbreak is recognised, and the day it is recognised
- Comparison of health-worker infections with and without early protection
- Staff-risk chart (cumulative health-worker infections with a range) and share of all infections that are health workers
- Notes: results are scenario estimates, and the health-worker share depends on the disease preset

### How it works
Each day, every susceptible health worker has a small risk of infection: `hcw_risk × (1 − protection) × hospitalised patients ÷ staff pool`, where protection is the "before" value until the recognition day and the "after" value afterwards. The number infected is drawn at random from the staff still susceptible.

### API endpoints
The settings travel with the run request (`hcw` object in Module 5). Results come back with the other results:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/simulations/{id}/results/health-workers` | Health-worker bands and share |

### Schema
No new tables. The settings are stored in `simulation_runs.inputs_snapshot` and the results in `simulation_results` and the series file. Defaults per disease are in the preset (`hcw_risk`) and in the run form (protection before: 30% Ebola, 20% Marburg; after: 85%; recognition day: 14 Ebola, 21 Marburg; pool 600). All defaults are placeholders.

### Design notes
- **Why it exists:** in the 2024 Rwanda Marburg outbreak, health workers made up a large share of cases, according to the figures recorded in the Marburg preset reference. Those figures must be confirmed against the primary source before being quoted outside the team.
- **Staff pool is a single number** for the area modelled. Individual staff and departments are not represented.

## Module 9 — Geographic Spread

**Purpose:** shows where an outbreak is likely to go and when hospitals in each district will run short of beds. It answers one question: *which districts will be hit first and hardest, and where will beds run out?*

> **Scope:** in the MVP this is a district-level model for Rwanda's 30 districts. Sector-level detail, transport networks and real mobility data are future work.

### How the model works
- **Metapopulation:** each of the 30 districts runs its own SEIHFR dynamics using its own population.
- **Coupling:** a daily movement matrix lets infectious people in one district add to the infection pressure in another, in proportion to how much people travel between the two.
- **Movement is estimated.** With no mobility data, flows use a **gravity model** (trips between two districts grow with their populations and fall with distance). It is always labelled "estimated". Real data, if obtained, replaces it.
- **Seeding:** the outbreak starts in one chosen district with a set number of cases.
- **Border risk:** for each of DRC, Uganda, Burundi and Tanzania, an importation risk (High, Medium or Low) is shown. In the MVP this is a configurable assumption, not a calculation from data.
- **Capacity is applied at analysis time.** The user chooses a capacity profile; each district's bed demand is compared with its beds (from the profile's district rows, or population-proportional if absent).
- **What-if:** "start response on day X in this district" re-runs the model with response levers active from day X in that district only. Spread to neighbours still follows the movement matrix. In the MVP the what-if uses fewer Monte Carlo runs and is labelled a preview.

### Frontend components
- **Run and capacity selectors** in the header (completed geographic runs only; capacity profile). Export menu (map image, district table CSV)
- **Map of the 30 districts using the real boundary file**, drawn as a choropleth, with a **Cases / Beds vs capacity** toggle. A fixed colour scale is used for the whole run so days can be compared. In the beds view, districts are green below 70% of beds, amber 70 to 100% and red above 100%
- **Timeline** with play and a day slider ("Day 34 of 120")
- **Districts to watch:** top five, sorted by first case day, with columns District, First case, Cases and Beds (a "short from day N" tag where beds run out). There are no High, Medium or Low labels on districts, because they need a defined rule
- **Selected district card:** province, projected cases with a 5 to 95% range, peak day with range, peak bed demand, beds available, a status line ("Beds run out from day 34" or "Within capacity"), and the **what-if control** with a before-and-after result line
- **Optional movement lines** between the ten strongest links, off by default
- **Border chips** around the map on their true sides, each with an importation risk label
- Attribution line for the boundary data, and an "Illustrative data" badge while sample data is shown

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/geographic/districts` | The 30 district boundaries and label positions |
| GET | `/simulations/{id}/geographic` | Per-district results for a completed run; takes `capacity_profile_id` |
| POST | `/simulations/{id}/geographic/what-if` | `{ district_code, response_start_day, package_id? }`; returns before-and-after for that district |
| GET | `/geographic/movement` | Movement links and the method used |
| GET / PUT | `/geographic/border-risks` | Read or edit the border risk assumptions (epidemiologist) |

### Schema

**`simulation_district_results`**: one row per run and district, with series stored apart

| Field | Type | Notes |
|---|---|---|
| simulation_run_id | uuid (FK) | |
| district_code | text (FK → districts) | |
| p_reached | float | share of Monte Carlo runs in which the district gets at least one case |
| first_case_day_low, first_case_day_median, first_case_day_high | int | nullable if never reached |
| total_cases_low, total_cases_median, total_cases_high | float | |
| peak_day_low, peak_day_median, peak_day_high | int | |
| peak_hospitalised_low, peak_hospitalised_median, peak_hospitalised_high | float | |
| series_ref | text | daily cumulative cases and hospitalised per district |

**`movement_flows`** (origin_district, destination_district, trips_per_day, method: gravity, mobility_data or manual, updated_at) and **`border_risks`** (country, risk, note, updated_by, updated_at).

### Design notes
- **First case day is a distribution, not a date.** Spread timing depends on the movement assumption and on chance. The page shows the median and tells the user that.
- **Estimated movement is the largest uncertainty.** Changing the movement assumption moves arrival times more than most other settings. The page says so next to the movement toggle.
- **Honest scope.** The prototype's Geographic page draws bell-shaped curves per district from fixed numbers. They illustrate the screen and are not model output; they are replaced by this model.

## Module 7 — Agent-Based Modelling

> **Not implemented.** Documented for forward compatibility only.

It would represent individual people and an explicit contact network (households, schools, workplaces). It needs individual-level population data at a depth not yet available. `population_microdata` is kept in its row-per-person form for this purpose. Adding it later means a new `model_type` and a validation rule requiring microdata, not a redesign.

---

# Layer 4 — Analysis & Output

This layer covers Module 11 (Visualization), Module 12 (Scenario Analysis & Comparison), Module 13 (Reporting & Approval) and Module 16 (Rt Tracking). It turns what Layer 3 computed into something a person can read, compare and hand to someone else.

## How this layer connects to Layer 3

- One run's charts read the daily bands from the stored series.
- Comparison reads the summary row for each run and, when asked, the per-run peaks.
- **Capacity is applied here.** The user selects a capacity profile, and the layer compares each run's bed demand with that profile's isolation beds. This is a check, not an input to the model.
- **The feedback loop closes here.** A finding such as "beds run out in 39% of runs" sends the user back to Layer 2 to build a new package and run again.

## Module 11 — Visualization

**Purpose:** shows one run's results in charts a person can read at a glance.

### Frontend components
- **Fan chart:** the median as a line and the 5 to 95% range as a shaded band, for active cases, hospitalised patients (against available beds), cumulative cases and deaths
- **Model diagram** showing the SEIHFR compartments and the three transmission routes
- Controls: run selector, metric, scale, day range
- Intervention windows shown on the timeline so a flattening is tied to its cause
- Chart notes: "Line: median of runs. Shaded: 5 to 95% of runs. These are scenario estimates, not forecasts."
- Export of a chart as an image; accessible colours and contrast
- Dashboard hero chart and summary tiles per role

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/simulations/{id}/results` | Summary figures |
| GET | `/simulations/{id}/results/series` | Daily bands |

### Design notes
- **No stored display state.** Chart type and colours are front-end concerns.
- **Ranges always travel with the median.** A chart that shows only a median line is not allowed, to avoid false precision.

## Module 12 — Scenario Analysis & Comparison

**Purpose:** puts several completed runs side by side so a user can judge which response gives the better outcome, and checks results against healthcare capacity.

> **Compares runs that have already been completed.** The page does not create or run scenarios and has no button to start a simulation. Runs are started on the Simulations page, which has a "Compare" button that opens this page with that run preselected.

### Frontend components
- **Completed runs list:** search, disease filter, one row per completed run (name, disease, dataset, package, number of runs, date, who ran it) with a checkbox and colour. Runs still running or failed are shown greyed out with their status and cannot be selected
- Up to **three** runs can be compared. The first selected is the **baseline**, and the user can change it
- **Capacity profile selector** with the number of beds shown. It applies to every run
- **"What is different between these runs":** a table of only the settings that differ. An amber notice appears if the disease, population or run length differ, because differences may then not come from the response alone
- **Chart** of active cases (median and 5 to 95% band per run) with a toggle to "Beds needed", which draws a dashed line for available beds
- **Results table**, one column per run, with median and 5 to 95% range for: chance it takes off, total cases, deaths, peak beds needed, chance beds run out, health-worker share. Non-baseline columns show the difference from the baseline (green when better, red when worse)
- **Add to report** and **Copy link**. The selected run ids are kept in the page address so links can be shared
- Empty states: "No completed simulations yet" (with a "Go to Simulations" button) and "Select at least 2 runs to compare"

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/comparison?run_ids=a,b,c&capacity_profile_id=x` | Compute a comparison on the fly: settings differences, series, results and capacity check |
| GET | `/scenario-comparisons` | List the user's saved comparisons |
| POST | `/scenario-comparisons` | Save a comparison (run ids, baseline, capacity profile, notes) |
| GET / PUT / DELETE | `/scenario-comparisons/{id}` | Read, edit name and notes, delete |

### Schema

**`scenario_comparisons`** (id, name, notes, baseline_run_id, capacity_profile_id, created_by, created_at) and **`scenario_comparison_items`** (id, comparison_id, simulation_run_id with `status = completed` required, display_order).

### Design notes
- **A comparison references runs, not copies of results.** Deleting a comparison never touches the runs.
- **The capacity check is computed when the comparison is read**, never stored, so editing a capacity profile does not leave stale warnings.
- **Fairness checks.** The page warns when runs are not like-for-like (different disease, population or length).
- **Sensitivity analysis** (changing one parameter systematically) is future work. Uncertainty from repeating the model is now part of every result.

## Module 13 — Reporting & Approval

**Purpose:** turns a run or comparison into a document for people who will not open the dashboard, and controls who sees what.

### Frontend components
- **Epidemiologist:** report drafts list (Draft, Pending approval, Approved), a draft editor (title, disease, linked scenario or comparison, summary, key points, figures with ranges, recommendations), submit for approval, approve, export
- **Policy Maker:** list of **approved** reports only, with key points and recommendations; approved scenarios (name, disease, a one-sentence plan, who approved it and when); intervention review (effect with range, relative cost, status: recommended, under review or not recommended, and the basis)
- **Public Health Officer:** reports for their own hospital (weekly situation report, scenario brief, capacity review), read and export
- Report format and generation progress (PDF first); history and download
- Every report carries the line: "These results are scenario estimates with uncertainty ranges, not exact predictions."

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/reports` | Reports the user may see (by role, status and hospital) |
| POST | `/reports` | Create a draft |
| PUT | `/reports/{id}` | Edit a draft |
| POST | `/reports/{id}/submit` | Draft to Pending approval |
| POST | `/reports/{id}/approve` | Pending approval to Approved (needs `approve_reports`) |
| POST | `/reports/{id}/exports` | Generate a file (`format`: pdf first; docx, xlsx and pptx later) |
| GET | `/reports/{id}/exports/{export_id}/download` | Download |
| GET | `/approved-scenarios` | Approved scenarios (policy makers) |
| POST | `/scenarios/{id}/approve` | Approve a scenario for policy-maker view |
| GET | `/intervention-reviews` | Intervention review list |

### Schema

**`reports`**

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | readable code such as `RPT-032` |
| title | text | |
| report_type | enum | scenario_brief, intervention_impact, capacity_review, weekly_situation |
| audience | enum | policy, hospital |
| disease_key | text | |
| simulation_run_id | uuid (FK) | nullable; exactly one of this and `scenario_comparison_id` is set |
| scenario_comparison_id | uuid (FK) | nullable |
| hospital_id | uuid (FK) | set for hospital reports |
| summary | text | |
| key_points, recommendations, figures | json | figures carry value and range |
| status | enum | draft, pending_approval, approved |
| author_id | uuid (FK → users) | |
| approved_by, approved_on | uuid, date | nullable |
| updated_at | timestamp | |

**`report_exports`** (id, report_id, format, status queued, generating, completed or failed, file_key, requested_by, generated_at). **`scenario_approvals`** (scenario_id, approved_by, approved_on, plan_summary). **`intervention_reviews`** (id, name, disease_key or both, description, effect, effect_range, cost low, medium or high, status, basis, updated_by).

### Design notes
- **Approval protects the audience.** Policy makers never see drafts. Only approved reports and approved scenarios are visible to them.
- **Author and approver should differ** (proposed, decision D10). Approvals, submissions and publications are written to the audit log.
- **Scheduled and distributed reports** (recurring, with distribution lists) are out of scope.
- **Report content is saved as written.** An exported file is a rendering of the saved content at that moment.

## Module 16 — Rt Tracking

**Purpose:** estimates how many people each case is infecting right now (the effective reproduction number, Rt) from daily case counts, so users can see whether an outbreak is growing or shrinking.

### How it works
The method is the Bayesian approach of Cori and colleagues (2013). It combines daily case counts with the disease's **serial interval** (the time between one case's symptoms and the next case's) taken from the preset. The estimate uses a sliding 7-day window and a gamma prior (mean 5, standard deviation 5), and returns Rt with a 95% interval. The trend label is:
- **Growing** when the whole interval is above 1,
- **Shrinking** when the whole interval is below 1,
- **Uncertain** when the interval includes 1,
- **Not enough data** when there are too few cases.

### Frontend components
- Case dataset selector and disease selector (the disease sets the serial interval)
- Rt chart with its interval and a reference line at 1, plus daily cases
- Trend label and the latest value
- **Data quality panel:** status of each dataset (passed, warnings or failed) and issues found: missing days, duplicate entries, negative counts and late reports, listed by facility or district. Never by patient
- Import of a daily case file (date, location, new cases); officers also supply daily counts through the Hospital Tracker (Module 17)

### API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/rt/datasets` | List case datasets with their quality status |
| POST | `/rt/datasets` | Import a CSV of daily counts (date, location, cases) |
| GET | `/rt/datasets/{id}/quality` | Data quality issues |
| GET | `/rt/estimate` | `dataset_id`, `disease_key`, optional `window`; returns the daily estimate series |

### Schema

**`case_datasets`** (id, name, source, last_updated, record_count, quality_status passed, warnings or failed) and **`case_records`** (dataset_id, record_date, location, new_cases, reported_at). **`case_quality_issues`** (dataset_id, type, severity warning or error, location, field, value, note).

### Design notes
- **Counts only.** No patient identifiers are accepted or stored.
- **Recent days are the least reliable.** Reports arrive late, so the newest days are undercounted and the latest Rt tends to read too low. The page flags the last days as provisional.
- **Rt describes the past week, not the future.** It is an input to judgement, not a forecast.
- **Requires real case data** to be useful. Until eIDSR or hospital data are connected (Section 8), it works on whatever is imported or entered by hand.

---

# Cross-cutting note: how the layers connect

- **Layer 2 to Layer 3:** every run anchors to a scenario and records a snapshot of everything it resolved. Layer 2 must be working, with at least one real scenario, before a run can be tested end to end.
- **Layer 3 to Layer 4:** every chart, comparison and report traces to a completed run. If a run is not `completed`, there is nothing to show yet.
- **Layer 4 back to Layer 2:** findings send users back to build another package and run again. This loop is the heart of the product.
- **Hospital data to analysis:** entries from Module 17 feed dashboards, alerts and Rt Tracking. They do not change a run that has already finished.

---

# 8. Data sources and integration

EpiSim needs several kinds of data. Most real sources are **not yet available to the project**, so the MVP relies on sample data and manual entry, and every screen says so.

## What data comes from where

| Data needed | Likely source | How it would come in | Status |
|---|---|---|---|
| Case counts by district | eIDSR (built on DHIS2) | File export first; a read-only connector to the DHIS2 web interface later | Access **not confirmed**. Needs permission from RBC and probably a data-sharing agreement |
| Routine facility data (beds, services) | National health information system (also DHIS2-based), hospital registers | File export or connector | Not confirmed |
| Supplies and stock | eLMIS (separate from eIDSR, linked to DHIS2) | Future connector | Not confirmed |
| Population by district | NISR Population and Housing Census (RPHC5, 2022) | One-off import (Module 3) | Public-use 10% microdata exists; district totals in the MVP are approximate sample values |
| District boundaries | geoBoundaries (licence to be confirmed; credit required) | Bundled file | In use |
| Movement between districts | None available | Gravity-model estimate | Estimated and labelled so |
| Disease parameters | Published outbreak reports and reviews | Entered by epidemiologists (Module 4) | Provisional |
| Hospital capacity | Ministry and hospital registers | Entered by officers and administrators (Module 10, Module 17) | Placeholder values |

## How integration would work

1. **Connect:** a connector per source, with read-only access. For DHIS2-based systems this means calling their standard web interface on a schedule.
2. **Translate:** map the source's names and codes onto EpiSim's (for example organisation units to the 30 districts, disease codes to presets).
3. **Check:** look for missing weeks, duplicates and impossible values, and show the user the problems before anything is used.
4. **Snapshot:** store the cleaned data with its source and date. Every run records which snapshot it used.
5. **Use:** the data appears in Data Management and feeds Rt Tracking, dashboards and (later) calibration.

EpiSim pulls **aggregated counts only** (for example cases per district per week), never patient-level records. Reports arrive late and incomplete, so the newest week is treated as provisional.

## What eIDSR is, and where EpiSim sits

eIDSR is Rwanda's electronic integrated disease surveillance and response system. A 2018 technical summary describes three groups of users: data managers at health facilities (hospitals, health centres and private clinics) who enter immediate and weekly reports; eIDSR focal points at district hospitals who investigate alerts and trace contacts; and the Epidemic Surveillance and Response team at RBC, who receive alerts, analyse data, publish weekly bulletins and lead field investigations. That summary also noted that laboratory results were not yet captured automatically and that community members did not use the system. Details may have changed since.

Surveillance tells decision-makers **what has happened**. EpiSim helps them explore **what could happen under different responses.** EpiSim is therefore a layer that can sit on top of surveillance, not a replacement for it.

## Questions to settle with RBC and district teams
- Which DHIS2 instances exist, and what data could be shared, in what form and at what level of detail?
- Who turns eIDSR alerts into decisions about beds, staff and supplies today, and with what tools?
- Do private clinics report regularly?
- Is there a data-sharing agreement process, and what approvals are needed?
- Is any mobility or travel data available?

---

# 9. MVP technical architecture

The MVP is a working demonstration for investors and expert advisers. It deliberately uses simple infrastructure that starts with one command.

| Part | MVP | Later (production) |
|---|---|---|
| Front end | React 18, TypeScript, Vite, Tailwind, Recharts; d3-geo for the district map; typed API client generated from the backend's OpenAPI description; React Router so pages have real addresses | Same |
| Back end | Python 3.11+, FastAPI, Pydantic v2, SQLModel or SQLAlchemy, NumPy for the model | Same |
| Database | SQLite, schema kept compatible with PostgreSQL; Alembic migrations | PostgreSQL |
| Background jobs | A worker pool inside the back end for simulation runs, imports and report generation | A job queue with workers (for example Celery and Redis) |
| Result storage | Summary columns plus JSON in the database or local files | Object storage (S3 or MinIO) |
| Authentication | Password hashing, JWT with expiry, server-side permission checks matching the matrix in Section 3, one demonstration user per role. The MFA screen is a mock | Real MFA, single sign-on if required |
| Reports | PDF generated on the server | Word, Excel and PowerPoint as well |
| Quality | Tests for the model (conservation, reproducibility, interventions), for the API and for the demonstration path | Plus monitoring, backups and security review |

**Original documentation versus MVP.** Earlier versions named PostgreSQL, Celery and MinIO for the first build. The MVP postpones them to reduce set-up time; the schemas in this document are written so they carry over unchanged.

**Demonstration safeguards.** A demo-mode setting shows a ribbon on every page, and an "About this demo" page lists what is real, what is estimated and what is mocked.

**Privacy.** The simulation and response modules store counts only. Personal data held by the system is limited to user accounts. Rwanda's personal data protection law (Law No. 058/2021) applies to those accounts; confirm obligations with a legal adviser before a pilot.

---

# 10. Limitations and validation status

## Validation status: not yet validated
- The model has **not** been calibrated against real outbreak data and has **not** been reviewed by an epidemiologist. Its parameters are provisional.
- No claim of accuracy is made. Results are scenario estimates with ranges.

## Planned validation steps
1. **Parameter review** by an epidemiologist for every value in Appendix A, the model constants in Module 6 and the effect sizes in Module 8.
2. **Back-testing:** run the Ebola preset on a published past outbreak using only information available at its start, and compare weekly counts with the real record. Report the result honestly, including misses. Repeat on more than one outbreak.
3. **Hold-out testing:** fit on early weeks of an outbreak and test predictions on later weeks.
4. **Calibration on local data** once eIDSR access is granted, and recording what changed.

## Known limitations
- **Averages hide variation.** The model treats each district as well mixed and the population as uniform. Real contact patterns are uneven.
- **Intervention effect sizes are placeholders** until an evidence review replaces them.
- **Movement between districts is estimated** by a gravity model, not measured.
- **Only hospital bed demand is modelled directly.** ICU, ventilator and staff demand use assumed ratios and are indicative.
- **Reporting delays and under-reporting** affect any real data used, including Rt estimates.
- **Marburg has the weakest evidence.** Few outbreaks have published data, and several values are borrowed or estimated.
- **Stochastic output varies.** Different seeds give different runs; the ranges describe this, but they do not capture uncertainty about the parameters themselves.
- **Not a forecast.** It explores "what if" under stated assumptions.

---

# 11. Decision log

| # | Decision | Status |
|---|---|---|
| D1 | One engine for the whole product: stochastic SEIHFR. The simpler deterministic version in the prototype is retired | Decided |
| D2 | SEIHFR replaces SEIR as the compartmental model | Decided |
| D3 | Geographic Spread is in scope as a district model; agent-based modelling is out of scope | Decided |
| D4 | Capacity is chosen at analysis time; a scenario's `capacity_profile_id` is only a suggested default | Decided |
| D5 | Scenario Comparison uses completed runs only and has no run button | Decided |
| D6 | Public Health Officers build and run their own scenarios (as in the prototype). The alternative is read-only on scenarios | **Open** |
| D7 | Capacity profiles are readable by every role that analyses; editing is for officers (own institution) and administrators | To confirm |
| D8 | Whether policy makers and officers should have read access to Geographic Spread (the prototype gives it to epidemiologists only) | **Open** |
| D9 | Who issues response instructions to hospitals (proposed: epidemiologists and administrators) | **Open** |
| D10 | A report's author and approver should be different people | Proposed |
| D11 | Accounts are requested and approved; the administrator assigns the role | Decided |
| D12 | MVP infrastructure is simple (SQLite, in-process worker); production uses PostgreSQL, a job queue and object storage | Decided |
| D13 | Route shares and baseline response levers move from engine constants onto the disease preset | Proposed; needs epidemiologist review |
| D14 | Rule for combining baseline response with interventions (Module 8) | Proposed; needs epidemiologist review |
| D15 | Preset fields follow the SEIHFR model; the Disease Presets page must be updated to match | Decided |
| D16 | Role changes are direct administrator edits recorded in the audit log, with no separate role-change request | Decided for the MVP |

---

# Appendix A — Built-in disease preset values

These are the values in the prototype's engine, copied here for review. **They are provisional for use in EpiSim until an epidemiologist review is recorded.** The prototype marks Ebola as "not provisional" because its values come from a systematic review of past outbreaks, but they have not been reviewed for this system. Check every value against its primary source before quoting it outside the team.

| Parameter | Ebola (Zaire) | Marburg |
|---|---|---|
| R0 (low, likely, high) | 1.2, 1.8, 2.7 | 1.2, 1.6, 2.0 |
| Overdispersion k | 0.18 | 0.30 |
| Incubation (days) | 8.5 | 7 |
| Onset to admission (days) | 4.5 | 4 |
| Onset to death (days) | 9.3 | 8 |
| Onset to recovery (days) | 13.0 | 15 |
| Fatality, not admitted | 64.6% | 50% |
| Fatality, admitted | 50% | 22.7% |
| Share of cases hospitalised | 60% | 80% |
| Burial delay (days) | 2 | 2 |
| Health-worker risk per hospitalised patient-day, unprotected | 0.08 | 0.25 |
| Serial interval (mean, standard deviation, days) | 15.4, 9.3 | 9, 5 |
| Reference recorded in the prototype | Systematic review of Ebola outbreaks (West Africa 2013 to 2016, DRC 2018 to 2020) | Rwanda 2024: 66 cases, 15 deaths (22.7%), about 80% health workers. Other values provisional |

The older generic preset values in the prototype's Disease Presets page (for example R0, incubation days, infectious days, mortality and asymptomatic share) were design placeholders and are superseded by this table.

# Appendix B — Glossary

| Term | Meaning |
|---|---|
| **SEIHFR** | The model's compartments: Susceptible, Exposed, Infectious, Hospitalised, Funeral, Removed |
| **R0** | Average number of people one case infects in a fully susceptible population, with no response |
| **Rt** | The same number at a given time during an outbreak, as the response and immunity change it |
| **Serial interval** | Time between symptoms in one case and symptoms in the people they infect |
| **Overdispersion** | A few cases cause most infections; a small value of *k* means more overdispersion |
| **Stochastic / Monte Carlo** | Random draws repeated many times; the spread of results shows uncertainty from chance |
| **5 to 95% range** | The band that holds the middle 90% of runs |
| **Metapopulation model** | A model of several linked local populations, here the 30 districts |
| **Gravity model** | Estimates movement between places from their sizes and the distance between them |
| **Back-testing** | Running a model on a past outbreak to see how close it comes to what happened |
| **eIDSR** | Rwanda's electronic integrated disease surveillance and response system |
| **DHIS2** | An open-source health information platform; the basis of Rwanda's routine health information and eIDSR |
| **eLMIS** | Rwanda's electronic logistics management information system |
| **RBC** | Rwanda Biomedical Centre |
| **NISR** | National Institute of Statistics of Rwanda |
| **RPHC5** | The 2022 Rwanda Population and Housing Census |

---

*This document will keep changing as decisions are made. Every change should be recorded in the decision log (Section 11) and noted in the revision table (Section 0).*
