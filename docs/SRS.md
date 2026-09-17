# DevLens - Software Requirements Specification (SRS)

## 1. Introduction
### 1.1 Purpose
This document specifies the software requirements for DevLens v0.1-v1.0, covering both the client-side Chromium Browser Extension and the local Python FastAPI Analysis Platform.

### 1.2 System Overview
DevLens functions in a decentralized local-first architecture. The client-side extension captures runtime diagnostics inside the active browser tab context and communicates via standard HTTP `fetch` to `http://127.0.0.1:8000`.

---

## 2. External Interface Requirements

### 2.1 User Interfaces
- **Extension Action Popup (`popup.html`)**:
  - Dimensions: 440px wide × 580px high max.
  - Header: Application brand, backend connectivity pill indicator (`Online` / `Offline`).
  - Navigation Tabs: `Console Errors`, `Network/API`, `Stack Trace`, `GitHub`, `Report`.
  - Action Triggers: One-click "Analyze Error", "Export Report", "Clear Session".

### 2.2 Hardware & OS Interfaces
- Operating System: Windows 10/11, macOS, or Linux.
- Memory: < 50MB RAM for extension; < 60MB RAM for backend process.

### 2.3 Software Interfaces
- **Browser**: Chromium 114+ (Google Chrome, Microsoft Edge, Brave, Opera) supporting Manifest V3.
- **Python**: Python 3.10+ (tested on Python 3.14).
- **GitHub REST API v3**: Public repository endpoint (`https://api.github.com/repos/{owner}/{repo}`).

---

## 3. System Features & Functional Requirements

### 3.1 Console Error Monitoring (SRS-F01)
- **F01.1**: Content script shall attach listeners to `window.error` and `window.unhandledrejection`.
- **F01.2**: Intercepted errors shall extract `message`, `filename`, `lineno`, `colno`, and `stack`.
- **F01.3**: Duplicate errors on the same page shall increment an occurrence counter rather than spamming the UI.
- **F01.4**: Events shall be dispatched to `chrome.storage.local` and background service worker.

### 3.2 Network Request Inspection (SRS-F02)
- **F02.1**: Monitor outgoing asynchronous requests (`fetch` and `XMLHttpRequest` wraps or declarative events).
- **F02.2**: Capture HTTP Method, Destination URL, HTTP Status Code, Duration (ms), and Response MIME type.
- **F02.3**: Mandatory Sanitization: Headers `Authorization`, `Cookie`, `Set-Cookie`, and query params named `token`, `secret`, `key`, `password` shall be masked with `********` before serialization.

### 3.3 Backend Diagnostic Analysis Engine (SRS-F03)
- **F03.1**: Endpoint `POST /api/analyze/error` shall parse error signatures into categorization buckets:
  - `NullPointer / UndefinedAccess` (e.g., "Cannot read properties of undefined")
  - `ReferenceFailure` (e.g., "is not defined")
  - `SyntaxFailure` (e.g., "Unexpected token")
  - `Network / CORS Failure` (e.g., "Failed to fetch", "Cross-Origin Request Blocked")
- **F03.2**: Response payload shall include:
  - `type`: String category name.
  - `summary`: Plain-English explanation without jargon.
  - `possible_causes`: Array of 2-3 most common causes.
  - `suggested_checks`: Step-by-step developer remediation actions.

### 3.4 Stack Trace Parsing (SRS-F04)
- **F04.1**: Endpoint `POST /api/analyze/stacktrace` shall accept multi-line raw traces.
- **F04.2**: JavaScript / V8 parser shall extract stack frames with `callsite`, `file`, `line`, and `column`.
- **F04.3**: Python parser shall extract `Traceback`, file references, code line context, and final exception type.

### 3.5 GitHub Repository Health Inspector (SRS-F05)
- **F05.1**: Endpoint `POST /api/github/analyze` shall accept repository URL or `owner/repo` string.
- **F05.2**: Evaluates key repository signals:
  - Documentation presence (`README.md`, `LICENSE`, `CONTRIBUTING.md`).
  - Configuration readiness (`.gitignore`, `.env.example`, `Dockerfile`).
  - Test harness detection (`tests/`, `__tests__/`, `pytest.ini`).
  - CI/CD automation (`.github/workflows`).
- **F05.3**: Computes transparent category scores (0-100%) and explicit checklist of detected vs. missing items.

### 3.6 Report Generation (SRS-F06)
- **F06.1**: Endpoint `POST /api/reports` and extension client-side export shall format active tab diagnostics into:
  - GFM (GitHub-Flavored Markdown)
  - Structured JSON format.

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Extension background message passing overhead < 5ms.
- Backend rule-based analysis response latency < 20ms on `127.0.0.1`.

### 4.2 Security & Data Privacy
- Zero telemetry transmission to external cloud services.
- Data retention is limited to local memory or local SQLite file under user control.
- Strict sanitization regex applied at the content-script boundary before sending to background or backend.

### 4.3 Reliability & Fault Tolerance
- If the Python backend process is stopped, the extension remains completely responsive, displaying cached errors and providing client-side fallback guidance.
