from conftest import wait_for


def test_comparison_rules(client, auth, start_run, fake_engine):
    h = auth["analyst"]
    a, b, c, d = (start_run(sid) for sid in ("SC-1042", "SC-1048", "SC-1039", "SC-1044"))
    for r in (a, b, c, d):
        wait_for(client, h, r["id"])
    assert client.get("/api/comparison", headers=h, params={"runIds": a["id"]}).status_code == 422
    four = ",".join(r["id"] for r in (a, b, c, d))
    assert client.get("/api/comparison", headers=h, params={"runIds": four}).status_code == 422
    r = client.get(
        "/api/comparison",
        headers=h,
        params={"runIds": f"{a['id']},{b['id']}", "capacityProfileId": "cap-gisenyi-2026"},
    )
    assert r.status_code == 200
    j = r.json()
    assert j["baselineId"] == a["id"] and j["warnings"]
    assert {x["setting"] for x in j["differences"]} >= {"Disease preset", "Interventions"}
    beds_row = next(x for x in j["results"] if x["metric"] == "pBedsExceeded")
    assert beds_row["values"][0]["value"] == 0.2


def test_only_completed_runs(client, auth, start_run, fake_engine):
    h = auth["analyst"]
    ok = start_run()
    wait_for(client, h, ok["id"])
    fake_engine.mode = "fail"
    bad = start_run()
    wait_for(client, h, bad["id"])
    r = client.get("/api/comparison", headers=h, params={"runIds": f"{ok['id']},{bad['id']}"})
    assert r.status_code == 409
