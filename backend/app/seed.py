"""Seeds the database with the prototype's sample records, clearly marked illustrative.

    python -m app.seed             # add anything missing (idempotent)
    python -m app.seed --if-empty  # only seed a database with no users
    python -m app.seed --with-runs # also execute real engine runs for a few seeded scenarios

No simulation results are invented: runs, when requested, are produced by the real engine.
Demo accounts (password in brackets) are documented in README.md.
"""

import argparse
import json
import secrets
from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import db as dbmod
from app.config import DATA_DIR
from app.core.security import hash_password
from app.models import (
    AccessRequest,
    Announcement,
    AuditLog,
    BorderRisk,
    CapacityDistrictBeds,
    CapacityProfile,
    CaseDataset,
    CaseRecord,
    DatasetDistrict,
    DatasetVersion,
    DiseasePreset,
    HospitalEntry,
    Institution,
    Instruction,
    InterventionItem,
    InterventionPackage,
    InterventionReview,
    InterventionType,
    PolicyAlert,
    PopulationDataset,
    Report,
    ResponsePlan,
    Scenario,
    ScenarioApproval,
    ScenarioShare,
    SupportTicket,
    User,
)

SEED = DATA_DIR / "seed"

# One demo user per role (frontend/src/pages/Login.tsx), plus a second Epidemiologist who approves
# reports, because docs D10 requires the approver to differ from the author.
DEMO_ACCOUNTS = {
    "U-01": ("admin@moh.gov.rw", "admin123"),
    "U-04": ("epidemiologist@rbc.gov.rw", "epi123"),
    "U-06": ("officer@who.int", "officer123"),
    "U-09": ("policymaker@moh.gov.rw", "policy123"),
    "U-02": ("s.icyeza@rbc.gov.rw", "epi123"),
}
ORG_IDS = {
    "Rwanda Biomedical Centre": "ORG-RBC",
    "Ministry of Health": "ORG-MOH",
    "University of Rwanda": "ORG-UR",
    "Partners In Health": "ORG-PIH",
}
BORDER_SIDES = {"DRC": "west", "Uganda": "north", "Burundi": "south", "Tanzania": "east"}
STATUS = {"Draft": "draft", "Pending approval": "pending_approval", "Approved": "approved"}
REPORT_TYPE = {
    "Weekly situation": "weekly_situation",
    "Scenario brief": "scenario_brief",
    "Capacity review": "capacity_review",
    "Intervention impact": "intervention_impact",
}


def load(name: str) -> dict:
    with open(SEED / f"{name}.json", encoding="utf-8") as fh:
        return json.load(fh)


def day(s: str | None) -> datetime | None:
    """Parses '12 Sep 2026', '2026-10-08', '2026-10-08 10:02' or ISO timestamps."""
    if not s:
        return None
    for fmt in ("%d %b %Y", "%Y-%m-%d", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def add(db: Session, obj) -> bool:
    """Adds obj unless a row with the same primary key exists. Returns True when added."""
    mapper = type(obj).__mapper__
    pk = tuple(getattr(obj, c.key) for c in mapper.primary_key)
    if db.get(type(obj), pk if len(pk) > 1 else pk[0]) is not None:
        return False
    db.add(obj)
    return True


def unusable_password() -> str:
    return hash_password(secrets.token_urlsafe(24))


def seed_institutions(db: Session):
    cap = load("capacity")
    hospitals = {h["id"]: h for h in load("admin")["hospitals"]}
    for i in cap["institutions"]:
        h = hospitals.get(i["id"], {})
        add(
            db,
            Institution(
                id=i["id"],
                name=i["name"],
                kind=i["kind"],
                district=h.get("district"),
                isolation_beds=h.get("isolationBeds"),
                registered=h.get("registered"),
                illustrative=True,
            ),
        )
    for name, oid in ORG_IDS.items():
        add(db, Institution(id=oid, name=name, kind="Organisation", illustrative=True))
    db.flush()


def inst_id(db: Session, name: str) -> str | None:
    i = db.scalar(select(Institution).where(Institution.name == name))
    return i.id if i else None


def seed_users(db: Session):
    a = load("admin")
    for u in a["users"]:
        demo = DEMO_ACCOUNTS.get(u["id"])
        institution = u.get("hospitalId") or ORG_IDS.get(u["organisation"])
        add(
            db,
            User(
                id=u["id"],
                name=u["name"],
                email=demo[0] if demo else u["email"],
                password_hash=hash_password(demo[1]) if demo else unusable_password(),
                role=u["role"],
                institution_id=institution,
                status=u["status"],
                is_demo=bool(demo),
                illustrative=True,
                last_login=day(u["lastLogin"]),
                title={
                    "admin": "System administrator",
                    "analyst": "Epidemiologist",
                    "officer": "Public Health Officer",
                    "policymaker": "Policy maker",
                }[u["role"]],
            ),
        )
    for r in a["accessRequests"]:
        add(
            db,
            AccessRequest(
                id=r["id"],
                name=r["name"],
                email=r["email"],
                institution=r["institution"],
                institution_account_id=r.get("institutionAccountId", ""),
                position=r.get("position", ""),
                password_hash=hash_password(r["password"]),
                status=r["status"],
                submitted_at=day(r["submittedAt"]),
                decided_at=day(r.get("decidedAt")),
                decided_by=r.get("decidedBy"),
                assigned_role=r.get("assignedRole"),
                rejection_reason=r.get("rejectionReason"),
                seen_by_admin=r.get("seenByAdmin", False),
                illustrative=True,
            ),
        )
    if not db.scalar(select(func.count()).select_from(AuditLog)):
        for e in reversed(a["auditLog"]):
            db.add(
                AuditLog(
                    time=day(e["time"]),
                    user_name=e["user"],
                    role=e["role"],
                    action=e["action"],
                    target=e["target"],
                    details=e["details"],
                    illustrative=True,
                )
            )
    db.flush()


def seed_population(db: Session):
    districts = load("districts")["districts"]
    by_code = {d["code"]: d["population"] for d in districts}
    s = load("scenarios")
    coverage_codes = {
        "ds-rphc5": list(by_code),
        "ds-kigali": ["11", "12", "13"],
        "ds-rubavu": ["33"],
        "ds-gasabo": ["12"],
    }
    datasets = s["datasets"] + [
        {
            "id": "ds-districts-2022",
            "name": "Rwanda districts (2022 census, approx.)",
            "coverage": "Rwanda · all 30 districts (district totals)",
            "source": "NISR 2022 census, approximate district totals",
            "population": sum(by_code.values()),
            "version": 1,
            "lastImported": "01 Oct 2026",
        }
    ]
    coverage_codes["ds-districts-2022"] = list(by_code)
    for d in datasets:
        if db.get(PopulationDataset, d["id"]):
            continue
        ds = PopulationDataset(
            id=d["id"],
            name=d["name"],
            coverage=d["coverage"],
            source=d["source"],
            year="2022",
            illustrative=True,
            created_by="Seed (illustrative)",
        )
        codes = coverage_codes[d["id"]]
        for v in range(1, d["version"] + 1):
            ver = DatasetVersion(
                version=v,
                population=sum(by_code[c] for c in codes),
                format="seed",
                row_count=len(codes),
                notes="Illustrative district totals seeded from the prototype (approx. 2022 census).",
                imported_by="Seed (illustrative)",
                imported_at=day(d["lastImported"]),
            )
            ver.districts = [DatasetDistrict(district_code=c, population=by_code[c]) for c in codes]
            ds.versions.append(ver)
        db.add(ds)
    db.flush()


def seed_presets_and_interventions(db: Session):
    for p in load("disease_presets")["presets"]:
        if db.get(DiseasePreset, p["id"]):
            continue
        db.add(
            DiseasePreset(
                created_by="Seed",
                illustrative=p.get("illustrative", False),
                **{k: v for k, v in p.items() if k != "illustrative"},
            )
        )
    iv = load("interventions")
    for t in iv["types"]:
        add(
            db,
            InterventionType(
                id=t["id"],
                key=t["key"],
                name=t["name"],
                description=t["description"],
                mechanism=t["mechanism"],
                engine_lever=t["engine_lever"],
                default_effect=t["defaultEffect"],
                source=t["source"],
                placeholder=t["placeholder"],
                is_builtin=t["builtIn"],
                created_by="Seed",
            ),
        )
    db.flush()
    for p in iv["packages"]:
        if db.get(InterventionPackage, p["id"]):
            continue
        pkg = InterventionPackage(
            id=p["id"],
            name=p["name"],
            description=p["description"],
            illustrative=True,
            created_by="Aline Uwase",
            updated_at=day(p.get("updated")) or datetime(2026, 10, 1),
        )
        pkg.items = [
            InterventionItem(
                id=f"{p['id']}-{it['id']}",
                type_id=it["typeId"],
                position=i,
                start_day=it["startDay"],
                end_day=it["endDay"],
                coverage=it["coverage"],
                custom_effect=it["customEffect"],
            )
            for i, it in enumerate(p["items"])
        ]
        db.add(pkg)
    db.flush()


def seed_capacity(db: Session):
    cap = load("capacity")
    for p in cap["profiles"]:
        add(
            db,
            CapacityProfile(
                id=p["id"],
                name=p["name"],
                institution_id=p["institutionId"],
                hospital_beds=p["hospitalBeds"],
                icu_beds=p["icuBeds"],
                ventilators=p["ventilators"],
                health_workers=p["healthWorkers"],
                tests_per_day=p["testsPerDay"],
                vaccine_doses=p["vaccineDoses"],
                source_note=p["sourceNote"],
                placeholder=True,
                updated_by=p["updatedBy"],
                updated_at=day(p["updated"]),
            ),
        )
    districts = load("districts")
    for gp in districts["geoCapacityProfiles"]:
        pid = {"moh-q3": "cap-moh-districts-q3", "surge": "cap-moh-districts-surge"}[gp["id"]]
        if db.get(CapacityProfile, pid):
            continue
        rows = [
            CapacityDistrictBeds(district_code=d["code"], beds=round(d["beds"] * gp["bedMultiplier"]))
            for d in districts["districts"]
        ]
        db.add(
            CapacityProfile(
                id=pid,
                name=gp["name"].replace("·", "-") + " (by district)",
                institution_id="ORG-MOH",
                hospital_beds=sum(r.beds for r in rows),
                source_note="Placeholder. Isolation beds per district for design "
                "review, not an official inventory.",
                placeholder=True,
                updated_by="Seed",
                district_beds=rows,
            )
        )
    db.flush()


def seed_scenarios(db: Session):
    s = load("scenarios")
    users = {u.name: u for u in db.scalars(select(User))}
    extra = [
        {
            "id": "SC-1050",
            "name": "Ebola national · Rubavu seed · current response",
            "description": "Geographic spread across the 30 districts, outbreak starting in Rubavu, "
            "no extra interventions.",
            "datasetId": "ds-districts-2022",
            "datasetVersion": 1,
            "presetId": "ebola-zaire",
            "packageId": None,
            "owner": "Aline Uwase",
            "created": "09 Oct 2026",
            "draft": False,
            "shares": [
                {"id": "sh10", "kind": "institution", "target": "Ministry of Health", "permission": "view"}
            ],
        },
        {
            "id": "SC-1051",
            "name": "Ebola national · Rubavu seed · tracing + isolation",
            "description": "Same as SC-1050 with early contact tracing, case isolation and testing.",
            "datasetId": "ds-districts-2022",
            "datasetVersion": 1,
            "presetId": "ebola-zaire",
            "packageId": "pkg-tracing-isolation",
            "owner": "Aline Uwase",
            "created": "09 Oct 2026",
            "draft": False,
            "shares": [
                {"id": "sh11", "kind": "institution", "target": "Ministry of Health", "permission": "view"}
            ],
        },
    ]
    for sc in s["scenarios"] + extra:
        if db.get(Scenario, sc["id"]):
            continue
        owner = users[sc["owner"]]
        row = Scenario(
            id=sc["id"],
            name=sc["name"],
            description=sc["description"],
            dataset_id=sc["datasetId"],
            dataset_version=sc["datasetVersion"],
            preset_id=sc["presetId"],
            package_id=sc["packageId"],
            owner_id=owner.id,
            owner_institution_id=owner.institution_id,
            draft=sc["draft"],
            illustrative=True,
            created_at=day(sc["created"]),
            updated_at=day(sc["created"]),
        )
        shares = []
        for sh in sc["shares"]:
            target = users[sh["target"]].id if sh["kind"] == "user" else inst_id(db, sh["target"])
            if target:
                shares.append(
                    ScenarioShare(
                        id=f"{sc['id']}-{sh['id']}",
                        kind=sh["kind"],
                        target_id=target,
                        permission=sh["permission"],
                    )
                )
        row.shares = shares
        db.add(row)
    db.flush()


def seed_policy_and_reports(db: Session):
    pol = load("policy")
    users = {u.name: u for u in db.scalars(select(User))}
    for a in pol["approvedScenarios"]:
        add(
            db,
            ScenarioApproval(
                id=a["id"],
                name=a["name"],
                disease=a["diseaseId"],
                plan_summary=a["plan"],
                approved_by=a["approvedBy"],
                approved_on=day(a["approvedOn"]),
                illustrative=True,
                settings={
                    k: a[k]
                    for k in (
                        "detectionDelay",
                        "safeBurial",
                        "contactTracing",
                        "isolationBeds",
                        "ppeAfter",
                        "recognitionDay",
                    )
                    if k in a
                },
            ),
        )
    for r in pol["reportDrafts"]:
        author = users.get("Aline Uwase")
        add(
            db,
            Report(
                id=r["id"],
                title=r["title"],
                disease=r["disease"].lower(),
                scenario_ref=r["scenarioId"],
                summary=r["summary"],
                status=STATUS[r["status"]],
                author_id=author.id,
                author_name=author.name,
                approved_by=r.get("approvedBy"),
                approved_on=day(r["updated"]) if r.get("approvedBy") else None,
                illustrative=True,
                updated_at=day(r["updated"]),
                created_at=day(r["updated"]),
            ),
        )
    for r in pol["approvedReports"]:
        author = users.get(r["author"])
        add(
            db,
            Report(
                id=r["id"],
                title=r["title"],
                disease=r["disease"].lower(),
                report_type=REPORT_TYPE.get(r["type"], "scenario_brief"),
                summary=r["summary"],
                key_points=r["keyPoints"],
                recommendations=r["recommendations"],
                figures=[{"label": f["label"], "value": "", "range": f["range"]} for f in r["figures"]],
                status="approved",
                author_id=author.id if author else None,
                author_name=r["author"],
                approved_by=r["approvedBy"],
                approved_on=day(r["approvedOn"]),
                illustrative=True,
                updated_at=day(r["approvedOn"]),
                created_at=day(r["approvedOn"]),
            ),
        )
    for r in load("officer")["hospitalReports"]:
        add(
            db,
            Report(
                id=r["id"],
                title=r["title"],
                audience="hospital",
                hospital_id="H-01",
                report_type=REPORT_TYPE.get(r["type"], "weekly_situation"),
                period=r["period"],
                summary=r["summary"],
                figures=r["figures"],
                status="approved",
                author_name=r["by"],
                author_id=users[r["by"]].id if r["by"] in users else None,
                approved_by=r["by"],
                approved_on=day(r["published"]),
                illustrative=True,
                updated_at=day(r["published"]),
            ),
        )
    for r in pol["interventionReviews"]:
        add(
            db,
            InterventionReview(
                id=r["id"],
                name=r["name"],
                disease=r["disease"],
                description=r["description"],
                effect=r["effect"],
                effect_range=r["effectRange"],
                cost=r["cost"],
                status=r["status"],
                basis=r["basis"],
                updated_by="Seed",
                illustrative=True,
            ),
        )
    for a in pol["alerts"]:
        add(
            db,
            PolicyAlert(
                id=a["id"],
                level=a["level"],
                title=a["title"],
                detail=a["detail"],
                date=day(a["date"]),
                illustrative=True,
            ),
        )
    # Seeded parameter-set approvals are illustrative; show them on the built-in presets as recorded.
    for ps in pol["parameterSets"]:
        p = db.get(DiseasePreset, {"ebola": "ebola-zaire", "marburg": "marburg"}[ps["diseaseId"]])
        if p and p.approved_by is None:
            p.approved_by = f"{ps['approvedBy']} (illustrative)"
            p.approved_on = day(ps["approvedOn"])
    db.flush()


def seed_officer(db: Session):
    off = load("officer")
    for e in off["entries"]:
        add(
            db,
            HospitalEntry(
                id=e["id"],
                hospital_id="H-01",
                date=date.fromisoformat(e["date"]),
                disease=e["disease"],
                suspected=e["suspected"],
                confirmed=e["confirmed"],
                in_isolation=e["inIsolation"],
                recovered=e["recovered"],
                deaths=e["deaths"],
                hcw_infected=e["hcwInfected"],
                beds_total=e["bedsTotal"],
                beds_occupied=e["bedsOccupied"],
                ppe_stock=e["ppeStock"],
                trained_staff=e["trainedStaff"],
                burial_team_ready=e["burialTeamReady"],
                contacts_follow_up=e["contactsFollowUp"],
                entered_by="Dr. Robert K.",
                illustrative=True,
            ),
        )
    for i in off["instructions"]:
        add(
            db,
            Instruction(
                id=i["id"],
                hospital_id="H-01",
                action=i["action"],
                target=i["target"],
                deadline=date.fromisoformat(i["deadline"]),
                from_name=i["from"],
                disease=i["disease"],
                received=date.fromisoformat(i["received"]),
                status=i["status"],
                reason=i.get("reason"),
                illustrative=True,
            ),
        )
    for p in off["plans"]:
        add(
            db,
            ResponsePlan(
                id=p["id"],
                hospital_id="H-01",
                title=p["title"],
                disease=p["disease"],
                status=p["status"],
                start_date=date.fromisoformat(p["startDate"]),
                review_date=date.fromisoformat(p["reviewDate"]),
                actions=p["actions"],
                notes=p["notes"],
                illustrative=True,
                updated_at=day(p["updated"]),
            ),
        )
    db.flush()


def seed_reference(db: Session):
    for b in load("districts")["borderRisks"]:
        add(
            db,
            BorderRisk(
                country=b["country"],
                risk=b["risk"],
                side=BORDER_SIDES[b["country"]],
                note="Assumption for the demo, not calculated from data.",
                updated_by="Seed",
            ),
        )
    from datetime import timedelta

    for s in load("case_data")["series"]:
        if db.get(CaseDataset, s["id"]):
            continue
        start = date.fromisoformat(s["startDate"])
        db.add(
            CaseDataset(
                id=s["id"],
                name=s["label"],
                disease=s["diseaseId"],
                source=s["reportedBy"],
                start_date=start,
                illustrative=True,
                note="Sample daily counts from the prototype. Not verified against a primary source.",
            )
        )
        db.flush()
        for i, n in enumerate(s["counts"]):
            db.add(
                CaseRecord(
                    dataset_id=s["id"],
                    record_date=start + timedelta(days=i),
                    location=s["reportedBy"].split("·")[-1].strip(),
                    new_cases=n,
                    reported_by="Seed",
                )
            )
    tickets = [
        ("TKT-1042", "Cannot export scenario comparison to PDF", "Dr. Sarah Chen", "High", "Open"),
        (
            "TKT-1041",
            "Requesting updated Marburg incubation period values",
            "James Wilson",
            "Medium",
            "In Progress",
        ),
        ("TKT-1039", "Login MFA not sending SMS", "Alice Mutoni", "Critical", "Open"),
    ]
    for tid, subject, who, prio, status in tickets:
        add(
            db,
            SupportTicket(
                id=tid, subject=subject, requester=who, priority=prio, status=status, illustrative=True
            ),
        )
    anns = [
        (
            "ANN-1",
            "Scheduled maintenance this weekend",
            "EpiSim will be unavailable for about an hour on Saturday.",
            "info",
        ),
        (
            "ANN-2",
            "New SEIHFR parameters available for Marburg",
            "The Marburg preset has new provisional values.",
            "info",
        ),
    ]
    for aid, title, body, level in anns:
        add(
            db,
            Announcement(
                id=aid,
                title=title,
                body=body,
                level=level,
                created_by="Dr. Jean Damascene",
                illustrative=True,
            ),
        )
    db.flush()


def seed(db: Session) -> None:
    seed_institutions(db)
    seed_users(db)
    seed_population(db)
    seed_presets_and_interventions(db)
    seed_capacity(db)
    seed_scenarios(db)
    seed_policy_and_reports(db)
    seed_officer(db)
    seed_reference(db)
    db.commit()


def run_seed_simulations(db: Session) -> list[str]:
    """Runs the real engine synchronously for a few seeded scenarios (optional, for demos with history)."""
    from app.models import SimulationRun
    from app.services.ids import next_code
    from app.services.resolver import resolve
    from app.services.worker import SimulationWorker, engine_version

    plan = [
        ("SC-1042", "seihfr", None, 180, 3),
        ("SC-1039", "seihfr", None, 180, 2),
        ("SC-1050", "seihfr_geo", "33", 120, 3),
        ("SC-1051", "seihfr_geo", "33", 120, 3),
    ]
    aline = db.get(User, "U-04")
    worker = SimulationWorker(1)
    ids = []
    for sid, model, seed_district, days, cases in plan:
        sc = db.get(Scenario, sid)
        snap = resolve(
            db,
            sc,
            model_type=model,
            days=days,
            initial_cases=cases,
            runs=200,
            seed=2026,
            seed_district_code=seed_district,
        )
        snap["engine_version"] = engine_version()
        run = SimulationRun(
            id=next_code(db, SimulationRun, "RUN-", 4, 100),
            scenario_id=sid,
            model_type=model,
            horizon_days=days,
            initial_cases=cases,
            seed=2026,
            seed_district_code=seed_district,
            engine_version=snap["engine_version"],
            inputs_snapshot=snap,
            requested_by_id=aline.id,
        )
        db.add(run)
        db.commit()
        worker.submit(run.id).result()
        ids.append(run.id)
    return ids


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--if-empty", action="store_true", help="only seed when there are no users")
    parser.add_argument(
        "--with-runs", action="store_true", help="also run the real engine for a few seeded scenarios"
    )
    args = parser.parse_args()
    with dbmod.SessionLocal() as db:
        if args.if_empty and db.scalar(select(func.count()).select_from(User)):
            print("Database already seeded; skipping.")
            return
        seed(db)
        print("Seeded illustrative sample data.")
        if args.with_runs:
            print("Engine runs:", ", ".join(run_seed_simulations(db)))


if __name__ == "__main__":
    main()
