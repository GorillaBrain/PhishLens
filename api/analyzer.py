"""
PhishLens URL Analysis Engine.

A transparent, rule-based heuristic analyser that inspects URL *structure*
to estimate phishing risk.  It never fetches or renders the target page.

Every rule is a standalone function that receives parsed URL components and
returns an optional ``Finding``.  Scores from all triggered rules are summed
and capped at 100.
"""

from __future__ import annotations

import ipaddress
import re
import string
from typing import Optional
from urllib.parse import unquote, urlparse

from .models import Finding, HeuristicResult, URLComponents

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SUSPICIOUS_TLDS: set[str] = {
    ".tk", ".ml", ".ga", ".cf", ".gq",
    ".buzz", ".top", ".xyz", ".club", ".work",
    ".date", ".racing", ".win", ".bid", ".stream",
    ".download", ".loan", ".men", ".click", ".link",
    ".trade",
}

URL_SHORTENER_DOMAINS: set[str] = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly",
    "is.gd", "buff.ly", "rebrand.ly", "short.io", "tiny.cc",
    "cutt.ly", "bl.ink", "lnkd.in", "rb.gy",
}

BRAND_KEYWORDS: set[str] = {
    "google", "apple", "microsoft", "amazon", "paypal",
    "netflix", "facebook", "instagram", "twitter", "linkedin",
    "bank", "secure", "account", "login", "verify",
    "update", "confirm",
}

SUSPICIOUS_PATH_SEGMENTS: set[str] = {
    "login", "signin", "verify", "secure", "account",
    "update", "confirm", "banking", "credential", "password",
    "wallet",
}

# Characters in the range %00–%1F and %7F (C0 controls + DEL) are suspicious
# when present in a URL.
_CONTROL_CHAR_RE = re.compile(r"%(?:0[0-9a-fA-F]|1[0-9a-fA-F]|7[fF])")

# Detect potential double-encoding, e.g. %252F (%25 = literal %)
_DOUBLE_ENCODE_RE = re.compile(r"%25[0-9a-fA-F]{2}")

# Homograph / confusable character ranges (subset – Latin look-alikes from
# Cyrillic, Greek, etc.)
_HOMOGRAPH_RE = re.compile(
    r"[\u0400-\u04FF"   # Cyrillic
    r"\u0370-\u03FF"    # Greek
    r"\u0250-\u02AF"    # IPA Extensions
    r"\u1D00-\u1D7F"    # Phonetic Extensions
    r"\u1E00-\u1EFF"    # Latin Extended Additional
    r"\uFF00-\uFFEF]",  # Fullwidth forms
)


# ---------------------------------------------------------------------------
# Helper: extract URL components
# ---------------------------------------------------------------------------

def extract_url_components(url: str) -> URLComponents:
    """Parse a URL string into its structural components."""
    parsed = urlparse(url)
    return URLComponents(
        scheme=parsed.scheme or "",
        hostname=parsed.hostname or "",
        port=parsed.port,
        path=parsed.path or "/",
        query_present=bool(parsed.query),
        fragment_present=bool(parsed.fragment),
    )


# ---------------------------------------------------------------------------
# Helper: extract registered domain (simple heuristic)
# ---------------------------------------------------------------------------

def _registered_domain(hostname: str) -> str:
    """Return the last two labels of a hostname as a rough registered domain.

    For example ``"sub.example.co.uk"`` ➜ ``"co.uk"`` – good enough for
    brand-impersonation checks where we just need to know if a brand keyword
    sits in the registrable part or in a subdomain / path.
    """
    parts = hostname.rstrip(".").split(".")
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return hostname


def _is_ip_address(hostname: str) -> bool:
    """Return True if *hostname* is an IPv4 or IPv6 literal."""
    # Strip brackets that urlparse keeps for IPv6
    clean = hostname.strip("[]")
    try:
        ipaddress.ip_address(clean)
        return True
    except ValueError:
        return False


# ---------------------------------------------------------------------------
# Individual rules
# ---------------------------------------------------------------------------

def scheme_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag HTTP (non-encrypted) URLs."""
    if parsed.scheme == "http":
        return Finding(
            id="http_scheme",
            title="Insecure HTTP connection",
            description=(
                "This URL uses plain HTTP instead of HTTPS. Data sent to this "
                "site could be intercepted. Note: HTTPS alone does not guarantee "
                "a site is trustworthy."
            ),
            severity="medium",
            score_impact=15,
        )
    return None


def ip_address_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag URLs that use a raw IP address instead of a domain name."""
    if hostname and _is_ip_address(hostname):
        return Finding(
            id="ip_address",
            title="IP address used instead of domain name",
            description=(
                "The URL targets a raw IP address rather than a human-readable "
                "domain. Legitimate services almost always use domain names."
            ),
            severity="high",
            score_impact=25,
        )
    return None


def suspicious_tld_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag TLDs that are disproportionately abused in phishing campaigns."""
    if not hostname or _is_ip_address(hostname):
        return None
    parts = hostname.rstrip(".").split(".")
    if len(parts) >= 2:
        tld = "." + parts[-1].lower()
        if tld in SUSPICIOUS_TLDS:
            return Finding(
                id="suspicious_tld",
                title=f"Frequently-abused TLD ({tld})",
                description=(
                    f"The domain uses the '{tld}' top-level domain which is "
                    "statistically overrepresented in phishing campaigns. "
                    "Many legitimate sites also use these TLDs, so this is a "
                    "weak signal on its own."
                ),
                severity="low",
                score_impact=8,
            )
    return None


def url_length_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag excessively long URLs."""
    length = len(url)
    if length > 150:
        return Finding(
            id="url_length",
            title="Extremely long URL",
            description=(
                f"This URL is {length} characters long. Very long URLs are "
                "sometimes used to hide suspicious content from the user. "
                "However, long URLs are not inherently malicious."
            ),
            severity="medium",
            score_impact=15,
        )
    if length > 100:
        return Finding(
            id="url_length",
            title="Very long URL",
            description=(
                f"This URL is {length} characters long. Moderately long URLs "
                "can be used to obscure malicious paths or parameters."
            ),
            severity="medium",
            score_impact=10,
        )
    if length > 75:
        return Finding(
            id="url_length",
            title="Somewhat long URL",
            description=(
                f"This URL is {length} characters long, which is longer than "
                "typical. This alone is a very weak indicator."
            ),
            severity="low",
            score_impact=5,
        )
    return None


def subdomain_depth_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag domains with more than 3 subdomain levels."""
    if not hostname or _is_ip_address(hostname):
        return None
    parts = hostname.rstrip(".").split(".")
    # subdomain depth = total labels minus 2 (registered domain + TLD)
    depth = max(0, len(parts) - 2)
    if depth > 3:
        return Finding(
            id="subdomain_depth",
            title=f"Excessive subdomain depth ({depth} levels)",
            description=(
                "The domain has an unusually deep subdomain hierarchy, which "
                "can be used to impersonate a legitimate site (e.g. "
                "login.secure.bank.evil.com)."
            ),
            severity="medium",
            score_impact=15,
        )
    return None


def at_symbol_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag URLs containing an @ symbol, which can redirect to a different domain."""
    if "@" in url:
        return Finding(
            id="at_symbol",
            title="@ symbol in URL",
            description=(
                "The URL contains an '@' character. In many browsers, "
                "everything before the '@' is treated as credentials, and the "
                "real destination is after it. This is a classic phishing trick."
            ),
            severity="high",
            score_impact=20,
        )
    return None


def url_shortener_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag known URL shortener services that obscure the real destination."""
    if hostname and hostname.lower() in URL_SHORTENER_DOMAINS:
        return Finding(
            id="url_shortener",
            title="URL shortener detected",
            description=(
                f"The domain '{hostname}' is a URL shortening service. "
                "Shortened URLs hide the true destination, which is commonly "
                "exploited in phishing."
            ),
            severity="medium",
            score_impact=15,
        )
    return None


def suspicious_chars_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag control characters, double-encoding, and homograph characters."""
    reasons: list[str] = []

    if _CONTROL_CHAR_RE.search(url):
        reasons.append("encoded control characters (e.g. %00–%1F, %7F)")

    if _DOUBLE_ENCODE_RE.search(url):
        reasons.append("possible double-encoding (e.g. %252F)")

    decoded = unquote(url)
    if _HOMOGRAPH_RE.search(decoded):
        reasons.append("homograph / look-alike Unicode characters")

    if reasons:
        return Finding(
            id="suspicious_chars",
            title="Suspicious characters in URL",
            description=(
                "The URL contains: " + "; ".join(reasons) + ". "
                "These techniques can trick users into visiting a different "
                "site than they expect."
            ),
            severity="medium",
            score_impact=12,
        )
    return None


def brand_impersonation_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag brand names that appear in subdomain/path but NOT as the registrable domain."""
    if not hostname or _is_ip_address(hostname):
        return None

    reg_domain = _registered_domain(hostname).lower()
    # Remove the TLD part from registered domain for comparison
    reg_domain_name = reg_domain.split(".")[0] if "." in reg_domain else reg_domain

    # Check subdomains (everything before the registered domain)
    parts = hostname.rstrip(".").lower().split(".")
    subdomains = ".".join(parts[:-2]) if len(parts) > 2 else ""

    path_lower = (parsed.path or "").lower()

    matched_brands: list[str] = []
    for brand in BRAND_KEYWORDS:
        # Skip if the brand IS the registered domain name
        if brand == reg_domain_name:
            continue
        if brand in subdomains or brand in path_lower:
            matched_brands.append(brand)

    if matched_brands:
        brands_str = ", ".join(sorted(matched_brands))
        return Finding(
            id="brand_impersonation",
            title="Possible brand impersonation",
            description=(
                f"The URL references well-known brand/keyword(s) ({brands_str}) "
                "in the subdomain or path, but the actual registered domain is "
                f"'{reg_domain}'. This is a common phishing technique to build "
                "trust."
            ),
            severity="high",
            score_impact=25,
        )
    return None


def suspicious_path_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag paths containing sensitive-looking segments."""
    path_parts = [
        seg.lower() for seg in (parsed.path or "").split("/") if seg
    ]
    matched = [seg for seg in path_parts if seg in SUSPICIOUS_PATH_SEGMENTS]
    if matched:
        return Finding(
            id="suspicious_path",
            title="Sensitive path segments detected",
            description=(
                "The URL path contains segments associated with credential "
                f"harvesting: {', '.join(matched)}. Combined with other "
                "indicators this raises the risk level."
            ),
            severity="medium",
            score_impact=10,
        )
    return None


def punycode_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag internationalized domain names encoded with Punycode."""
    if hostname and "xn--" in hostname.lower():
        return Finding(
            id="punycode",
            title="Punycode (internationalized) domain",
            description=(
                "The domain contains a Punycode label ('xn--'), indicating an "
                "internationalized domain name (IDN). IDNs can be used for "
                "homograph attacks that mimic legitimate domains."
            ),
            severity="medium",
            score_impact=12,
        )
    return None


def double_slash_redirect_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag double slashes in the path, which may trigger open redirects."""
    path = parsed.path or ""
    if "//" in path:
        return Finding(
            id="double_slash_redirect",
            title="Double slash in URL path",
            description=(
                "The URL path contains '//', which in some server "
                "configurations can trigger an open redirect to a different "
                "domain."
            ),
            severity="low",
            score_impact=8,
        )
    return None


def port_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag non-standard ports."""
    port = parsed.port
    if port is not None and port not in (80, 443):
        return Finding(
            id="nonstandard_port",
            title=f"Non-standard port (:{port})",
            description=(
                f"The URL specifies port {port}, which is not a standard web "
                "port (80/443). Phishing sites sometimes use unusual ports to "
                "evade basic filters."
            ),
            severity="low",
            score_impact=8,
        )
    return None


def data_uri_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag data: URIs, which embed content directly and can deliver phishing pages."""
    if parsed.scheme == "data":
        return Finding(
            id="data_uri",
            title="Data URI detected",
            description=(
                "This is a data: URI that embeds content directly in the URL. "
                "Data URIs can deliver fully functional phishing pages without "
                "a server and bypass domain-based blocklists."
            ),
            severity="critical",
            score_impact=30,
        )
    return None


def excessive_dots_check(parsed, hostname: str, url: str) -> Optional[Finding]:
    """Flag domains with more than 4 dots."""
    if not hostname:
        return None
    dot_count = hostname.count(".")
    if dot_count > 4:
        return Finding(
            id="excessive_dots",
            title=f"Excessive dots in domain ({dot_count})",
            description=(
                "The hostname contains an unusually high number of dots, which "
                "can indicate an attempt to create a confusing, legitimate-looking "
                "domain structure."
            ),
            severity="medium",
            score_impact=10,
        )
    return None


# ---------------------------------------------------------------------------
# Rule registry
# ---------------------------------------------------------------------------

ALL_RULES = [
    scheme_check,
    ip_address_check,
    suspicious_tld_check,
    url_length_check,
    subdomain_depth_check,
    at_symbol_check,
    url_shortener_check,
    suspicious_chars_check,
    brand_impersonation_check,
    suspicious_path_check,
    punycode_check,
    double_slash_redirect_check,
    port_check,
    data_uri_check,
    excessive_dots_check,
]

# ---------------------------------------------------------------------------
# Disclaimer
# ---------------------------------------------------------------------------

DISCLAIMER = (
    "This analysis uses heuristic rules to estimate risk. It cannot definitively "
    "prove a URL is safe or malicious. Always exercise caution and verify URLs "
    "through official channels."
)


# ---------------------------------------------------------------------------
# Summary generation
# ---------------------------------------------------------------------------

def _build_summary(findings: list[Finding], risk_score: int, risk_level: str) -> str:
    """Build a human-readable summary of the analysis."""
    if not findings:
        return (
            "No suspicious indicators were detected. The URL appears "
            "structurally normal, but this does not guarantee it is safe."
        )

    high_sev = [f for f in findings if f.severity in ("high", "critical")]
    med_sev = [f for f in findings if f.severity == "medium"]

    parts: list[str] = [
        f"Risk score: {risk_score}/100 ({risk_level} risk). "
        f"{len(findings)} indicator(s) detected."
    ]

    if high_sev:
        titles = ", ".join(f.title for f in high_sev)
        parts.append(f"High-severity findings: {titles}.")

    if med_sev:
        titles = ", ".join(f.title for f in med_sev)
        parts.append(f"Medium-severity findings: {titles}.")

    return " ".join(parts)


# ---------------------------------------------------------------------------
# Main analysis entry point
# ---------------------------------------------------------------------------

def analyze_url(url: str) -> HeuristicResult:
    """Run all heuristic rules against *url* and return the aggregated result.

    The function only inspects the URL string – it never fetches or renders
    the target resource.
    """
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()

    findings: list[Finding] = []
    for rule_fn in ALL_RULES:
        finding = rule_fn(parsed, hostname, url)
        if finding is not None:
            findings.append(finding)

    raw_score = sum(f.score_impact for f in findings)
    risk_score = min(raw_score, 100)

    if risk_score <= 30:
        risk_level = "low"
    elif risk_score <= 60:
        risk_level = "medium"
    else:
        risk_level = "high"

    components = extract_url_components(url)
    summary = _build_summary(findings, risk_score, risk_level)

    return HeuristicResult(
        risk_score=risk_score,
        risk_level=risk_level,
        findings=findings,
        url_components=components,
        summary=summary,
        disclaimer=DISCLAIMER,
    )
