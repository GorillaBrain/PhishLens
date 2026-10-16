"""
PhishLens Pydantic models for API requests and responses.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class ScanRequest(BaseModel):
    """Incoming scan request containing a single URL to analyse."""

    url: HttpUrl = Field(..., description="The URL to analyse for phishing indicators.")


# ---------------------------------------------------------------------------
# URL Components
# ---------------------------------------------------------------------------

class URLComponents(BaseModel):
    """Decomposed URL parts returned in every scan response."""

    scheme: str
    hostname: str
    port: int | None = None
    path: str
    query_present: bool
    fragment_present: bool


# ---------------------------------------------------------------------------
# Findings
# ---------------------------------------------------------------------------

class Finding(BaseModel):
    """A single heuristic finding produced by the analysis engine."""

    id: str = Field(..., description="Machine-readable rule identifier, e.g. 'ip_address'.")
    title: str = Field(..., description="Short human-readable title.")
    description: str = Field(..., description="Explanation of why this indicator was flagged.")
    severity: Literal["info", "low", "medium", "high", "critical"]
    score_impact: int = Field(..., ge=0, description="Points added to the risk score.")


# ---------------------------------------------------------------------------
# Heuristic Result
# ---------------------------------------------------------------------------

class HeuristicResult(BaseModel):
    """Aggregated result of all heuristic rules."""

    risk_score: int = Field(..., ge=0, le=100)
    risk_level: Literal["low", "medium", "high"]
    findings: list[Finding]
    url_components: URLComponents
    summary: str
    disclaimer: str


# ---------------------------------------------------------------------------
# VirusTotal Result
# ---------------------------------------------------------------------------

class VirusTotalResult(BaseModel):
    """Result from the optional VirusTotal lookup."""

    available: bool
    positives: int | None = None
    total: int | None = None
    scan_date: str | None = None
    permalink: str | None = None
    error: str | None = None
    privacy_notice: str = Field(
        default=(
            "When VirusTotal scanning is enabled, the submitted URL is sent to "
            "the VirusTotal service (virustotal.com) for analysis. This means the "
            "URL will be visible to VirusTotal and potentially shared with their "
            "partners. Do not submit URLs that contain sensitive tokens, passwords, "
            "or personally identifiable information."
        ),
    )


# ---------------------------------------------------------------------------
# Scan Response
# ---------------------------------------------------------------------------

class ScanResponse(BaseModel):
    """Full response returned by the /api/scan endpoint."""

    url: str
    scan_timestamp: str = Field(..., description="ISO 8601 timestamp of the scan.")
    heuristic: HeuristicResult
    virustotal: VirusTotalResult | None = None


# ---------------------------------------------------------------------------
# Error
# ---------------------------------------------------------------------------

class ErrorResponse(BaseModel):
    """Standard error envelope."""

    detail: str
