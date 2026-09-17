# DevLens - Deployment & Distribution Plan

## 1. Overview
DevLens can be deployed and used in two modes:
1. **Zero-Setup Mode (Default)**: The Chromium Extension runs completely standalone inside Google Chrome, Microsoft Edge, Brave, and Opera. It includes a built-in analysis engine (`internal_engine.js`) requiring **no Python installation, no batch files, and no server configuration**.
2. **Enhanced Server Mode (Optional)**: An optional lightweight Python FastAPI daemon running locally on `http://127.0.0.1:8000` to persist SQLite audit history across browser restarts.

---

## 2. Browser Extension Deployment

### 2.1 Local Developer / End-User Installation (Unpacked Mode)
This method requires zero compilation or build tooling:
1. Download or clone DevLens onto your machine.
2. Open your Chromium browser (Chrome / Edge / Brave / Opera).
3. Navigate to `chrome://extensions` (or `edge://extensions`).
4. Toggle on **Developer mode** in the top right corner.
5. Click **Load unpacked**.
6. Select the `extension/` folder inside your cloned DevLens repository (e.g. `<path_to_repo>/extension`).
7. DevLens is immediately live! Pin the extension to your toolbar or press **F12** to open the **DevLens** panel in Chrome Developer Tools.

### 2.2 Production Packaging for Chrome Web Store
To package DevLens for public or team distribution:
1. **Prerequisite Check**:
   - Ensure `extension/manifest.json` contains semantic `version` (e.g. `0.1.1`).
   - Validate that all asset paths (icons, scripts) exist.
2. **Create Zip Archive**:
   Create a zip of the `extension` folder excluding OS metadata:
   ```powershell
   Compress-Archive -Path extension\* -DestinationPath dist\devlens-extension.zip -Force
   ```
3. **Chrome Web Store Submission**:
   - Navigate to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
   - Pay one-time developer registration fee ($5).
   - Upload `dist\devlens-extension.zip`.
   - Provide Privacy Policy declaration:
     - Disclose that diagnostic data remains local to the user's browser and loopback interface (`http://127.0.0.1`).
     - No personal data or browsing history is collected or transmitted off-device.
   - Submit for automated and manual store review.

---

## 3. Local Python Backend Deployment

### 3.1 Local Workstation Setup (Virtual Environment)
1. **Create and activate Python virtual environment**:
   ```powershell
   cd backend
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
