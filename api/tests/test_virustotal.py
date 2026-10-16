"""
VirusTotal integration tests for PhishLens.

All tests mock the httpx client to avoid real network calls.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
import pytest_asyncio

from api.models import VirusTotalResult
from api.virustotal import check_url


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_response(status_code: int = 200, json_data: dict | None = None):
    """Create a fake httpx.Response."""
    resp = MagicMock(spec=httpx.Response)
    resp.status_code = status_code
    resp.json.return_value = json_data or {}
    resp.raise_for_status = MagicMock()
    if status_code >= 400:
        resp.raise_for_status.side_effect = httpx.HTTPStatusError(
            message=f"HTTP {status_code}",
            request=MagicMock(),
            response=resp,
        )
    return resp


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestVirusTotalNotConfigured:
    @pytest.mark.asyncio
    async def test_vt_not_configured(self):
        result = await check_url("https://example.com", api_key=None)
        assert result.available is False
        assert "not configured" in (result.error or "").lower()
        assert len(result.privacy_notice) > 0

    @pytest.mark.asyncio
    async def test_vt_empty_key(self):
        result = await check_url("https://example.com", api_key="")
        assert result.available is False


class TestVirusTotalSuccess:
    @pytest.mark.asyncio
    async def test_vt_mock_success(self):
        submit_resp = _mock_response(200, {"data": {"id": "fake-id"}})
        result_resp = _mock_response(200, {
            "data": {
                "attributes": {
                    "last_analysis_stats": {
                        "malicious": 3,
                        "suspicious": 1,
                        "undetected": 60,
                        "harmless": 6,
                    },
                    "last_analysis_date": "2024-01-15 12:00:00",
                },
            },
        })

        mock_client = AsyncMock()
        mock_client.post.return_value = submit_resp
        mock_client.get.return_value = result_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("api.virustotal.httpx.AsyncClient", return_value=mock_client):
            result = await check_url("https://example.com", api_key="fake-key")

        assert result.available is True
        assert result.positives == 4  # 3 malicious + 1 suspicious
        assert result.total == 70
        assert result.permalink is not None


class TestVirusTotalErrors:
    @pytest.mark.asyncio
    async def test_vt_timeout(self):
        mock_client = AsyncMock()
        mock_client.post.side_effect = httpx.TimeoutException("timed out")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("api.virustotal.httpx.AsyncClient", return_value=mock_client):
            result = await check_url("https://example.com", api_key="fake-key")

        assert result.available is False
        assert "timed out" in (result.error or "").lower()

    @pytest.mark.asyncio
    async def test_vt_rate_limit(self):
        rate_resp = _mock_response(429)
        # Override raise_for_status to NOT raise – we check 429 before
        rate_resp.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.post.return_value = rate_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("api.virustotal.httpx.AsyncClient", return_value=mock_client):
            result = await check_url("https://example.com", api_key="fake-key")

        assert result.available is False
        assert "rate limit" in (result.error or "").lower()

    @pytest.mark.asyncio
    async def test_vt_api_error(self):
        error_resp = _mock_response(500)

        mock_client = AsyncMock()
        mock_client.post.return_value = error_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("api.virustotal.httpx.AsyncClient", return_value=mock_client):
            result = await check_url("https://example.com", api_key="fake-key")

        assert result.available is False
        assert "500" in (result.error or "")
