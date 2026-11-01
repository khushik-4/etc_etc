import json
from datetime import datetime, timedelta
from collections import Counter

with open("data/actuals.json") as f:
    actuals = json.load(f)

with open("data/forecasts.json") as f:
    forecasts = json.load(f)

def parse(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))

# ACTUALS
actual_times = [parse(r["startTime"]) for r in actuals]
actual_counts = Counter(actual_times)

print("\n========== ACTUALS ==========")
print("Total rows:", len(actuals))
print("Earliest delivery:", min(actual_times))
print("Latest delivery:", max(actual_times))
print("Unique timestamps:", len(actual_counts))
print("Duplicate timestamps:", sum(n - 1 for n in actual_counts.values()))

expected = []
current = parse("2026-01-01T00:00:00Z")
end = parse("2026-02-03T00:00:00Z")

while current < end:
    expected.append(current)
    current += timedelta(minutes=30)

missing = [t for t in expected if t not in actual_counts]
print("Expected half-hour intervals:", len(expected))
print("Missing intervals:", len(missing))
print("First 10 missing:", missing[:10])

print("\nRows per actual delivery date:")
for day, count in sorted(Counter(t.date() for t in actual_times).items()):
    print(day, count)

# FORECASTS
delivery_times = [parse(r["startTime"]) for r in forecasts]
publish_times = [parse(r["publishTime"]) for r in forecasts]
forecast_pairs = Counter(
    (parse(r["startTime"]), parse(r["publishTime"])) for r in forecasts
)

print("\n========== FORECASTS ==========")
print("Total rows:", len(forecasts))
print("Earliest delivery:", min(delivery_times))
print("Latest delivery:", max(delivery_times))
print("Earliest publication:", min(publish_times))
print("Latest publication:", max(publish_times))
print("Unique delivery timestamps:", len(set(delivery_times)))
print("Unique publication timestamps:", len(set(publish_times)))
print("Duplicate delivery/publication pairs:",
      sum(n - 1 for n in forecast_pairs.values()))

jan_forecasts = [
    r for r in forecasts
    if parse("2026-01-01T00:00:00Z") <= parse(r["startTime"])
    < parse("2026-02-01T00:00:00Z")
]
print("Forecast rows for January delivery:", len(jan_forecasts))
print("Unique January delivery timestamps:",
      len(set(parse(r["startTime"]) for r in jan_forecasts)))
