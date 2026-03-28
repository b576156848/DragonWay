from __future__ import annotations

import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load_dotenv() -> None:
    for env_name in (".env.local", ".env"):
        env_path = BACKEND_DIR / env_name
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


_load_dotenv()

DATABASE_PATH = DATA_DIR / "dragonway.db"
KOL_DATA_PATH = PROJECT_ROOT / "real_kol_data.json"
KOL_PORTRAIT_DIR = PROJECT_ROOT / "real_kol_portrait"
KOL_ASSET_PREFIX = "/assets/kols"

GMI_API_BASE = os.getenv("GMI_API_BASE", "https://api.gmi-serving.com/v1")
GMI_API_KEY = os.getenv("GMI_API_KEY", "")
GMI_MODEL = os.getenv("GMI_MODEL", "anthropic/claude-sonnet-4.5")
GMI_TIMEOUT_SECONDS = int(os.getenv("GMI_TIMEOUT_SECONDS", "40"))
MATCHER_ENRICH_ENABLED = os.getenv("MATCHER_ENRICH_ENABLED", "false").lower() == "true"
QUICK_CHAT_AGENT_ENABLED = os.getenv("QUICK_CHAT_AGENT_ENABLED", "false").lower() == "true"
SCRAPER_CACHE_TTL_SECONDS = int(os.getenv("SCRAPER_CACHE_TTL_SECONDS", "900"))

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() != "false"
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "DragonWay Lab")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/gmail/callback")
GOOGLE_FRONTEND_SUCCESS_URL = os.getenv("GOOGLE_FRONTEND_SUCCESS_URL", "http://localhost:8080")

FRONTEND_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://dragonway-ai-pathfinder.lovable.app",
]
