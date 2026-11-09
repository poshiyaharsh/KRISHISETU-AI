"""Polite official URL link checker for curated government schemes.

Verifies HTTP reachability, records status codes, and outputs
docs/data/scheme_link_report.md.
"""

import json
import time
from pathlib import Path
import requests

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CLEAN_PATH = BASE_DIR / "data" / "schemes" / "schemes_clean.json"
REPORT_PATH = BASE_DIR / "docs" / "data" / "scheme_link_report.md"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36 KrishiSetu-AI/1.0 (LinkChecker)"
)


def check_link(url: str) -> tuple[int, str]:
    headers = {"User-Agent": USER_AGENT}
    try:
        # First try lightweight HEAD request
        resp = requests.head(url, headers=headers, timeout=8, allow_redirects=True)
        # If method not allowed (405) or forbidden (403), try GET stream
        if resp.status_code in (403, 405):
            resp = requests.get(url, headers=headers, timeout=8, stream=True, allow_redirects=True)
        return resp.status_code, "OK" if resp.ok else f"HTTP {resp.status_code}"
    except requests.exceptions.Timeout:
        return 0, "Timeout (>8s)"
    except requests.exceptions.SSLError:
        # Some state portals have legacy SSL certs
        try:
            resp = requests.get(url, headers=headers, timeout=8, stream=True, verify=False)
            return resp.status_code, "SSL Warning (Accessible)"
        except Exception as e:
            return 0, f"SSL Error: {str(e)[:40]}"
    except requests.exceptions.RequestException as e:
        return 0, f"Connection Error: {str(e)[:40]}"


def check_all_links() -> None:
    if not CLEAN_PATH.exists():
        raise FileNotFoundError(f"Clean schemes data not found at {CLEAN_PATH}")

    with open(CLEAN_PATH, "r", encoding="utf-8") as f:
        schemes = json.load(f)

    results = []
    print(f"Checking official URLs for {len(schemes)} schemes...")

    for s in schemes:
        url = s["official_url"]
        name = s["name"]
        print(f"  Checking: {name[:30]}... ({url})")
        code, status_msg = check_link(url)
        results.append({
            "source_id": s["source_id"],
            "name": name,
            "url": url,
            "status_code": code,
            "message": status_msg,
            "level": s["level"],
        })
        time.sleep(0.3)  # Polite delay

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("# Government Scheme Official Link Verification Report\n\n")
        f.write(f"> Generated: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}\n")
        f.write(f"> Total Schemes Verified: {len(results)}\n\n")
        f.write("| Source ID | Scheme Name | Official URL | HTTP Status | Assessment |\n")
        f.write("|-----------|-------------|--------------|-------------|------------|\n")
        for r in results:
            f.write(
                f"| `{r['source_id']}` | {r['name']} | [{r['url']}]({r['url']}) | "
                f"`{r['status_code']}` | {r['message']} |\n"
            )

    print(f"Link report generated -> {REPORT_PATH}")


if __name__ == "__main__":
    check_all_links()
