# Security Policy

## Supported Versions

We release patches and bug fixes for the current and recent active versions of DevLens.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

---

## 🔒 Privacy & Local-First Architecture

DevLens is built on strict **privacy-first** principles:
- **Zero External Telemetry**: DevLens never transmits your browsing history, DOM content, or code snippets to any external third-party or cloud server.
- **Local Loopback Only**: Any server-side analysis communicates strictly over local loopback (`http://127.0.0.1:8000`).
- **Token Sanitization**: Authentication headers (`Authorization: Bearer ...`, `Cookie`, `X-API-Key`) and sensitive parameter keys are stripped or masked before storage or display.

---

## Reporting a Vulnerability

We take the security and privacy of our users seriously. If you discover a security vulnerability or potential privacy leak in DevLens, please report it responsibly:

### How to Report
1. **Do NOT open a public GitHub issue** for sensitive vulnerabilities or credential exposures.
2. Please submit your findings privately via:
   - **GitHub Private Vulnerability Reporting**: Navigate to the [Security Advisories tab](https://github.com/arnab825/DevLens/security/advisories/new) of this repository.
   - **Email**: Send a detailed report to `arnabroy.dev@gmail.com` (or project maintainer contact).

### What to Include in Your Report
Please provide:
- A clear description of the vulnerability.
- Step-by-step reproduction steps or a minimal proof of concept (PoC).
- Potential impact (e.g. data exposure, injection, bypass).
- Browser version and OS on which the issue was reproduced.

### Our Commitment
- We will acknowledge receipt of your vulnerability report within **48 hours**.
- We will provide a timeline for triage and resolution.
- We will credit you appropriately in our release notes and advisory once the patch is published (unless you request anonymity).
