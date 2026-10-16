"""
PhishLens VirusTotal integration.

Provides an async helper that submits a URL to the VirusTotal v3 API and
retrieves scan results.  The module is designed to be *optional* – callers
should gracefully handle a missing API key.
"""

from __future__ import annotations

import base64
import hashlib
import logging
from typing import Optional

import httpx

from .models import VirusTotalResult

logger = logging.getLogger(__name__)

_PRIVACY_NOTICE = (
    "When VirusTotal scanning is enabled, the submitted URL is sent to "
    "the VirusTotal service (virustotal.com) for analysis. This means the "
    "URL will be visible to VirusTotal and potentially shared with their "
    "partners. Do not submit URLs that contain sensitive tokens, passwords, "
    "or personally identifiable information."
)

_VT_BASE = "https://www.virustotal.com/api/v3"
_TIMEOUT = 10.0  # seconds


def _url_id(url: str) -> str:
    """Return the VirusTotal-compatible base64url identifier for *url*.

    VT v3 uses the URL's unpadded base64url encoding as the resource id
    for the ``GET /urls/{id}`` endpoint.
    """
    return base64.urlsafe_b64encode(url.encode()).rstrip(b"=").decode()


async def check_url(url: str, api_key: Optional[str]) -> VirusTotalResult:
    """Submit *url* to VirusTotal and return a structured result.

    Parameters
    ----------
    url:
        The URL to scan.  **Never** logged in full to avoid leaking tokens.
    api_key:
        VirusTotal API key.  If ``None`` or empty the function returns
        immediately with ``available=False``.
    """
    if not api_key:
        return VirusTotalResult(
            available=False,
            error="VirusTotal API key not configured",
            privacy_notice=_PRIVACY_NOTICE,
        )

    headers = {"x-apikey": api_key}

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            # Step 1 – submit URL for scanning
            submit_resp = await client.post(
                f"{_VT_BASE}/urls",
                headers=headers,
                data={"url": url},
            )

            if submit_resp.status_code == 429:
                return VirusTotalResult(
                    available=False,
                    error=(
                        "VirusTotal rate limit exceeded. The free tier allows "
                        "4 requests per minute."
                    ),
                    privacy_notice=_PRIVACY_NOTICE,
                )

            submit_resp.raise_for_status()

            # Step 2 – retrieve results using the URL identifier
            url_id = _url_id(url)
            result_resp = await client.get(
                f"{_VT_BASE}/urls/{url_id}",
                headers=headers,
            )

            if result_resp.status_code == 429:
                return VirusTotalResult(
                    available=False,
                    error="VirusTotal rate limit exceeded.",
                    privacy_notice=_PRIVACY_NOTICE,
                )

            result_resp.raise_for_status()

            data = result_resp.json().get("data", {})
            attrs = data.get("attributes", {})
            stats = attrs.get("last_analysis_stats", {})
            positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
            total = sum(stats.values()) if stats else None

            return VirusTotalResult(
                available=True,
                positives=positives,
                total=total,
                scan_date=attrs.get("last_analysis_date", None)
                    if isinstance(attrs.get("last_analysis_date"), str)
                    else str(attrs.get("last_analysis_date", "")),
                permalink=f"https://www.virustotal.com/gui/url/{url_id}",
                privacy_notice=_PRIVACY_NOTICE,
            )

    except httpx.TimeoutException:
        logger.warning("VirusTotal request timed out")
        return VirusTotalResult(
            available=False,
            error="Request to VirusTotal timed out.",
            privacy_notice=_PRIVACY_NOTICE,
        )
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        logger.warning("VirusTotal HTTP error: %s", status)
        return VirusTotalResult(
            available=False,
            error=f"VirusTotal returned HTTP {status}.",
            privacy_notice=_PRIVACY_NOTICE,
        )
    except httpx.HTTPError as exc:
        logger.warning("VirusTotal network error: %s", type(exc).__name__)
        return VirusTotalResult(
            available=False,
            error="Network error contacting VirusTotal.",
            privacy_notice=_PRIVACY_NOTICE,
        )
