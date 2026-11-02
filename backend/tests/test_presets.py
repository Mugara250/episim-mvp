def test_builtin_readonly_and_clone(client, auth):
    h = auth["analyst"]
    ebola = client.get("/api/disease-presets/ebola-zaire", headers=h).json()
    assert ebola["builtIn"] and ebola["provisional"] and ebola["reference"]
    edit = {**ebola, "r0Likely": 2.0}
    assert client.put("/api/disease-presets/ebola-zaire", headers=h, json=edit).status_code == 403
    clone = client.post("/api/disease-presets/ebola-zaire/clone", headers=h, json={"name": "Ebola test copy"})
    assert clone.status_code == 201
    c = clone.json()
    assert not c["builtIn"] and c["clonedFromId"] == "ebola-zaire" and c["version"] == 1
    r = client.put(f"/api/disease-presets/{c['id']}", headers=h, json={**c, "r0Likely": 2.0})
    assert r.status_code == 200 and r.json()["version"] == 2 and r.json()["r0Likely"] == 2.0


def test_marburg_provisional(client, auth):
    m = client.get("/api/disease-presets/marburg", headers=auth["officer"]).json()
    assert m["provisional"] is True and "Rwanda 2024" in m["reference"]


def test_validation(client, auth):
    c = client.post("/api/disease-presets/marburg/clone", headers=auth["analyst"]).json()
    bad = {**c, "routeShareCommunity": 0.9}
    assert client.put(f"/api/disease-presets/{c['id']}", headers=auth["analyst"], json=bad).status_code == 422
    bad = {**c, "r0Low": 3, "r0Likely": 2}
    assert client.put(f"/api/disease-presets/{c['id']}", headers=auth["analyst"], json=bad).status_code == 422


def test_officer_cannot_create(client, auth):
    c = client.get("/api/disease-presets/marburg", headers=auth["officer"]).json()
    assert client.post("/api/disease-presets/marburg/clone", headers=auth["officer"]).status_code == 403
    assert client.post("/api/disease-presets", headers=auth["officer"], json=c).status_code == 403
