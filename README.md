# Wind forecast desk

Day-ahead decision support for UK wind. Shows the latest Elexon WINDFOR forecast available at a chosen decision time on D-1, against FUELHH actuals, with accuracy metrics for January 2026 decisions.

**Stack:** React (Vite, Recharts) + Python (FastAPI) + Docker. Data: Elexon FUELHH (fuelType WIND) and WINDFOR only.

## Layout
- `backend/fetch_data.py` downloads the data into `data/` (run once, needs internet)
- `backend/main.py` forecast selection, metrics and API (`/api/day`, `/api/accuracy`, `/api/meta`, `/api/health`)
- `frontend/` React app; `Dockerfile` builds it and serves it from FastAPI; `heroku.yml` for Heroku

## Run
```
pip install -r backend/requirements.txt
python backend/fetch_data.py
docker build -t wind-desk . && docker run -p 8000:8000 wind-desk
```
Dev: `uvicorn backend.main:app --reload` and, in `frontend/`, `npm install && npm run dev`.

## Deploy (Heroku, container stack)
```
heroku create <name> && heroku stack:set container && git push heroku main
```
Deployed link: _add here_

## Assumptions
- Decision time defaults to 09:00 UK on D-1 (the task gives none); it is adjustable in the UI.
- Forecast used = latest `publishTime` at or before the decision time. Error = forecast minus actual.
- WINDFOR is hourly and FUELHH half-hourly, so actuals are averaged to the hour (the mean of the two half-hours starting in that hour) before comparing.
- Delivery days 2 Jan to 1 Feb 2026 (decisions made in January). Timestamps are UTC, shown in UK time.

## AI usage
Built with AI assistance (Claude). Add any other tools you used.
