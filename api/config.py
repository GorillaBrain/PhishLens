"""
PhishLens API Configuration.

Loads settings from environment variables with sensible defaults.
"""

import os
from dotenv import load_dotenv

load_dotenv()


# --- VirusTotal ---
VIRUSTOTAL_API_KEY: str | None = os.getenv("VIRUSTOTAL_API_KEY", None)

# --- CORS ---
_default_origins = "http://localhost:5173,http://localhost:3000"
_origins_env = os.getenv("CORS_ORIGINS", "")
CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in (_origins_env or _default_origins).split(",")
    if origin.strip()
]

# --- Rate Limiting ---
RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "30"))
RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

# --- App Metadata ---
APP_TITLE: str = "PhishLens API"
APP_VERSION: str = "1.0.0"
APP_DESCRIPTION: str = (
    "A transparent, rule-based URL security analyzer. "
    "PhishLens inspects URL structure to estimate phishing risk "
    "without ever visiting the target page."
)

# --- Input Limits ---
MAX_URL_LENGTH: int = 2048
MAX_REQUEST_BODY_BYTES: int = 10_240  # 10 KB
