# DevLens 🔍
> **Privacy-First Developer Diagnostics: Browser Extension + Local Python Analysis Platform**

[![Release](https://img.shields.io/github/v/release/arnab825/DevLens?color=38BDF8&label=release)](https://github.com/arnab825/DevLens/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE-MIT)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE-APACHE)
[![Tests](https://img.shields.io/badge/tests-passing-34D399.svg)](backend/tests/)

DevLens brings actionable diagnostic triage into the browser. It monitors runtime JavaScript exceptions, intercepts failed API calls, sanitizes sensitive tokens, parses multi-language stack traces, audits public GitHub repositories, and docks directly inside **Chrome Developer Tools (`F12`)** — with zero paid cloud subscriptions or external telemetry.

---

## 🛠️ Key Capabilities

- **F12 Chrome DevTools Dock**: Inspect errors and API failures in a dedicated full-width panel side-by-side with your code.
- **Console Runtime Error Triage**: Catch and group uncaught JavaScript exceptions, extract origin stack frames, and generate AI-heuristic remediation suggestions.
- **Network Failure Inspector**: Intercept 4xx/5xx HTTP errors, CORS violations, and authentication failures with automatic Bearer token masking.
- **Stack Trace Parser**: Paste or auto-populate V8 JavaScript or Python Traceback logs to reveal root-origin frames and call hierarchies.
- **GitHub Repository Auditor**: Language-aware structural auditing that evaluates lockfile safety, CI/CD presence, type safety, and testing maturity.
- **Diagnostic Triage Reports**: 1-click Markdown (.md) and JSON export ready to paste into GitHub Issues or Pull Requests.

---

## ⚡ Quick Start

### 1. Launch the Python Analysis Backend
The backend runs locally on port 8000:

**Option A (Windows 1-Click)**:
Double-click [`run_backend.bat`](run_backend.bat).

**Option B (Manual Terminal)**:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate   # Or source venv/bin/activate on Unix/macOS
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Verify the health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 2. Load the Extension in Chromium (Chrome / Edge / Brave / Opera)
1. Open `chrome://extensions` or `edge://extensions`.
2. Toggle on **Developer mode** (top-right corner).
3. Click **Load unpacked** (top-left).
4. Select the **`extension/`** folder inside wherever you cloned DevLens on your machine (e.g. `C:\Users\<you>\DevLens\extension` or `~/DevLens/extension`).
5. DevLens is installed and ready!

### 3. Open Chrome DevTools (`F12`)
1. Press **`F12`** on any webpage.
2. Click the **DevLens** tab in the top navigation bar.
3. Enjoy docked, real-time diagnostic triage while you code.

---

## 📚 Documentation

Detailed documentation and guides are maintained across the project:
- 📖 **[Developer & Deployment Guide](docs/GUIDE.md)**: Full architecture diagrams, local setup, DevTools usage, and release packaging.
- 📋 **[Changelog](docs/CHANGELOG.md)**: Version history, features, and UI enhancements.
- 📐 **[Product Requirements Document](brain/PRD.md)**: Personas, priorities, and MVP scope.
- ⚙️ **[Technical Requirements Document](brain/TRD.md)**: REST endpoints, SQLite schema, and security sanitization.

---

## 🧪 Automated Testing
Run the backend test suite:
```powershell
pytest backend/tests/
```

---

## 🤝 Contributing
Contributions are welcome! Please review our:
- 📖 **[Contributing Guide](CONTRIBUTING.md)** for PR workflows and testing instructions.
- 📜 **[Code of Conduct](CODE_OF_CONDUCT.md)** to understand community standards.

---

## ⚖️ License
DevLens is open-source software dual-licensed under:
- **[MIT License](LICENSE-MIT)** (or [LICENSE](LICENSE))
- **[Apache License 2.0](LICENSE-APACHE)**

You may choose to use either license at your discretion.

