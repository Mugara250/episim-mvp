# EpiSim MVP — one-command workflows. Backend :8000, frontend :5173.
SHELL := /bin/bash
PYTHON ?= python3
VENV := backend/.venv
PY := $(VENV)/bin/python

.PHONY: setup dev test seed reset-db openapi backend frontend lint backtest

$(VENV)/.installed: backend/pyproject.toml
	@$(PYTHON) -c 'import sys; assert sys.version_info >= (3, 11), "Python 3.11+ required"'
	$(PYTHON) -m venv $(VENV)
	$(VENV)/bin/pip install -q --upgrade pip
	$(VENV)/bin/pip install -q -e 'backend[dev]'
	touch $@

frontend/node_modules/.installed: frontend/package.json
	cd frontend && npm install --no-audit --no-fund
	touch $@

setup: $(VENV)/.installed frontend/node_modules/.installed
	@test -f .env || cp .env.example .env
	cd backend && .venv/bin/alembic upgrade head
	cd backend && .venv/bin/python -m app.seed --if-empty --with-runs

seed: $(VENV)/.installed
	cd backend && .venv/bin/alembic upgrade head
	cd backend && .venv/bin/python -m app.seed --with-runs

reset-db:
	rm -f backend/episim.db
	$(MAKE) seed

backend:
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npx vite --port 5173 --strictPort

dev: setup
	@echo "Backend http://localhost:8000/docs  ·  Frontend http://localhost:5173"
	@trap 'kill 0' EXIT INT TERM; \
	  (cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000) & \
	  (cd frontend && npx vite --port 5173 --strictPort) & \
	  wait

openapi: $(VENV)/.installed
	cd backend && .venv/bin/python -m app.export_openapi ../frontend/src/api/openapi.json
	cd frontend && npx openapi-typescript src/api/openapi.json -o src/api/schema.d.ts

lint: $(VENV)/.installed
	cd backend && .venv/bin/ruff check app tests

test: $(VENV)/.installed frontend/node_modules/.installed
	cd backend && .venv/bin/ruff check app tests
	cd backend && .venv/bin/pytest
	cd frontend && npx tsc --noEmit -p .
	cd frontend && npx vitest run --passWithNoTests

backtest: $(VENV)/.installed
	cd backend && .venv/bin/python ../tools/backtest/backtest_ebola.py
