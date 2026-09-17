import sys
import re
import json
from pathlib import Path

def bump(new_ver: str):
    root = Path(__file__).parent

    # 1. Update manifest.json
    manifest_path = root / "extension" / "manifest.json"
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    manifest["version"] = new_ver
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"[OK] Updated extension/manifest.json -> {new_ver}")

    # (popup.html and panel.html fetch version dynamically from manifest.json at runtime)

    # 3. Update backend/app/main.py FastAPI app version & /api/health
    main_py_path = root / "backend" / "app" / "main.py"
    main_content = main_py_path.read_text(encoding="utf-8")
    main_content = re.sub(r'version="[\d\.]+"', f'version="{new_ver}"', main_content)
    main_content = re.sub(r'"version": "[\d\.]+"', f'"version": "{new_ver}"', main_content)
    main_py_path.write_text(main_content, encoding="utf-8")
    print(f"[OK] Updated backend/app/main.py -> {new_ver}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python bump_version.py <new_version>")
        sys.exit(1)
    bump(sys.argv[1])
