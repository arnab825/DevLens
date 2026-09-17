# DevLens - Deployment & Distribution Plan

## 1. Overview
DevLens is distributed in two components:
1. **The Chromium Browser Extension** (Runs inside Google Chrome, Microsoft Edge, Brave, Opera).
2. **The Local Python Analysis Backend** (Runs locally on the developer's workstation).

---

## 2. Browser Extension Deployment

### 2.1 Local Developer Installation (Unpacked Mode)
This method requires zero compilation or build tooling:
1. Open your Chromium browser (Chrome / Edge / Brave).
2. Navigate to `chrome://extensions` (or `edge://extensions`).
3. Toggle on **Developer mode** in the top right corner.
4. Click **Load unpacked**.
5. Select the `e:\DevLens\extension` folder.
6. The DevLens icon will appear in the browser toolbar. Pin it for easy access.

### 2.2 Production Packaging for Chrome Web Store
To package DevLens for public or team distribution:
1. **Prerequisite Check**:
   - Ensure `extension/manifest.json` contains semantic `version` (e.g. `1.0.0`).
   - Validate that all asset paths (icons, scripts) exist.
2. **Create Zip Archive**:
   Create a zip of the `extension` folder excluding OS metadata:
   ```powershell
   Compress-Archive -Path e:\DevLens\extension\* -DestinationPath e:\DevLens\devlens-extension-v1.0.0.zip -Force
   ```
3. **Chrome Web Store Submission**:
   - Navigate to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
   - Pay one-time developer registration fee ($5).
   - Upload `devlens-extension-v1.0.0.zip`.
   - Provide Privacy Policy declaration:
     - Disclose that diagnostic data remains local to the user's browser and loopback interface (`http://127.0.0.1`).
     - No personal data or browsing history is collected or transmitted off-device.
   - Submit for automated and manual store review.

---

## 3. Local Python Backend Deployment

### 3.1 Local Workstation Setup (Virtual Environment)
1. **Create and activate Python virtual environment**:
   ```powershell
   cd e:\DevLens\backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
2. **Install minimal dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```
3. **Run the server**:
   ```powershell
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

### 3.2 Single-Click Launcher Script (`run_backend.bat`)
For maximum developer convenience, provide a single-click Windows batch file (`run_backend.bat`) at the root:
```bat
@echo off
title DevLens Local Backend
echo Starting DevLens Analysis Engine on http://127.0.0.1:8000...
cd /d %~dp0backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
```

### 3.3 Standalone Binary Distribution (PyInstaller - Optional)
To distribute DevLens backend to developers without requiring them to have Python installed:
```powershell
pip install pyinstaller
pyinstaller --onefile --name devlens-engine backend/app/main.py
```
Produces a single executable `devlens-engine.exe` that runs the local diagnostic API on double-click.

---

## 4. Release Checklist
- [ ] Backend `/api/health` returns `200 OK`.
- [ ] Sanitization masks `Authorization`, `Cookie`, and tokens before storage.
- [ ] Extension works seamlessly with and without backend active (offline fallback).
- [ ] Zero build warnings in Chromium extension manager.
- [ ] All diagnostic reports export cleanly to Markdown and JSON.
