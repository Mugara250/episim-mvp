# EpiSim MVP: one container serving the web app and the API on port 8000.
# Stage 1 builds the React frontend; stage 2 runs FastAPI, which serves the built files and /api.

FROM node:20-slim AS frontend
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx vite build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    MPLBACKEND=Agg \
    MPLCONFIGDIR=/tmp/matplotlib \
    DATABASE_URL=sqlite:////data/episim.db \
    FILES_DIR=/data/files \
    STATIC_DIR=/app/frontend/dist \
    DEMO_MODE=true \
    WORKER_THREADS=1 \
    PORT=8000
WORKDIR /app/backend
COPY backend/pyproject.toml ./
COPY backend/app ./app
RUN pip install -e .
COPY backend/alembic.ini ./
COPY backend/alembic ./alembic
COPY --from=frontend /src/frontend/dist /app/frontend/dist
COPY deploy/start.sh /app/start.sh
RUN chmod +x /app/start.sh && mkdir -p /data
# /data holds the SQLite database and generated PDFs: mount a persistent volume here.
VOLUME ["/data"]
EXPOSE 8000
CMD ["/app/start.sh"]
