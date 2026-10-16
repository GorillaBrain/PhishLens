# Security Design — PhishLens

This document describes the security architecture, threat model, and design decisions for PhishLens. It is intended for contributors, code reviewers, and anyone evaluating the project's security posture.

---

## Table of Contents

- [Overview](#overview)
- [Threat Model](#threat-model)
- [SSRF Prevention](#ssrf-prevention)
- [Input Validation](#input-validation)
- [Secret Management](#secret-management)
- [Rate Limiting](#rate-limiting)
- [CORS Configuration](#cors-configuration)
- [Privacy & Data Handling](#privacy--data-handling)
- [Content Security](#content-security)
- [Dependency Security](#dependency-security)
- [Limitations & Non-Goals](#limitations--non-goals)
- [Reporting Vulnerabilities](#reporting-vulnerabilities)

---

## Overview

PhishLens is a **URL analysis tool** — it inspects URL strings for phishing indicators using rule-based heuristics. It is designed to be safe by default: the backend never fetches, opens, or renders user-provided URLs. All analysis is performed on the URL string itself.

### Security Principles

1. **Minimal attack surface** — The backend exposes only two endpoints (`/api/scan` and `/health`)
2. **No outbound requests to user input** — The server never makes HTTP requests to URLs submitted by users
3. **Defense in depth** — Multiple layers (validation, rate limiting, CORS) work together
4. **Fail safe** — If analysis encounters an error, the response indicates uncertainty rather than declaring a URL safe
5. **Transparency** — All detection rules are visible and explainable to the user

---

## Threat Model

### What PhishLens Defends Against

| Threat | Mitigation |
|--------|------------|
| **Abuse as a scanning service** | Rate limiting (per-IP, configurable window) |
| **Malformed/oversized input** | URL validation, length limits (2048 chars) |
| **SSRF via URL submission** | Backend never fetches user-provided URLs |
| **XSS via URL display** | React's default escaping; URLs are rendered as text, never as clickable links or iframes |
| **API key exposure** | Keys stored in environment variables, never sent to the frontend |
| **CORS abuse** | Strict origin allowlist; no wildcard in production |
| **Denial of service** | Rate limiting, input size limits, no expensive I/O per request |

### What PhishLens Does NOT Defend Against

| Non-Goal | Rationale |
|----------|-----------|
| **DDoS at the infrastructure level** | Delegated to hosting provider (Vercel, Cloudflare, etc.) |
| **Compromised hosting environment** | Out of scope — standard infrastructure security applies |
| **Sophisticated evasion of heuristic rules** | Acknowledged limitation; heuristic analysis has inherent blind spots |
| **Browser-level attacks** | The frontend does not open or render scanned URLs |
| **Authenticated user management** | PhishLens has no user accounts or authentication |

---

## SSRF Prevention

**Server-Side Request Forgery (SSRF)** is the most critical threat for any URL analysis service. PhishLens mitigates this by design:

> **The backend never makes HTTP requests to user-provided URLs.**

All analysis is performed by parsing the URL string using Python's `urllib.parse` module and applying pattern-matching rules. The only outbound HTTP request the backend ever makes is to the **VirusTotal API** (`https://www.virustotal.com/api/v3/urls`), and only when:

1. A VirusTotal API key is configured in environment variables
2. The user submits a scan request
3. The URL hash (not the raw URL) is sent to VirusTotal for reputation lookup

This means even the VirusTotal integration does not cause the backend to fetch the user's URL — it sends a URL identifier to a known, trusted API endpoint.

### Why This Matters

Many URL scanners fetch the target URL to inspect its content, follow redirects, or take screenshots. Each of these actions creates SSRF risk — an attacker could submit `http://169.254.169.254/latest/meta-data/` to probe cloud metadata services, or `http://localhost:8080/admin` to access internal services. PhishLens avoids this entire class of vulnerability by never making such requests.

---

## Input Validation

All user input passes through validation before analysis:

### URL Validation Rules

| Check | Limit | Rationale |
|-------|-------|-----------|
| **Maximum length** | 2,048 characters | Prevents memory abuse and aligns with browser URL limits |
| **Required scheme** | `http://` or `https://` (auto-prepended if missing) | Ensures parseable URL; blocks `javascript:`, `file:`, etc. |
| **Parseable structure** | Must parse via `urllib.parse.urlparse` | Rejects malformed strings |
| **Non-empty hostname** | Must have a hostname component | Rejects scheme-only input |

### What Happens on Invalid Input

- The API returns a `422 Unprocessable Entity` response with a descriptive error message
- No analysis is performed
- The request is still counted toward rate limits (prevents validation bypass as a DoS vector)

---

## Secret Management

PhishLens uses exactly one secret: the **VirusTotal API key** (optional).

### Storage

- Stored in environment variables (`VIRUSTOTAL_API_KEY`)
- Loaded via `os.environ.get()` at application startup
- **Never** committed to version control (`.env` is in `.gitignore`)
- **Never** sent to the frontend or included in API responses
- Template provided in `.env.example` with empty values

### In Production (Vercel)

- Set via Vercel's encrypted environment variables dashboard
- Encrypted at rest
- Available only to serverless functions at runtime

### Key Rotation

If a VirusTotal API key is compromised:
1. Revoke the key in the VirusTotal dashboard
2. Generate a new key
3. Update the environment variable in production
4. No code changes required

---

## Rate Limiting

PhishLens implements **in-memory, per-IP rate limiting** using a sliding window algorithm.

### Default Configuration

| Parameter | Default | Environment Variable |
|-----------|---------|---------------------|
| Max requests per window | 30 | `RATE_LIMIT_MAX_REQUESTS` |
| Window duration | 60 seconds | `RATE_LIMIT_WINDOW_SECONDS` |

### Behavior

- Each client IP gets an independent request counter
- When the limit is exceeded, the API returns `429 Too Many Requests` with a `Retry-After` header
- Expired entries are periodically cleaned up to prevent memory growth
- Rate limiting applies to all endpoints, including invalid requests

### Limitations

- **In-memory only**: Rate limit state is not shared across multiple serverless function instances (relevant for Vercel deployments). Each cold start begins with a fresh counter.
- **IP-based**: Clients behind shared NATs or proxies may share a rate limit. This is an acceptable trade-off for a free educational tool.
- **Not a DDoS defense**: For volumetric attacks, rely on infrastructure-level protections (Vercel's edge network, Cloudflare, etc.).

---

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured to restrict which origins can call the API.

### Development

```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Production

```
CORS_ORIGINS=https://your-app.vercel.app
```

### Rules

- **No wildcard (`*`) in production** — Only explicitly listed origins are allowed
- Configured via the `CORS_ORIGINS` environment variable (comma-separated)
- Credentials are not required (no cookies or auth headers)
- Preflight (`OPTIONS`) requests are handled automatically by FastAPI's CORS middleware

---

## Privacy & Data Handling

PhishLens is designed to minimize data collection:

### What the Server Does NOT Store

- ❌ Submitted URLs are not written to any database or log file
- ❌ No user identifiers, cookies, or tracking pixels
- ❌ No analytics or telemetry services
- ❌ IP addresses are used only for rate limiting (in-memory, ephemeral)

### What the Server Does Process

- ✅ URLs are held in memory during analysis (typically < 100ms)
- ✅ If VirusTotal is enabled, a SHA-256 hash of the URL is sent to VirusTotal's API
- ✅ Standard HTTP access logs may be recorded by the hosting provider (Vercel, Render, etc.)

### Frontend Data

- Scan history is stored in the browser's `localStorage`
- History never leaves the user's device
- Users can clear history at any time

### VirusTotal Privacy Note

When VirusTotal integration is enabled:
- The URL is submitted to VirusTotal's API for reputation checking
- VirusTotal may store and share submitted URLs per their [Terms of Service](https://support.virustotal.com/hc/en-us/articles/115002145529-Terms-of-Service)
- This is clearly communicated to users in the UI when VirusTotal results are displayed
- If privacy is a concern, the application works fully without a VirusTotal API key

---

## Content Security

### No Rendering of Scanned Content

PhishLens **never** renders, iframes, or fetches the content of scanned URLs:

- The frontend displays URLs as plain text, not as clickable hyperlinks
- No `<iframe>`, `<img>`, `<script>`, or `<link>` tags reference user-provided URLs
- No server-side headless browser or screenshot service is used
- React's JSX escaping prevents injection of HTML through URL display

### Why This Matters

Rendering a malicious URL's content (even in an iframe) can trigger:
- Drive-by downloads
- JavaScript execution in the user's browser
- Cookie theft via cross-site scripting
- Browser exploit kit delivery

By treating URLs as data (strings to analyze) rather than resources (pages to render), PhishLens avoids this entire attack surface.

---

## Dependency Security

### Backend (Python)

- Dependencies are pinned in `requirements.txt`
- Minimal dependency tree: FastAPI, Uvicorn, httpx (for VirusTotal), python-dotenv
- No ORM, no database driver, no template engine — reducing attack surface

### Frontend (React)

- Dependencies managed via `package.json` with lockfile (`package-lock.json`)
- No `dangerouslySetInnerHTML` usage
- React's default escaping prevents XSS in rendered content

### Recommendations for Contributors

- Run `pip audit` (Python) and `npm audit` (Node.js) before submitting PRs
- Keep dependencies updated, especially for security patches
- Prefer well-maintained packages with active security response teams

---

## Limitations & Non-Goals

### Security Limitations

1. **Heuristic-only analysis**: Pattern matching on URL strings cannot detect all phishing attacks. A sophisticated attacker using a clean-looking domain will not be flagged.

2. **No content inspection**: PhishLens does not fetch or analyze the actual web page content, so it cannot detect phishing pages that use legitimate-looking URLs.

3. **No real-time threat feeds**: Beyond optional VirusTotal integration, there is no connection to real-time threat intelligence feeds.

4. **Stateless rate limiting**: In serverless environments, rate limiting resets on cold starts. Determined attackers can bypass this.

5. **No authentication**: Anyone can use the API. There is no API key requirement for scan requests.

### Non-Goals

- PhishLens is **not** a WAF (Web Application Firewall)
- PhishLens is **not** a replacement for browser security features or enterprise security tools
- PhishLens is **not** designed to be embedded as a security gate in production systems
- PhishLens **does not** provide guarantees about URL safety — it provides educational risk indicators

---

## Reporting Vulnerabilities

If you discover a security vulnerability in PhishLens, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the maintainer directly (see GitHub profile for contact information)
3. Include a description of the vulnerability and steps to reproduce
4. Allow reasonable time for a fix before public disclosure

We appreciate responsible disclosure and will credit reporters (with permission) in release notes.
