# DevLens Changelog

All notable changes to the DevLens platform are documented in this file.

## [v0.1.2] - 2026-09-17

### Fixed & Enhanced
- **Native In-Browser GitHub Health Auditor**:
  - Added `InternalEngine.auditGithubRepo` to `internal_engine.js` so that the **GitHub** tab works completely in Zero-Setup mode without needing the local Python backend running.
  - Added graceful rate-limit handling and production reference benchmarks for high-traffic repositories (like `facebook/react`).
  - Added seamless fallback in `popup/popup.js` so clicking **Audit** switches to the internal engine automatically instead of throwing `Failed to fetch`.
- **Refined Tech Stack Detection**:
  - Eliminated false-positive `React` and `Bootstrap` flags on sites using Web Components / Polymer (such as `youtube.com`).
  - Strict inspection for React DOM hooks and explicit Bootstrap stylesheet bundles.
- **Dynamic Extension Version Synchronization**:
  - Replaced all hardcoded HTML version badges with dynamic runtime retrieval from `chrome.runtime.getManifest().version`.

---

## [v0.1.1] - 2026-09-17

### Added
- **Chrome Developer Tools Panel (`F12`) Integration**:
  - Registered `devtools/devtools.html` and `devtools/devtools.js` via the Manifest V3 `"devtools_page"` API.
  - Added dedicated full-width `DevLens` panel directly inside the browser's native Inspect/DevTools dock (`devtools/panel.html` and `devtools/panel.css`).
  - Added `chrome.devtools.inspectedWindow.eval` support in `popup/popup.js` to automatically scope diagnostics to the currently inspected webpage inside DevTools.
- **Native Client-Side Internal Engine (`internal_engine.js`)**:
  - Implemented 100% self-contained JavaScript diagnostics running directly in the extension runtime.
  - Zero-setup requirement: users do not need Python or `.bat` scripts running to triage JavaScript errors, inspect network anomalies, or parse call stack traces.
  - Seamless hybrid mode: uses local Python FastAPI server if running, otherwise falls back instantly to the native internal browser engine with a glowing `Internal Engine` status pill.
- **Automated CI/CD Release Pipeline**:
  - Added `.github/workflows/release.yml` for automated GitHub Actions release builds on `git push origin v*`.
  - Added `publish_release.py` to automate binary release creation and `.zip` asset uploads via GitHub REST API.
  - Added 1-click Windows release packager `package_release.bat` with automated test validation and version bumping.
- **Auto-Updater & Hot-Reload Engine**:
  - Implemented `chrome.runtime.onUpdateAvailable` in `background/service_worker.js` for instant in-place extension reloads upon production releases.
  - Added live version polling and 1-click header reload in `popup/popup.js`.
- **Automatic Diagnostics**:
  - Added automatic stack trace analysis on paste and live debounced typing.
  - Added error-to-stack auto-population on tab switch.

### Changed & Improved
- **Modern UI Overhaul**:
  - Redesigned Report tab with responsive action cards for Markdown and JSON exports.
  - Added 1-click clipboard copy with dynamic visual feedback (`Copied!`).
  - Replaced bulky buttons with cohesive dark-mode design system (`#0B1120`, `#131E32`, cyan `#38BDF8`).
  - Redesigned telemetry strip into a 2-tier responsive layout to prevent tag cutting or horizontal clipping.
  - Added vector SVG icons across all navigation tabs and toolbar actions.
  - Upgraded empty states with glowing indicator badges.
- **GitHub API Rate-Limit Resilience**:
  - Added in-memory caching (`_GITHUB_CACHE`) in `backend/app/analyzers/github_analyzer.py` to prevent burning through GitHub's unauthenticated quota (60 req/hr).
  - Removed aggressive auto-auditing on tab switch.
  - Added graceful fallback profiles for high-traffic reference repositories.

### Removed
- Removed manual `JS Sample` and `Python Sample` buttons in the Stack Trace parser in favor of automated active-page error detection.

---

## [v0.1.0] - 2026-09-17

### Added
- **Initial Vertical Slice Release**:
  - Chromium Extension (Manifest V3) with background service worker, active-tab scoped storage, and content collector.
  - Local Python FastAPI analysis engine (`backend/app/main.py`) with zero-dependency SQLite persistence.
  - Deterministic JavaScript runtime error analyzer (`error_analyzer.py`).
  - HTTP status and CORS latency analyzer (`network_analyzer.py`).
  - V8 and Python Traceback call stack parser (`stacktrace_analyzer.py`).
  - Language-aware GitHub repository structure auditor (`github_analyzer.py`).
  - CSP-compliant interactive test sandbox harness (`extension/sandbox/`).
  - Documentation suite (`brain/PRD.md`, `brain/SRS.md`, `brain/TRD.md`, `brain/DEPLOYMENT.md`).
