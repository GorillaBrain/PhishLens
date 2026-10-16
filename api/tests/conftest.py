"""
Shared pytest fixtures for PhishLens API tests.
"""

from __future__ import annotations

import os
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client():
    """Create a FastAPI TestClient with VirusTotal disabled."""
    # Ensure VT key is absent so tests don't call the real API
    with patch.dict(os.environ, {}, clear=False):
        with patch("api.config.VIRUSTOTAL_API_KEY", None):
            from api.main import app
            with TestClient(app) as c:
                yield c


@pytest.fixture()
def client_with_vt():
    """Create a FastAPI TestClient with a fake VirusTotal API key."""
    with patch("api.config.VIRUSTOTAL_API_KEY", "test-api-key-fake"):
        from api.main import app
        with TestClient(app) as c:
            yield c


@pytest.fixture()
def mock_env_no_vt():
    """Ensure VIRUSTOTAL_API_KEY is absent."""
    with patch.dict(os.environ, {"VIRUSTOTAL_API_KEY": ""}, clear=False):
        yield
