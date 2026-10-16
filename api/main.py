"""
PhishLens API – FastAPI application entry-point.

Routes
------
- ``GET  /health``      – readiness / liveness probe
- ``POST /api/scan``    – analyse a URL
- ``GET  /api/config``  – public front-end configuration
"""

from __future__ import annotations

import time
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import config
from .analyzer import analyze_url
from .models import ErrorResponse, ScanRequest, ScanResponse, VirusTotalResult
from .virustotal import check_url as vt_check_url


# ---------------------------------------------------------------------------
# In-memory rate limiter
# ---------------------------------------------------------------------------

class RateLimiter:
    """Simple sliding-window in-memory rate limiter keyed by client IP."""

    def __init__(
        self,
        max_requests: int = 30,
        window_seconds: int = 60,
    ) -> None:
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        # Prune expired timestamps
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < self.window
        ]
        if len(self.requests[client_ip]) >= self.max_requests:
            return False
        self.requests[client_ip].append(now)
        return True


_rate_limiter = RateLimiter(
    max_requests=config.RATE_LIMIT_MAX_REQUESTS,
    window_seconds=config.RATE_LIMIT_WINDOW_SECONDS,
)


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    # Startup
    app.state.started_at = datetime.now(timezone.utc).isoformat()
    yield
    # Shutdown – nothing to clean up for now


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=config.APP_TITLE,
    version=config.APP_VERSION,
    description=config.APP_DESCRIPTION,
    lifespan=lifespan,
    responses={
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
    },
)

# -- CORS middleware --
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Middleware: request body size limit + rate limiting
# ---------------------------------------------------------------------------

@app.middleware("http")
async def request_guard(request: Request, call_next):
    """Enforce request-body size limit and per-IP rate limiting."""
    # --- Body size limit (only for non-GET/HEAD/OPTIONS) ---
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > config.MAX_REQUEST_BODY_BYTES:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large."},
            )

    # --- Rate limiting ---
    client_ip = request.client.host if request.client else "unknown"
    if not _rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again later."},
        )

    response: Response = await call_next(request)
    return response


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict[str, Any]:
    """Readiness / liveness check."""
    return {
        "status": "healthy",
        "version": config.APP_VERSION,
        "virustotal_configured": config.VIRUSTOTAL_API_KEY is not None
        and len(config.VIRUSTOTAL_API_KEY) > 0,
    }


@app.get("/api/config")
async def public_config() -> dict[str, Any]:
    """Return non-sensitive configuration for the front-end."""
    return {
        "virustotal_available": config.VIRUSTOTAL_API_KEY is not None
        and len(config.VIRUSTOTAL_API_KEY) > 0,
    }


@app.post(
    "/api/scan",
    response_model=ScanResponse,
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
)
async def scan_url(body: ScanRequest) -> ScanResponse:
    """Analyse a URL for phishing indicators.

    The endpoint inspects only the URL *string* – it never fetches or renders
    the target page.
    """
    url_str = str(body.url)

    # Extra length guard (Pydantic validates HttpUrl, but we cap length too)
    if len(url_str) > config.MAX_URL_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=(
                f"URL exceeds the maximum allowed length of "
                f"{config.MAX_URL_LENGTH} characters."
            ),
        )

    # --- Heuristic analysis ---
    heuristic = analyze_url(url_str)

    # --- Optional VirusTotal lookup ---
    vt_result: VirusTotalResult | None = None
    if config.VIRUSTOTAL_API_KEY:
        vt_result = await vt_check_url(url_str, config.VIRUSTOTAL_API_KEY)

    return ScanResponse(
        url=url_str,
        scan_timestamp=datetime.now(timezone.utc).isoformat(),
        heuristic=heuristic,
        virustotal=vt_result,
    )
