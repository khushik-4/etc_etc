import json, os
from datetime import date, datetime, time, timedelta
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

D = Path(os.getenv("DATA_DIR", Path(__file__).parent / "data"))
LON = ZoneInfo("Europe/London")
FIRST, LAST = date(2026, 1, 2), date(2026, 2, 1)  # delivery days for decisions made 1-31 Jan

def load(name, times):
    df = pd.DataFrame(json.loads((D / name).read_text()))
    for c in times:
        df[c] = pd.to_datetime(df[c], utc=True)
    return df

act = load("actuals.json", ["startTime"]).drop_duplicates("startTime")
# WINDFOR is hourly, FUELHH half-hourly: compare per hour, using the mean of the two half-hours.
act["startTime"] = act.startTime.dt.floor("60min")
act = act.groupby("startTime", as_index=False).agg(generation=("generation", "mean"), n=("generation", "size"))
act = act[act.n == 2][["startTime", "generation"]]
fc = load("forecasts.json", ["startTime", "publishTime"])
app = FastAPI(title="Wind forecast desk")

def cutoff_utc(day, hhmm):
    h, m = map(int, hhmm.split(":"))
    return datetime.combine(day - timedelta(days=1), time(h, m), tzinfo=LON)

def pick(day, hhmm):
    """Per target time on `day`: latest forecast published at or before the cutoff on D-1."""
    cut = cutoff_utc(day, hhmm)
    start = datetime.combine(day, time(0), tzinfo=LON)
    end = start + timedelta(days=1)
    f = fc[(fc.publishTime <= cut) & (fc.startTime >= start) & (fc.startTime < end)]
    f = f.sort_values("publishTime").drop_duplicates("startTime", keep="last")
    a = act[(act.startTime >= start) & (act.startTime < end)]
    df = f.rename(columns={"generation": "forecast"})[["startTime", "publishTime", "forecast"]].merge(
        a.rename(columns={"generation": "actual"})[["startTime", "actual"]], on="startTime", how="outer")
    return df.sort_values("startTime"), cut

def metrics(df):
    d = df.dropna(subset=["forecast", "actual"])
    if d.empty:
        return None
    e = d.forecast - d.actual
    return {"n": len(d), "mae": e.abs().mean(), "rmse": (e ** 2).mean() ** 0.5, "bias": e.mean(),
            "p90": e.abs().quantile(0.9), "mean_actual": d.actual.mean()}

def rows(df):
    return json.loads(df.to_json(orient="records", date_format="iso"))

def check(day, cutoff):
    if not FIRST <= day <= LAST:
        raise HTTPException(400, f"date must be between {FIRST} and {LAST}")
    try:
        h, m = map(int, cutoff.split(":")); time(h, m)
    except Exception:
        raise HTTPException(400, "cutoff must be HH:MM")

@lru_cache(maxsize=16)
def accuracy_all(cutoff):
    frames, daily = [], []
    d = FIRST
    while d <= LAST:
        df, _ = pick(d, cutoff)
        frames.append(df)
        m = metrics(df)
        if m: daily.append({"day": str(d), **m})
        d += timedelta(days=1)
    j = fc[(fc.publishTime >= "2026-01-01") & (fc.publishTime < "2026-02-01")].merge(
        act.rename(columns={"generation": "actual"})[["startTime", "actual"]], on="startTime")
    j["h"] = (j.startTime - j.publishTime).dt.total_seconds() / 3600
    j = j[j.h >= 0].copy()
    j["bucket"] = pd.cut(j.h, [0, 6, 12, 24, 36, 48, 1e9], right=False,
                         labels=["0-6h", "6-12h", "12-24h", "24-36h", "36-48h", "48h+"])
    j["ae"] = (j.generation - j.actual).abs()
    hz = j.groupby("bucket", observed=True).ae.agg(mae="mean", n="size").reset_index()
    hz["bucket"] = hz.bucket.astype(str)
    return {"summary": metrics(pd.concat(frames)), "daily": daily, "horizon": rows(hz)}

@app.get("/api/health")
def health():
    return {"ok": True}

@app.get("/api/meta")
def meta():
    return {"first": str(FIRST), "last": str(LAST), "default_cutoff": "09:00", "tz": "Europe/London"}

@app.get("/api/day")
def day(date: date, cutoff: str = "09:00"):
    check(date, cutoff)
    df, cut = pick(date, cutoff)
    s = accuracy_all(cutoff)["summary"]
    pub = df.publishTime.dropna()
    return {"cutoff_utc": cut.astimezone(ZoneInfo("UTC")).isoformat(),
            "published_from": pub.min().isoformat() if len(pub) else None,
            "published_to": pub.max().isoformat() if len(pub) else None,
            "p90": s["p90"] if s else None, "points": rows(df.drop(columns="publishTime"))}

@app.get("/api/accuracy")
def accuracy(cutoff: str = "09:00"):
    check(FIRST, cutoff)
    return accuracy_all(cutoff)

dist = Path(__file__).parent.parent / "frontend" / "dist"
if dist.exists():
    app.mount("/", StaticFiles(directory=dist, html=True), name="ui")
