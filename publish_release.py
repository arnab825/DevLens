import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

def publish_github_release(tag: str, token: str = None):
    root = Path(__file__).parent
    zip_name = f"devlens-{tag}.zip"
    zip_path = root / "dist" / zip_name

    if not zip_path.exists():
        # Fallback check for version format variations
        alt_path = root / "dist" / f"devlens-v{tag.lstrip('v')}.zip"
        if alt_path.exists():
            zip_path = alt_path
            zip_name = alt_path.name
        else:
            print(f"[ERROR] Release archive not found at: {zip_path}")
            sys.exit(1)

    # Resolve GitHub Token from argument, env, or user prompt
    token = token or os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        print("\n=======================================================")
        print("  GitHub API Personal Access Token Required")
        print("=======================================================")
        print("Create a token in 10 seconds at:")
        print("https://github.com/settings/tokens/new?scopes=repo&description=DevLensRelease")
        print("=======================================================\n")
        try:
            token = input("Enter GitHub Personal Access Token (classic with 'repo' scope): ").strip()
        except EOFError:
            token = ""

    if not token:
        print("[ERROR] No GitHub token provided. Cannot upload release asset via API.")
        sys.exit(1)

    repo_slug = "arnab825/DevLens"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "DevLens-Release-Tool"
    }

    # 1. Create Release object
    print(f"[*] Creating GitHub Release for tag '{tag}'...")
    create_url = f"https://api.github.com/repos/{repo_slug}/releases"
    payload = {
        "tag_name": tag,
        "name": f"DevLens {tag} - Production Diagnostics Engine",
        "body": (
            f"### DevLens {tag} Production Release\n"
            "Privacy-first Chromium extension & local analysis engine for runtime diagnostics.\n\n"
            "#### Features:\n"
            "- Real-time JavaScript runtime error triage and deduplication.\n"
            "- Failed API and HTTP status code inspection.\n"
            "- Language-aware stack trace parser (JS & Python).\n"
            "- GitHub repository health auditor.\n"
            "- 1-click Markdown (.md) and JSON export for PRs and issues.\n\n"
            "#### Quick Installation:\n"
            f"1. Download `{zip_name}` below.\n"
            "2. Extract the `.zip` archive.\n"
            "3. Open Chrome/Brave/Edge to `chrome://extensions` and enable **Developer mode**.\n"
            "4. Click **Load unpacked** and select the extracted folder.\n"
        ),
        "draft": False,
        "prerelease": False
    }

    req = urllib.request.Request(
        create_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={**headers, "Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req) as resp:
            release_data = json.loads(resp.read().decode("utf-8"))
            upload_url = release_data["upload_url"].split("{")[0]
            html_url = release_data.get("html_url", "")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        if e.code == 422 and "already_exists" in err_body:
            print(f"[*] Release for {tag} exists. Fetching existing release...")
            get_req = urllib.request.Request(f"https://api.github.com/repos/{repo_slug}/releases/tags/{tag}", headers=headers)
            with urllib.request.urlopen(get_req) as resp:
                release_data = json.loads(resp.read().decode("utf-8"))
                upload_url = release_data["upload_url"].split("{")[0]
                html_url = release_data.get("html_url", "")
        else:
            print(f"[ERROR] Failed to create release: {e.code} - {err_body}")
            sys.exit(1)

    # 2. Upload Binary Asset (.zip)
    print(f"[*] Uploading binary asset: {zip_name} ({zip_path.stat().st_size / (1024*1024):.2f} MB)...")
    target_upload_url = f"{upload_url}?name={zip_name}"
    
    with open(zip_path, "rb") as f:
        file_bytes = f.read()

    upload_req = urllib.request.Request(
        target_upload_url,
        data=file_bytes,
        headers={
            **headers,
            "Content-Type": "application/zip",
            "Content-Length": str(len(file_bytes))
        }
    )

    try:
        with urllib.request.urlopen(upload_req) as resp:
            print(f"\n=======================================================")
            print(f"  [SUCCESS] GitHub Release Published Automatically!")
            print(f"=======================================================")
            print(f"  Release URL: {html_url}")
            print(f"  Attached Asset: {zip_name}")
            print(f"=======================================================\n")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        if e.code == 422 and "already_exists" in err_body:
            print(f"[OK] Asset '{zip_name}' is already uploaded to this release.")
            print(f"Release URL: {html_url}")
        else:
            print(f"[ERROR] Failed to upload asset: {e.code} - {err_body}")
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python publish_release.py <tag> [optional_token]")
        sys.exit(1)
    tag_arg = sys.argv[1]
    token_arg = sys.argv[2] if len(sys.argv) > 2 else None
    publish_github_release(tag_arg, token_arg)
