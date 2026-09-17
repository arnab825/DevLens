@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     DevLens Production Release & Packaging Tool
echo ===================================================
echo.

set /p NEW_VER="Enter new semantic version (e.g. 0.2.0 or 1.0.0): "

if "%NEW_VER%"=="" (
    echo [ERROR] Version string cannot be empty.
    pause
    exit /b 1
)

echo.
echo [*] Upgrading version to: %NEW_VER%

:: 1. Run Python version bumper script
python bump_version.py "%NEW_VER%"
if errorlevel 1 (
    echo [ERROR] Failed to update version in project files.
    pause
    exit /b 1
)

:: 2. Run automated backend test suite
echo.
echo [*] Running automated tests...
call backend\venv\Scripts\python.exe -m pytest backend/tests/
if errorlevel 1 (
    echo [ERROR] Unit tests failed! Aborting release packaging.
    pause
    exit /b 1
)

:: 3. Package Chrome extension into production zip archive
echo.
echo [*] Packaging Chrome extension bundle...
if not exist "dist" mkdir "dist"

powershell -Command "Compress-Archive -Path 'extension\*' -DestinationPath 'dist\devlens-v%NEW_VER%.zip' -Force"

if exist "dist\devlens-v%NEW_VER%.zip" (
    echo.
    echo ===================================================
    echo  [SUCCESS] Production Release v%NEW_VER% Ready!
    echo ===================================================
    echo  Package location: dist\devlens-v%NEW_VER%.zip
    echo.
    echo  Deploy steps:
    echo  1. Chrome Web Store:
    echo     Upload 'dist\devlens-v%NEW_VER%.zip' to:
    echo     https://chrome.google.com/webstore/devconsole/
    echo.
    echo  2. Git Release Tag:
    echo     git commit -am "Release v%NEW_VER%"
    echo     git tag v%NEW_VER%
    echo     git push origin main --tags
    echo ===================================================
) else (
    echo [ERROR] Failed to generate zip file.
)

pause
