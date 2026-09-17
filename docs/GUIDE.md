# DevLens - Step-by-Step Developer & Deployment Guide

This guide covers everything needed to use, develop, inspect, and deploy DevLens across local and production environments.

---

## 1. Architecture Overview
 
DevLens operates as a hybrid privacy-first platform that works **out-of-the-box with zero dependencies**:
```
┌──────────────────────────────────────────────────────────────────┐
│                        Chromium Browser                          │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐  │
│  │ Popup Window │   │ DevTools F12 │   │ Collector (Content)  │  │
│  │ (Toolbar)    │   │ (Dock Panel) │   │ & Background Worker  │  │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘  │
│         │                  │                      │              │
│         └───────────┬──────┴──────────────────────┘              │
│                     ▼                                            │
│        [Native Internal Engine] (Zero-Setup)                     │
│        - In-browser JS runtime error triage & remediation        │
│        - Live HTTP & CORS network inspector                      │
│        - Client-side V8 & Python call stack frame parser         │
│        - Markdown / JSON triage report generator                 │
└─────────────────────┬────────────────────────────────────────────┘
                      │ Optional Loopback (HTTP 127.0.0.1:8000)
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│           Optional: Local Python FastAPI Server                  │
│     - Persistent SQLite audit history (devlens.db)               │
│     - Cross-session multi-tab aggregation                        │
│     - GitHub Repository auditor with cache resilience            │
└──────────────────────────────────────────────────────────────────┘
```

DevLens automatically negotiates between these two modes:
1. **Zero-Setup Mode (Default)**: Uses the built-in browser engine (`internal_engine.js`). Shows a cyan **Internal Engine** status pill. No terminal, Python, or batch file required.
2. **Enhanced Server Mode (Optional)**: If `127.0.0.1:8000` is running, DevLens automatically upgrades to the server mode, displaying a green **Live** status pill and enabling SQLite database storage.

---

## 2. Using DevLens in Chrome Developer Tools (`F12`)

DevLens is integrated directly into the browser's developer console:

### Step-by-Step Instructions:
1. Open any webpage in your browser (e.g. `https://react.dev` or your local development app).
2. Press **`F12`** (or `Ctrl + Shift + I` / `Cmd + Option + I` on macOS) to open **Chrome DevTools**.
3. In the top DevTools tab bar (alongside *Elements*, *Console*, *Network*, *Application*), look for **`DevLens`**.
   *(If your screen is narrow, click the `»` overflow chevron to find DevLens).*
4. Click **DevLens**:
   - The panel opens docked to your browser viewport.
   - It automatically identifies the inspected page via `chrome.devtools.inspectedWindow`.
   - Real-time errors, failed network calls, stack traces, and repository audits are accessible in full screen while you code.

---

## 3. Running DevLens Locally

### Step 1: Start the Local Analysis Backend
From the root directory, double-click:
```cmd
.\run_backend.bat
```
- Creates a virtual environment (`venv/`) on first run if needed.
- Installs all requirements (`fastapi`, `uvicorn`, `httpx`, `pytest`).
- Starts the server on `http://127.0.0.1:8000`.
- Verify by visiting: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health).

### Step 2: Load the Extension into Chromium
1. Open Google Chrome, Brave, or Microsoft Edge.
2. Navigate to `chrome://extensions`.
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked**.
5. Select the `extension/` directory inside your cloned project (e.g. `<path_to_project>/DevLens/extension`).
6. The DevLens icon will appear in your browser toolbar.

### Step 3: Run Interactive Diagnostics
- Click **Sandbox ↗** in the DevLens header to open the built-in diagnostic test harness.
- Click **Trigger Uncaught TypeError** or **Simulate 401 Unauthorized API Call**.
- Open DevLens to view the diagnostic breakdown and suggested remediations.

---

## 4. Automated Packaging & Production Releases

DevLens has a single-command automated packaging and release tool: [`package_release.bat`](package_release.bat).

### Step-by-Step Release Workflow:
1. Open your terminal in the root repository directory and run:
   ```cmd
   .\package_release.bat
   ```
2. Enter the new semantic version (e.g., `0.2.0`).
3. The script automatically:
   - Synchronizes version numbers in `extension/manifest.json`, `extension/popup/popup.html`, and `backend/app/main.py`.
   - Executes the automated test suite (`pytest backend/tests/`).
   - Builds the production zip package into `dist/devlens-v0.2.0.zip`.
4. When prompted:
   ```
   Do you want to automatically commit, tag, and publish to GitHub? (y/n):
   ```
   - Type **`y`** to automatically push the git commit, tag the release, and trigger GitHub Actions.
   - GitHub Actions automatically compiles and publishes the release with downloadable binaries directly on GitHub: [https://github.com/arnab825/DevLens/releases](https://github.com/arnab825/DevLens/releases).

---

## 5. Summary of Recent Improvements

| Feature Area | Enhancement |
| :--- | :--- |
| **DevTools** | Native F12 docked panel with inspected window awareness. |
| **Telemetry Strip** | Two-tier responsive layout preventing badge cutting or overflow. |
| **Report Export** | Side-by-side action cards for Markdown and JSON + 1-click clipboard copy. |
| **Auto-Analyzer** | Automated analysis on paste and debounced live typing. |
| **GitHub Auditor** | In-memory caching and fallback profiles preventing 403 rate limits. |
| **CI/CD** | Automated GitHub Actions release pipeline with binary zip packaging. |
| **Auto-Updater** | In-place reload on update available + 1-click header reload. |
