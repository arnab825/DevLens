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

## ⚡ Quick Start (Zero Setup Required!)

DevLens features a **built-in browser diagnostics engine** (`internal_engine.js`) that runs 100% locally in your browser with **no terminal, no Git, and no Python required**.

---

### 📦 Option A: Install from Downloaded Release `.zip` (Recommended for Users)

If you downloaded the pre-packaged zip from [GitHub Releases](https://github.com/arnab825/DevLens/releases):

1. **Download the Latest Release**:
   - Go to [GitHub Releases](https://github.com/arnab825/DevLens/releases/latest).
   - Under **Assets**, click to download the release zip: **`devlens-v*.zip`** (e.g. `devlens-v0.1.1.zip`).
   - *(Note: Do not download the auto-generated "Source code.zip" as it contains backend and testing files not needed for running the extension).*
2. **Extract the Archive**:
   - Locate the downloaded zip file in your `Downloads` folder.
   - Right-click the file and select **Extract All...** (or unzip it with any tool).
   - Extract it into any folder (e.g. `Downloads\devlens`).
   - *Verification*: Inside the extracted folder, you will see `manifest.json`, `popup/`, `devtools/`, and `icons/`.
3. **Open Extensions in Chromium**:
   - Open Google Chrome, Brave, Microsoft Edge, or Opera.
   - Navigate to `chrome://extensions` (or `edge://extensions` / `brave://extensions`).
4. **Enable Developer Mode**:
   - Switch on the **Developer mode** toggle in the top-right corner.
5. **Load Unpacked**:
   - Click the **Load unpacked** button in the top-left corner.
   - Select the folder containing `manifest.json`.
6. 🎉 **Done!** DevLens will appear in your toolbar and inside Chrome DevTools (`F12`).

---

### 💻 Option B: Install from Git Clone (For Developers)

If you prefer cloning the Git repository:

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/arnab825/DevLens.git
   ```
2. **Open Extensions**:
   - Navigate to `chrome://extensions` in your browser.
   - Toggle on **Developer mode** (top-right).
3. **Load Unpacked**:
   - Click **Load unpacked** (top-left).
   - Select the **`extension/`** folder located inside your cloned repository directory.
4. 🎉 **Ready to use!**

---

### 🔍 Using DevLens in Chrome DevTools (`F12`)
1. Press **`F12`** (or `Ctrl+Shift+I` / `Cmd+Option+I` on macOS) on any webpage.
2. Select the **DevLens** tab in the top navigation bar of DevTools.
3. Enjoy live diagnostic triage side-by-side with your code while debugging!

---

### 🚀 Optional: Enhanced Local Server Mode (Python FastAPI)
DevLens works completely standalone out of the box. If you wish to enable persistent SQLite history logging, multi-session aggregation, and local caching across browser restarts, you can optionally run the local Python backend:

- **Windows (1-Click)**: Double-click `run_backend.bat`.
- **macOS / Linux / Terminal**:
  ```bash
  cd backend
  python -m venv venv
  source venv/bin/activate  # On Windows PowerShell: .\venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
  ```
When active, DevLens automatically detects the server on `127.0.0.1:8000` (pill turns green **Live**). When offline, DevLens seamlessly switches to its native internal browser engine (pill turns cyan **Internal Engine**).

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

## 🤝 Contributing & Security
Contributions are welcome! Please review our:
- 📖 **[Contributing Guide](CONTRIBUTING.md)** for PR workflows and testing instructions.
- 🛡️ **[Security Policy](SECURITY.md)** for responsible vulnerability reporting and privacy disclosures.
- 📜 **[Code of Conduct](CODE_OF_CONDUCT.md)** to understand community standards.

---

## ⚖️ License
DevLens is open-source software dual-licensed under:
- **[MIT License](LICENSE-MIT)** (or [LICENSE](LICENSE))
- **[Apache License 2.0](LICENSE-APACHE)**

You may choose to use either license at your discretion.

