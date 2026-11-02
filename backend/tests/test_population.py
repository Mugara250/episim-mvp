import time

GOOD = b"""hh_id,pid,prov,dist,sect,urban_rural,sex,age,rel_head,marital
1209000141,1,1,12,1209,urban,female,38,head,married
1209000141,2,1,12,1209,urban,male,41,spouse,married
1209000141,3,1,12,1209,urban,female,134,child,
3304000872,2,3,33,3399,urban,,19,child,single
5701001203,1,5,57,5703,rural,female,104,head,widowed
"""


def test_check_flags_rows(client, auth):
    r = client.post(
        "/api/population/imports/check",
        headers=auth["analyst"],
        files={"file": ("sample.csv", GOOD, "text/csv")},
    )
    assert r.status_code == 200
    j = r.json()
    assert j["format"] == "microdata"
    s = j["summary"]
    assert s["totalRows"] == 5 and s["errorRows"] == 2 and s["warningRows"] == 1
    kinds = {b["kind"] for b in s["breakdown"]}
    assert {"Age out of range", "Invalid region code", "Missing required value"} <= kinds


def test_import_creates_version(client, auth):
    h = auth["analyst"]
    before = client.get("/api/population/datasets/ds-gasabo", headers=h).json()["version"]
    r = client.post(
        "/api/population/imports",
        headers=h,
        files={"file": ("g.csv", GOOD, "text/csv")},
        data={"format": "microdata", "datasetId": "ds-gasabo"},
    )
    assert r.status_code == 202
    job = r.json()
    for _ in range(100):
        job = client.get(f"/api/population/imports/{job['id']}", headers=h).json()
        if job["status"] in ("completed", "failed"):
            break
        time.sleep(0.05)
    assert job["status"] == "completed" and job["validRows"] == 3 and job["resultVersion"] == before + 1
    ds = client.get("/api/population/datasets/ds-gasabo", headers=h).json()
    assert ds["version"] == before + 1
    assert {d["code"]: d["population"] for d in ds["districts"]} == {"12": 2, "57": 1}


def test_import_with_no_valid_rows_fails(client, auth):
    bad = b"hh_id,pid,prov,dist,sect,urban_rural,sex,age,rel_head\n1,1,9,99,9999,x,y,500,head\n"
    h = auth["analyst"]
    job = client.post(
        "/api/population/imports",
        headers=h,
        files={"file": ("b.csv", bad, "text/csv")},
        data={"format": "microdata", "name": "Broken"},
    ).json()
    for _ in range(100):
        job = client.get(f"/api/population/imports/{job['id']}", headers=h).json()
        if job["status"] in ("completed", "failed"):
            break
        time.sleep(0.05)
    assert job["status"] == "failed" and "No valid rows" in job["errorMessage"]
