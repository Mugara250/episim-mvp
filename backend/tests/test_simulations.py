from conftest import wait_for


def test_lifecycle_completed(client, auth, start_run):
    run = start_run()
    assert run["status"] in ("queued", "running") and run["seed"] == 2026
    done = wait_for(client, auth["analyst"], run["id"])
    assert done["status"] == "completed" and done["summary"]["peakDay"] == 30 and done["progress"] == 1
    res = client.get(
        f"/api/simulations/{run['id']}/results",
        headers=auth["analyst"],
        params={"capacityProfileId": "cap-gisenyi-2026"},
    ).json()
    assert res["label"] == "Scenario estimates, not forecasts"
    assert res["capacity"]["beds"] == 260 and res["capacity"]["pBedsExceeded"] == 0.2
    snap_disease = res["inputs"]["disease"]
    assert snap_disease["presetId"] == "ebola-zaire" and snap_disease["provisional"] is True
    series = client.get(f"/api/simulations/{run['id']}/results/series", headers=auth["analyst"]).json()
    assert len(series["series"]["active"]["median"]) == 31


def test_cancel_running(client, auth, start_run, fake_engine):
    fake_engine.mode = "slow"
    run = start_run()
    wait_for(client, auth["analyst"], run["id"], statuses=("running",))
    r = client.post(f"/api/simulations/{run['id']}/cancel", headers=auth["analyst"])
    assert r.status_code == 200
    assert wait_for(client, auth["analyst"], run["id"])["status"] == "cancelled"
    assert client.get(f"/api/simulations/{run['id']}/results", headers=auth["analyst"]).status_code == 409


def test_failure_has_plain_message(client, auth, start_run, fake_engine):
    fake_engine.mode = "fail"
    run = start_run()
    done = wait_for(client, auth["analyst"], run["id"])
    assert done["status"] == "failed" and "try again" in done["error"].lower()


def test_geo_needs_seed_district_and_multi_district_dataset(client, auth, fake_engine):
    h = auth["analyst"]
    body = {"scenarioId": "SC-1050", "horizonDays": 30, "initialCases": 3, "modelType": "seihfr_geo"}
    assert client.post("/api/simulations", headers=h, json=body).status_code == 422
    assert (
        client.post(
            "/api/simulations", headers=h, json={**body, "scenarioId": "SC-1042", "seedDistrictCode": "33"}
        ).status_code
        == 422
    )
    r = client.post("/api/simulations", headers=h, json={**body, "seedDistrictCode": "33"})
    assert r.status_code == 202
    wait_for(client, h, r.json()["id"])
    geo = client.get(
        f"/api/simulations/{r.json()['id']}/geographic",
        headers=h,
        params={"capacityProfileId": "cap-moh-districts-q3"},
    ).json()
    assert len(geo["districts"]) == 30 and geo["watchList"] and "geoBoundaries" in geo["boundaryAttribution"]
    rubavu = next(d for d in geo["districts"] if d["code"] == "33")
    assert rubavu["beds"] == 70 and rubavu["pBedsExceeded"] == 0.25
    assert rubavu["bedsRunOutDay"] is None and rubavu["status"] == "within"
    burera = next(d for d in geo["districts"] if d["code"] == "44")  # 15 beds; fake median series = day index
    assert burera["beds"] == 15 and burera["bedsRunOutDay"] == 16 and burera["status"] == "short"


def test_officer_runs_shared_scenario_policymaker_sees_history(client, auth, start_run):
    run = start_run("SC-1031", who="officer")
    wait_for(client, auth["officer"], run["id"])
    ids = {r["id"] for r in client.get("/api/simulations", headers=auth["policymaker"]).json()}
    assert run["id"] in ids  # SC-1031 is shared with the Minister


def test_draft_scenario_cannot_run(client, auth, fake_engine):
    r = client.post(
        "/api/simulations",
        headers=auth["analyst"],
        json={"scenarioId": "SC-1046", "horizonDays": 30, "initialCases": 1},
    )
    assert r.status_code == 422 and "draft" in r.json()["detail"]
