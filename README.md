# DevLens 🔍
> **Privacy-First Developer Diagnostics: Browser Extension + Local Python Analysis Platform**

DevLens brings actionable diagnostic triage into the browser. It monitors runtime JavaScript exceptions, intercepts failed API calls, sanitizes sensitive tokens, parses multi-language stack traces, and audits public GitHub repositories without requiring paid cloud AI or external telemetry.

---

## 📚 Architectural & Engineering Documentation (`brain/`)
Detailed architectural blueprints and specifications are maintained in the dedicated [`brain/`](file:///e:/DevLens/brain/) directory:

- 📋 **[Product Requirements Document (PRD)](file:///e:/DevLens/brain/PRD.md)**: Goals, user personas, feature priorities, and scope boundaries.
- 📐 **[Software Requirements Specification (SRS)](file:///e:/DevLens/brain/SRS.md)**: Functional/non-functional requirements, data flows, and performance criteria.
- ⚙️ **[Technical Requirements Document (TRD)](file:///e:/DevLens/brain/TRD.md)**: System architecture, REST API contracts, SQLite schema, and security regex filters.
- 🚀 **[Deployment Plan](file:///e:/DevLens/brain/DEPLOYMENT.md)**: Unpacked extension loading, Chrome Web Store packaging, and Python binary builds.

---

## ⚡ Quick Start

### 1. Launch the Python Analysis Backend
The backend runs locally on port 8000.

**Option A (Windows 1-Click)**:
Double-click [`run_backend.bat`](file:///e:/DevLens/run_backend.bat).

**Option B (Manual Terminal)**:
```powershell
cd e:\DevLens\backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Verify the health endpoint: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 2. Load the Extension in Chromium (Chrome / Edge / Brave)
1. Open `chrome://extensions` or `edge://extensions`.
2. Toggle on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the [`extension/`](file:///e:/DevLens/extension) folder.
5. The DevLens icon will appear in your extensions bar!

### 3. Test Live in the Sandbox
Open [`test_sandbox/index.html`](file:///e:/DevLens/test_sandbox/index.html) in your browser. Click the buttons to trigger:
- `TypeError` (null property read)
- `ReferenceError`
- `401 Unauthorized` with bearer token (verifying automatic token masking)
- `CORS / Network Error`

Open the DevLens popup in your toolbar to see live diagnostics and click **Analyze** for instant explanations and suggested fixes!

---

## 🧪 Automated Testing
Run the backend test suite:
```powershell
python e:\DevLens\backend\tests\test_analyzers.py
```
Or with pytest:
```powershell
pytest e:\DevLens\backend\tests\test_analyzers.py
```

---

## 🛡️ Privacy Guarantee
DevLens is built on a **local-first** security model:
- Zero telemetry or analytics servers.
- `Authorization`, `Bearer`, `Cookie`, and passwords are automatically masked before local logging.
- Everything runs on your machine (`127.0.0.1`).
