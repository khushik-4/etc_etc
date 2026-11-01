"""Download Elexon FUELHH (WIND) and WINDFOR for Jan 2026 into data/*.json. Run once, needs internet."""
import json, sys
from datetime import date, timedelta
from pathlib import Path
import httpx

BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
OUT = Path(__file__).parent.parent / "data"

def get(path, params):
    for attempt in range(4):
        try:
            r = httpx.get(f"{BASE}/{path}", params=params, timeout=60)
            r.raise_for_status()
            j = r.json()
            return j["data"] if isinstance(j, dict) else j
        except Exception as e:
            print("retry", attempt, e, file=sys.stderr)
    raise SystemExit(f"failed: {path} {params}")

def days(a, b, step):
    d = a
    while d <= b:
        yield d, min(d + timedelta(days=step - 1), b)
        d += timedelta(days=step)

actuals = []
for a, b in days(date(2026, 1, 1), date(2026, 2, 2), 7):
    rows = get("FUELHH/stream", {"settlementDateFrom": a, "settlementDateTo": b, "fuelType": "WIND"})
    actuals += [{"startTime": r["startTime"], "generation": r["generation"]} for r in rows if r.get("fuelType", "WIND") == "WIND"]

forecasts = []
for a, b in days(date(2025, 12, 29), date(2026, 2, 1), 2):
    rows = get("WINDFOR/stream", {"publishDateTimeFrom": f"{a}T00:00Z", "publishDateTimeTo": f"{b + timedelta(days=1)}T00:00Z"})
    forecasts += [{k: r[k] for k in ("startTime", "publishTime", "generation")} for r in rows]

OUT.mkdir(exist_ok=True)
(OUT / "actuals.json").write_text(json.dumps(actuals))
(OUT / "forecasts.json").write_text(json.dumps(forecasts))
print(len(actuals), "actual rows;", len(forecasts), "forecast rows")
