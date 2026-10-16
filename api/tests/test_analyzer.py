"""
Comprehensive tests for the PhishLens URL analysis engine.
"""

from __future__ import annotations

import pytest

from api.analyzer import analyze_url, extract_url_components


# ---------------------------------------------------------------------------
# Safe / Legitimate URLs
# ---------------------------------------------------------------------------

class TestSafeUrls:
    """URLs that should score LOW risk."""

    def test_safe_https_url(self):
        result = analyze_url("https://www.google.com")
        assert result.risk_level == "low"
        assert result.risk_score <= 30

    def test_safe_url_with_path(self):
        result = analyze_url("https://github.com/user/repo")
        assert result.risk_level == "low"
        assert result.risk_score <= 30

    def test_legitimate_microsoft_url(self):
        result = analyze_url("https://www.microsoft.com/en-us/software")
        assert result.risk_level == "low"
        assert result.risk_score <= 30

    def test_wikipedia_url(self):
        result = analyze_url("https://en.wikipedia.org/wiki/Phishing")
        assert result.risk_level == "low"
        assert result.risk_score <= 30

    def test_legitimate_complex_url(self):
        """A long Amazon product URL should not score high just because of
        length."""
        url = (
            "https://www.amazon.com/dp/B09V3KXJPB/ref=cm_sw_r_cp_api_i_"
            "dl_XXYYZZAABBCC?encoding=UTF8&psc=1"
        )
        result = analyze_url(url)
        # May pick up length or path signals, but should stay below "high"
        assert result.risk_level in ("low", "medium")
        assert result.risk_score < 61


# ---------------------------------------------------------------------------
# Individual Rule Triggers
# ---------------------------------------------------------------------------

class TestHttpScheme:
    def test_http_url(self):
        result = analyze_url("http://example.com")
        findings_ids = {f.id for f in result.findings}
        assert "http_scheme" in findings_ids
        # HTTP alone isn't high risk
        assert result.risk_level in ("low", "medium")


class TestIpAddress:
    def test_ip_address_url(self):
        result = analyze_url("http://192.168.1.1/login")
        findings_ids = {f.id for f in result.findings}
        assert "ip_address" in findings_ids

    def test_ipv6_url(self):
        result = analyze_url("http://[::1]/admin")
        findings_ids = {f.id for f in result.findings}
        assert "ip_address" in findings_ids


class TestUrlShortener:
    def test_url_shortener(self):
        result = analyze_url("https://bit.ly/3xYz123")
        findings_ids = {f.id for f in result.findings}
        assert "url_shortener" in findings_ids


class TestAtSymbol:
    def test_at_symbol(self):
        result = analyze_url("http://example.com@evil.com")
        findings_ids = {f.id for f in result.findings}
        assert "at_symbol" in findings_ids


class TestSubdomainDepth:
    def test_excessive_subdomains(self):
        result = analyze_url("https://a.b.c.d.e.example.com")
        findings_ids = {f.id for f in result.findings}
        assert "subdomain_depth" in findings_ids


class TestBrandImpersonation:
    def test_brand_impersonation_subdomain(self):
        """Brand keyword in subdomain but NOT as registered domain."""
        result = analyze_url("https://google.login.evil.com")
        findings_ids = {f.id for f in result.findings}
        assert "brand_impersonation" in findings_ids

    def test_brand_impersonation_in_path(self):
        result = analyze_url("https://evil.com/google/login")
        findings_ids = {f.id for f in result.findings}
        assert "brand_impersonation" in findings_ids

    def test_no_brand_impersonation_on_real_domain(self):
        """google.com itself should NOT be flagged for brand impersonation."""
        result = analyze_url("https://www.google.com/search?q=test")
        findings_ids = {f.id for f in result.findings}
        assert "brand_impersonation" not in findings_ids


class TestSuspiciousTld:
    def test_suspicious_tld(self):
        result = analyze_url("https://example.tk")
        findings_ids = {f.id for f in result.findings}
        assert "suspicious_tld" in findings_ids


class TestUrlLength:
    def test_long_url(self):
        url = "https://example.com/" + "a" * 200
        result = analyze_url(url)
        findings_ids = {f.id for f in result.findings}
        assert "url_length" in findings_ids


class TestSuspiciousPath:
    def test_suspicious_path_login(self):
        result = analyze_url("https://example.com/login/verify")
        findings_ids = {f.id for f in result.findings}
        assert "suspicious_path" in findings_ids


class TestPunycode:
    def test_punycode_domain(self):
        result = analyze_url("https://xn--80ak6aa92e.com/index")
        findings_ids = {f.id for f in result.findings}
        assert "punycode" in findings_ids


class TestSuspiciousChars:
    def test_encoded_characters(self):
        result = analyze_url("https://example.com/%00%0d%0a/test")
        findings_ids = {f.id for f in result.findings}
        assert "suspicious_chars" in findings_ids


class TestDataUri:
    def test_data_uri(self):
        result = analyze_url("data:text/html,<h1>Phishing</h1>")
        findings_ids = {f.id for f in result.findings}
        assert "data_uri" in findings_ids


class TestNonstandardPort:
    def test_nonstandard_port(self):
        result = analyze_url("https://example.com:8080/path")
        findings_ids = {f.id for f in result.findings}
        assert "nonstandard_port" in findings_ids


class TestDoubleSlash:
    def test_double_slash_redirect(self):
        result = analyze_url("https://example.com//evil.com/path")
        findings_ids = {f.id for f in result.findings}
        assert "double_slash_redirect" in findings_ids


# ---------------------------------------------------------------------------
# Edge Cases & Scoring
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_empty_url_handling(self):
        """Empty string should not crash; it may score low."""
        result = analyze_url("")
        assert result.risk_score >= 0

    def test_malformed_url_handling(self):
        """Malformed URLs should not crash the analyser."""
        result = analyze_url("not-a-url-at-all")
        assert result.risk_score >= 0

    def test_score_capped_at_100(self):
        """Even a URL with many indicators should not exceed 100."""
        url = (
            "http://192.168.1.1:9999@evil.com/"
            "login/verify/secure/account/"
            "%00%0d%0a/"
            "google-paypal-amazon/"
            + "a" * 200
        )
        result = analyze_url(url)
        assert result.risk_score <= 100

    def test_combined_indicators(self):
        """A URL with multiple suspicious features should compound."""
        url = "http://google.login.evil.tk:8080/verify/account"
        result = analyze_url(url)
        assert result.risk_score > 30
        assert len(result.findings) >= 3


# ---------------------------------------------------------------------------
# URL Components Extraction
# ---------------------------------------------------------------------------

class TestUrlComponents:
    def test_url_components_extraction(self):
        components = extract_url_components(
            "https://www.example.com:443/path/to/page?q=1#section"
        )
        assert components.scheme == "https"
        assert components.hostname == "www.example.com"
        assert components.port == 443
        assert components.path == "/path/to/page"
        assert components.query_present is True
        assert components.fragment_present is True

    def test_url_components_minimal(self):
        components = extract_url_components("https://example.com")
        assert components.scheme == "https"
        assert components.hostname == "example.com"
        assert components.port is None
        assert components.query_present is False
        assert components.fragment_present is False


# ---------------------------------------------------------------------------
# Disclaimer & Summary
# ---------------------------------------------------------------------------

class TestOutputFields:
    def test_disclaimer_present(self):
        result = analyze_url("https://www.google.com")
        assert "heuristic" in result.disclaimer.lower() or "cannot" in result.disclaimer.lower()
        assert len(result.disclaimer) > 20

    def test_summary_present(self):
        result = analyze_url("http://evil.tk/login")
        assert len(result.summary) > 10
