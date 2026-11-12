"""
Post-deployment smoke test script for KrishiSetu AI.
Usage:
    python scripts/smoke.py --backend-url https://krishisetu-api.onrender.com --frontend-url https://krishisetu.vercel.app
"""

import argparse
import sys

import requests

TIMEOUT_SEC = 75  # Allows Render free tier cold-start (~45-60s)


def check_health(base: str) -> None:
    resp = requests.get(f"{base}/api/health/", timeout=TIMEOUT_SEC)
    resp.raise_for_status()
    data = resp.json()
    assert data.get("status") == "ok", f"Unexpected health payload: {data}"
    print("[PASS] GET /api/health/ -> 200 ok")


def check_recommend(base: str) -> None:
    payload = {
        "nitrogen": 90,
        "phosphorus": 42,
        "potassium": 43,
        "temperature": 20.8,
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 202.9,
    }
    resp = requests.post(
        f"{base}/api/crops/recommend/", json=payload, timeout=TIMEOUT_SEC
    )
    resp.raise_for_status()
    data = resp.json()
    recs = data.get("results", [])
    assert len(recs) == 3, f"Expected 3 recommendations, got {len(recs)}"
    top_crop = recs[0].get("crop", {}).get("name", recs[0].get("crop"))
    print(f"[PASS] POST /api/crops/recommend/ -> top={top_crop}")


def check_weather(base: str) -> None:
    resp = requests.get(
        f"{base}/api/weather/",
        params={"lat": 22.3039, "lon": 70.8022},
        timeout=TIMEOUT_SEC,
    )
    resp.raise_for_status()
    data = resp.json()
    assert "current" in data and "temperature" in data["current"], (
        f"Missing current weather: {data}"
    )
    print(f"[PASS] GET /api/weather/ -> temp={data['current']['temperature']}C")


def check_schemes(base: str) -> None:
    resp = requests.get(
        f"{base}/api/schemes/",
        params={"q": "KISAN"},
        timeout=TIMEOUT_SEC,
    )
    resp.raise_for_status()
    data = resp.json()
    results = data.get("results", [])
    assert len(results) >= 1, "Expected at least 1 scheme matching KISAN"
    print(f"[PASS] GET /api/schemes/?q=KISAN -> {len(results)} result(s)")


def check_chat(base: str) -> None:
    resp = requests.post(
        f"{base}/api/chat/",
        json={"message": "What is PM-KISAN?", "stream": False},
        timeout=TIMEOUT_SEC,
    )
    resp.raise_for_status()
    data = resp.json()
    reply_text = data.get("message") or data.get("reply")
    assert reply_text, f"Empty chat reply: {data}"
    print("[PASS] POST /api/chat/ -> non-empty reply received")


def check_frontend(url: str) -> None:
    resp = requests.get(url.rstrip("/"), timeout=TIMEOUT_SEC)
    resp.raise_for_status()
    assert "KrishiSetu" in resp.text, "Frontend HTML missing KrishiSetu title"
    print(f"[PASS] GET {url} -> 200 OK")


def main() -> int:
    parser = argparse.ArgumentParser(description="KrishiSetu AI Deployment Smoke Test")
    parser.add_argument(
        "--backend-url", required=True, help="Backend base URL (no trailing slash)"
    )
    parser.add_argument(
        "--frontend-url", required=False, help="Optional Frontend base URL"
    )
    args = parser.parse_args()

    backend = args.backend_url.rstrip("/")
    checks = [
        lambda: check_health(backend),
        lambda: check_recommend(backend),
        lambda: check_weather(backend),
        lambda: check_schemes(backend),
        lambda: check_chat(backend),
    ]
    if args.frontend_url:
        checks.append(lambda: check_frontend(args.frontend_url))

    for fn in checks:
        fn()

    print("\nAll smoke checks passed!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
