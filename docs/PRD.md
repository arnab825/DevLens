# DevLens - Product Requirements Document (PRD)

## 1. Executive Summary
**DevLens** is a developer-centric, privacy-first Chromium browser extension paired with an optional local Python analysis backend. It eliminates context-switching during web application debugging by detecting runtime JavaScript errors, inspecting network and API failures, parsing multi-language stack traces, and assessing public GitHub repository health directly in the browser.

## 2. Problem Statement
Web developers lose significant development velocity juggling between Chrome DevTools, terminal logs, Postman, API documentation, and public search. Existing tools:
- Present cryptic runtime errors without actionable remediation hints.
- Expose sensitive authorization tokens and cookies when logging or sharing diagnostics.
- Require heavy third-party SaaS accounts or cloud AI subscriptions for basic diagnostic triage.

## 3. Goals & Success Metrics
- **Zero Cloud Reliance**: 100% functional locally with rule-based heuristics; no paid AI API required.
- **Privacy by Default**: Automatic redaction of credentials, cookies, Bearer tokens, and sensitive headers before display or local logging.
- **Sub-100ms Triage**: Immediate explanation and suggested fixes for common runtime errors (e.g., `TypeError: Cannot read properties of undefined`).
- **One-Click Extension Loading**: Zero build pipeline required to load the extension during development; straight unpack-and-run in Chrome/Edge/Brave.

## 4. User Personas
1. **Frontend Engineers**: Diagnosing unhandled exceptions, promise rejections, and component render failures.
2. **Full-Stack / Backend Engineers**: Debugging CORS mismatches, 4xx/5xx API contract failures, and stack traces.
3. **Open-Source Contributors**: Rapidly auditing public GitHub repositories for documentation, setup readiness, and CI/CD workflows.

## 5. Feature Requirements (MVP Scope)
| ID | Feature | Description | Priority |
| :--- | :--- | :--- | :--- |
| **PRD-01** | **Console Error Detector** | Intercept `window.onerror` and `unhandledrejection`, extracting error message, source file, line/column, and occurrence count. | P0 |
| **PRD-02** | **Network & API Inspector** | Capture HTTP method, status code, response time, endpoint, and categorizes failures (CORS, 401, 403, 404, 500) with automatic credential masking. | P0 |
| **PRD-03** | **Rule-Based Error Analysis** | Local Python engine correlates error patterns with known root causes and provides step-by-step verification suggestions. | P0 |
| **PRD-04** | **Stack Trace Parser** | Parse raw JavaScript and Python stack traces into structured caller frames (file, line, function, class). | P1 |
| **PRD-05** | **GitHub Repository Analyzer** | Inspect public GitHub repositories for documentation completeness, configuration files (`.env.example`), and CI workflows. | P1 |
| **PRD-06** | **Diagnostic Report Generator** | Export current session diagnostics as Markdown or structured JSON for bug reporting. | P1 |
| **PRD-07** | **Offline Fallback** | Extension gracefully falls back to in-browser rule analysis if local Python backend is not running. | P0 |

## 6. Out of Scope (Non-Goals)
- No user accounts, logins, telemetry, or remote telemetry servers.
- No cloud AI subscription dependencies.
- No automated remote code modification or monkey-patching production apps.
