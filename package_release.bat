@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     DevLens Production Release and Packaging Tool
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
    set /p PUSH_GH="Do you want to automatically commit, tag, and publish to GitHub? (y/n): "
    if /i "!PUSH_GH!"=="y" (
        git add -A
        git commit -m "Release v%NEW_VER%"
        git tag -a v%NEW_VER% -m "Release v%NEW_VER%"
        git push origin main --tags
        echo.
        echo [*] Publishing release binaries to GitHub...
        python publish_release.py "v%NEW_VER%"
    ) else (
        echo.
        echo Manual steps if preferred:
        echo 1. git commit -am "Release v%NEW_VER%"
        echo 2. git tag v%NEW_VER%
        echo 3. git push origin main --tags
        echo 4. python publish_release.py "v%NEW_VER%"
    )
) else (
    echo [ERROR] Failed to generate zip file.
)

pause
