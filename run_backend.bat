@echo off
setlocal enabledelayedexpansion
title DevLens Local Analysis Engine
color 0B

echo.
echo  =============================================================
echo    DevLens - Privacy-First Developer Diagnostics Engine
echo    Local Analysis Server: http://127.0.0.1:8000
echo    Interactive API Docs:  http://127.0.0.1:8000/docs
echo  =============================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python was not found on your PATH.
    echo Please install Python 3.10+ from https://python.org and try again.
    echo.
    pause
    exit /b 1
)

cd /d %~dp0backend

if not exist venv (
    echo [1/3] Creating isolated Python environment (venv)...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    call venv\Scripts\activate.bat
    echo [2/3] Installing lightweight dependencies...
    python -m pip install --upgrade pip --quiet
    pip install -r requirements.txt --quiet
) else (
    call venv\Scripts\activate.bat
)

echo [3/3] Engine ready. Launching FastAPI ASGI server on port 8000...
echo.
echo -------------------------------------------------------------
echo  Listening for extension diagnostics at http://127.0.0.1:8000
echo  Press Ctrl+C to stop the local engine.
echo -------------------------------------------------------------
echo.

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

pause
