#!/bin/sh
# Container entrypoint: migrate, seed an empty database, then serve.
# One uvicorn process only: simulations run in an in-process thread pool on SQLite.
set -e
mkdir -p /data "${FILES_DIR:-/data/files}"
alembic upgrade head
python -m app.seed --if-empty --with-runs
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 1 --proxy-headers --forwarded-allow-ips='*'
