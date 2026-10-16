"""
API endpoint tests for PhishLens.
"""

from __future__ import annotations

import pytest
from unittest.mock import patch


# ---------------------------------------------------------------------------
# Health & Config
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    def test_health_endpoint(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert "virustotal_configured" in data

    def test_config_endpoint(self, client):
        resp = client.get("/api/config")
        assert resp.status_code == 200
        data = resp.json()
        assert "virustotal_available" in data


# ---------------------------------------------------------------------------
# Scan endpoint – valid requests
# ---------------------------------------------------------------------------

class TestScanEndpoint:
    def test_scan_valid_url(self, client):
        resp = client.post("/api/scan", json={"url": "https://www.google.com"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["url"].startswith("https://www.google.com")
        assert "scan_timestamp" in data
        assert "heuristic" in data
        assert data["heuristic"]["risk_level"] == "low"

    def test_scan_http_url(self, client):
        resp = client.post("/api/scan", json={"url": "http://example.com"})
        assert resp.status_code == 200
        data = resp.json()
        findings_ids = [f["id"] for f in data["heuristic"]["findings"]]
        assert "http_scheme" in findings_ids

    def test_scan_suspicious_url(self, client):
        resp = client.post(
            "/api/scan",
            json={"url": "http://192.168.1.1:8080/login/verify"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["heuristic"]["risk_score"] > 30

    def test_scan_returns_expected_structure(self, client):
        resp = client.post(
            "/api/scan",
            json={"url": "https://example.com"},
        )
        assert resp.status_code == 200
        data = resp.json()
        # Top-level fields
        assert "url" in data
        assert "scan_timestamp" in data
        assert "heuristic" in data
        # Heuristic sub-fields
        h = data["heuristic"]
        assert "risk_score" in h
        assert "risk_level" in h
        assert "findings" in h
        assert "url_components" in h
        assert "summary" in h
        assert "disclaimer" in h
        # URL components
        uc = h["url_components"]
        assert "scheme" in uc
        assert "hostname" in uc


# ---------------------------------------------------------------------------
# Scan endpoint – invalid requests
# ---------------------------------------------------------------------------

class TestScanValidation:
    def test_scan_invalid_url(self, client):
        resp = client.post("/api/scan", json={"url": "not-a-url"})
        assert resp.status_code == 422

    def test_scan_missing_url(self, client):
        resp = client.post("/api/scan", json={})
        assert resp.status_code == 422

    def test_scan_too_long_url(self, client):
        long_url = "https://example.com/" + "a" * 3000
        resp = client.post("/api/scan", json={"url": long_url})
        # Either 422 (pydantic) or 400 (our length guard)
        assert resp.status_code in (400, 422)


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

class TestCors:
    def test_cors_headers(self, client):
        resp = client.options(
            "/api/scan",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert resp.status_code == 200
        assert "access-control-allow-origin" in resp.headers
