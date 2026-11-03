"""Runtime settings, read from the environment, ../.env (repo root) and .env."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(__file__).resolve().parent / "data"

APP_VERSION = "0.1.0"
ESTIMATE_LABEL = "Scenario estimates, not forecasts"
ESTIMATE_SENTENCE = "These results are scenario estimates with uncertainty ranges, not exact predictions."
BOUNDARY_ATTRIBUTION = "District boundaries: geoBoundaries, CC BY 4.0"
MOVEMENT_LABEL = "Estimated (gravity model), not observed travel data"


DEV_JWT_SECRET = "dev-only-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_DIR.parent / ".env"), str(BACKEND_DIR / ".env")),
        extra="ignore",
    )

    database_url: str = "sqlite:///./episim.db"
    jwt_secret: str = DEV_JWT_SECRET
    jwt_expire_minutes: int = 480
    demo_mode: bool = True
    worker_threads: int = 2
    files_dir: str = "./var/files"
    # Docs D10: a report's author and approver should be different people.
    require_distinct_approver: bool = True
    # Monte Carlo runs used by the geographic what-if preview.
    what_if_runs: int = 50
    # Comma-separated browser origins allowed by CORS (only needed when the frontend is on another domain).
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Built frontend (vite build output). When the folder exists, the API also serves the web app.
    static_dir: str = str(BACKEND_DIR.parent / "frontend" / "dist")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def resolved_database_url(self) -> str:
        """Relative SQLite paths are resolved against backend/ so the CWD does not matter."""
        url = self.database_url
        prefix = "sqlite:///"
        if url.startswith(prefix) and not url.startswith("sqlite:////") and ":memory:" not in url:
            rel = url[len(prefix) :]
            return prefix + str((BACKEND_DIR / rel).resolve())
        return url

    @property
    def files_path(self) -> Path:
        p = Path(self.files_dir)
        return p if p.is_absolute() else (BACKEND_DIR / p).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
