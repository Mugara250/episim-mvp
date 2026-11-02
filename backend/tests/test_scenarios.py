def test_create_draft_and_save(client, auth):
    h = auth["analyst"]
    d = client.post("/api/scenarios", headers=h, json={"name": "", "draft": True}).json()
    assert d["draft"] and d["access"] == "owner"
    r = client.put(f"/api/scenarios/{d['id']}", headers=h, json={"name": "Saved now", "draft": False})
    assert r.status_code == 422
    r = client.put(
        f"/api/scenarios/{d['id']}",
        headers=h,
        json={
            "name": "Saved now",
            "datasetId": "ds-rubavu",
            "presetId": "marburg",
            "packageId": None,
            "draft": False,
        },
    )
    assert r.status_code == 200
    s = r.json()
    assert not s["draft"] and s["datasetVersion"] == 1 and s["population"] == 546683
    r = client.put(
        f"/api/scenarios/{s['id']}",
        headers=h,
        json={"name": "Saved now", "datasetId": "ds-rubavu", "presetId": "ebola-zaire", "draft": False},
    )
    assert r.status_code == 409


def test_access_follows_shares(client, auth):
    # SC-1031 is shared with Dr. Robert K. (officer) to view, and with Hon. Minister to clone.
    off = client.get("/api/scenarios/SC-1031", headers=auth["officer"]).json()
    assert off["access"] == "view"
    assert client.post("/api/scenarios/SC-1031/clone", headers=auth["officer"]).status_code == 403
    pm = client.post("/api/scenarios/SC-1031/clone", headers=auth["policymaker"])
    assert pm.status_code == 201 and pm.json()["draft"] and pm.json()["owner"] == "Hon. Minister"
    # Drafts and unshared scenarios stay private.
    assert client.get("/api/scenarios/SC-1046", headers=auth["officer"]).status_code == 404


def test_share_and_visibility(client, auth):
    h = auth["analyst"]
    s = client.post(
        "/api/scenarios",
        headers=h,
        json={
            "name": "Share me",
            "datasetId": "ds-kigali",
            "presetId": "ebola-zaire",
            "visibility": "institution",
        },
    ).json()
    assert s["visibility"] == "institution"
    assert client.get(f"/api/scenarios/{s['id']}", headers=auth["officer"]).status_code == 404
    r = client.put(
        f"/api/scenarios/{s['id']}/shares",
        headers=h,
        json={"shares": [{"kind": "institution", "targetId": "H-01", "permission": "clone"}]},
    )
    assert r.status_code == 200
    assert client.get(f"/api/scenarios/{s['id']}", headers=auth["officer"]).json()["access"] == "clone"
    tabs = client.get("/api/scenarios?tab=shared", headers=auth["officer"]).json()
    assert s["id"] in {x["id"] for x in tabs}
