"""Writes the OpenAPI schema to a file: python -m app.export_openapi <path>. Used by `make openapi`."""

import json
import sys

from app.main import app

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "openapi.json"
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(app.openapi(), fh, indent=1)
    print("wrote", path)
