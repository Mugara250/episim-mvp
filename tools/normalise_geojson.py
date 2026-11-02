"""Normalise geoBoundaries RWA ADM2 into backend/app/data/rwanda-districts.geojson.

Source: geoBoundaries (gbOpen, RWA ADM2, simplified), CC BY 4.0.
Output properties: code (NISR-style), name, province, cx, cy (polygon centroid, lon/lat).
"""
import json
import sys

CODES = {
    "Nyarugenge": ("11", "kigali"), "Gasabo": ("12", "kigali"), "Kicukiro": ("13", "kigali"),
    "Nyanza": ("21", "southern"), "Gisagara": ("22", "southern"), "Nyaruguru": ("23", "southern"),
    "Huye": ("24", "southern"), "Nyamagabe": ("25", "southern"), "Ruhango": ("26", "southern"),
    "Muhanga": ("27", "southern"), "Kamonyi": ("28", "southern"),
    "Karongi": ("31", "western"), "Rutsiro": ("32", "western"), "Rubavu": ("33", "western"),
    "Nyabihu": ("34", "western"), "Ngororero": ("35", "western"), "Rusizi": ("36", "western"),
    "Nyamasheke": ("37", "western"),
    "Rulindo": ("41", "northern"), "Gakenke": ("42", "northern"), "Musanze": ("43", "northern"),
    "Burera": ("44", "northern"), "Gicumbi": ("45", "northern"),
    "Rwamagana": ("51", "eastern"), "Nyagatare": ("52", "eastern"), "Gatsibo": ("53", "eastern"),
    "Kayonza": ("54", "eastern"), "Kirehe": ("55", "eastern"), "Ngoma": ("56", "eastern"),
    "Bugesera": ("57", "eastern"),
}


def ring_centroid(ring):
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:]):
        cross = x0 * y1 - x1 * y0
        a += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    a *= 0.5
    return a, cx / (6 * a), cy / (6 * a)


def centroid(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    total = sx = sy = 0.0
    for poly in polys:
        a, x, y = ring_centroid(poly[0])
        total += abs(a)
        sx += x * abs(a)
        sy += y * abs(a)
    return round(sx / total, 5), round(sy / total, 5)


src, dst = sys.argv[1], sys.argv[2]
raw = json.load(open(src))
features = []
for f in raw["features"]:
    name = f["properties"]["shapeName"]
    code, province = CODES[name]
    cx, cy = centroid(f["geometry"])
    features.append({"type": "Feature", "properties": {"code": code, "name": name, "province": province, "cx": cx, "cy": cy}, "geometry": f["geometry"]})
features.sort(key=lambda f: f["properties"]["code"])
assert len(features) == 30, len(features)
out = {"type": "FeatureCollection", "attribution": "geoBoundaries, CC BY 4.0 (gbOpen RWA ADM2, simplified)", "features": features}
json.dump(out, open(dst, "w"), separators=(",", ":"))
print("wrote", len(features), "districts")
