# WINDPULSE — National Wind Generation Intelligence

A full-stack wind generation forecast monitoring and validation dashboard designed to support day-ahead electricity purchasing decisions.

**Live Demo:** https://etcetc.vercel.app/  
**GitHub Repository:** https://github.com/khushik-4/etc_etc

---

## 1. Overview

Electricity utilities must make purchasing decisions ahead of the actual delivery period. Since renewable generation depends on weather conditions, inaccurate wind generation forecasts can lead to over-procurement or under-procurement of electricity.

WINDPULSE addresses this challenge by providing a historical view of national wind generation forecasts alongside actual generation data.

The application enables users to:

- Inspect day-ahead wind generation forecasts.
- Compare predicted generation against actual generation.
- Evaluate forecast accuracy using statistical metrics.
- Analyze forecast performance across individual days.
- Understand how forecast publication lead time affects accuracy.

## 2. Key Features

### Forecast Monitoring
- Hourly visualization of forecasted and actual wind generation.
- Date selection for historical analysis.
- Configurable forecast publication cutoff.
- Comparison of forecast and actual generation in MW.

### Forecast Performance Analytics
- Mean Absolute Error (MAE).
- Root Mean Squared Error (RMSE).
- Forecast Bias.
- 90th Percentile Absolute Error (P90).
- Daily forecast accuracy analysis.
- Forecast lead-time performance analysis.

### Data & Methodology
- Elexon BMRS data integration.
- Point-in-time forecast selection.
- Historical forecast validation.
- Explanation of data processing and evaluation assumptions.

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| UI & Styling | CSS |
| Visualization | Recharts |
| Backend | Python, FastAPI |
| Data Processing | Pandas |
| Data Storage | JSON datasets |
| Deployment | Vercel |
| Containerization | Docker |

## 4. Data Sources

WINDPULSE uses two datasets from the Elexon BMRS platform.

**Actual Generation — FUELHH**

- Dataset: `FUELHH`
- Filter: `fuelType == "WIND"`
- `startTime`: Delivery timestamp.
- `generation`: Actual wind generation in MW.
- Resolution: 30 minutes.

**Forecast Generation — WINDFOR**

- Dataset: `WINDFOR`
- `startTime`: Forecast delivery timestamp.
- `publishTime`: Forecast publication timestamp.
- `generation`: Forecasted wind generation in MW.

Data is collected for the January 2026 evaluation period and its surrounding publication and delivery windows.

Data API base URL:

`https://data.elexon.co.uk/bmrs/api/v1/datasets`

API documentation:
- [FUELHH](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream)
- [WINDFOR](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream)

## 5. Methodology

### A. Hourly Actual Generation

FUELHH actual generation is available at 30-minute resolution. It is aggregated into hourly values to compare it with the hourly forecast observations.

\[
Actual_{hour} = \frac{Actual_1 + Actual_2}{2}
\]

Only hours containing both half-hour actual observations are retained.

### B. Point-in-Time Forecast Selection

To prevent look-ahead bias, the application only considers forecasts published on or before the selected cutoff on the preceding day.

For a delivery date D and cutoff time C:

1. Calculate the cutoff timestamp in the `Europe/London` timezone on D-1.
2. Filter forecasts to include only records published at or before that cutoff.
3. Group forecast records by delivery timestamp.
4. Select the latest eligible publication for each delivery hour.
5. Compare the selected forecasts against actual generation.

This ensures that forecasts published after the purchasing decision cutoff are not used in the evaluation.

### C. Error Calculation

Forecast error is defined as:

\[
Error = Forecast - Actual
\]

- Positive bias indicates overprediction.
- Negative bias indicates underprediction.

### D. Evaluation Metrics

| Metric | Description |
|---|---|
| MAE | Average absolute forecast error. |
| RMSE | Square root of mean squared forecast error. |
| Bias | Average signed forecast error. |
| P90 | 90th percentile of absolute forecast errors. |

P90 represents an empirical error threshold: 90% of evaluated observations have absolute errors at or below this value.

### E. Evaluation Window

- Decision dates: January 1–31, 2026.
- Delivery dates: January 2–February 1, 2026.
- Default forecast cutoff: 09:00 Europe/London.
- Evaluation frequency: Hourly.

## 6. Project Structure

```text
wind-desk/
│
├── backend/
│   ├── data/
│   │   ├── actuals.json
│   │   └── forecasts.json
│   ├── fetch_data.py
│   ├── main.py
│   └── requirements.txt
│
├── data/
│   ├── actuals.json
│   └── forecasts.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── Dockerfile
├── heroku.yml
├── vercel.json
├── check_data.py
├── .dockerignore
├── .gitignore
└── README.md
```

## 7. Running Locally

### Prerequisites

- Python 3.10+
- Node.js 20+
- npm

### Step 1: Clone the repository

```bash
git clone https://github.com/khushik-4/etc_etc.git
cd etc_etc
```

### Step 2: Start the backend

From the project root:

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

The backend will be available at:

`http://localhost:8000`

### Step 3: Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at the local URL printed by Vite, typically:

`http://localhost:5173`

The Vite development proxy forwards `/api` requests to the FastAPI backend.

## 8. Running with Docker

Build the Docker image from the project root:

```bash
docker build -t windpulse .
```

Run the container:

```bash
docker run -p 8000:8000 windpulse
```

Open:

`http://localhost:8000`

The Docker image uses a multi-stage build: Node.js builds the React frontend, while Python runs the FastAPI application and serves the built frontend.

## 9. API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Backend health check. |
| `GET /api/meta` | Dataset metadata and evaluation boundaries. |
| `GET /api/day?date=2026-01-15&cutoff=09:00` | Forecast and actual data for a selected delivery day. |
| `GET /api/accuracy?cutoff=09:00` | Monthly accuracy, daily metrics and forecast lead-time analysis. |

## 10. Deployment

WINDPULSE is deployed on Vercel.

**Live application:** https://etcetc.vercel.app/

The deployment uses separate frontend and backend services, with API requests routed to FastAPI and other requests routed to the Vite frontend.

## 11. Important Assumptions & Limitations

- The evaluation uses historical January 2026 data rather than a live forecasting feed.
- Actual generation is aggregated from two 30-minute observations into an hourly mean.
- Forecast eligibility is determined using the selected previous-day publication cutoff.
- The hourly aggregation assumes that the hourly forecast generation values are comparable with hourly mean actual generation.
- Forecast accuracy results depend on the retrieved dataset and its coverage.
- The data collection script does not implement API pagination; dataset completeness beyond the retrieved records is therefore not independently guaranteed.
- P90 is an empirical historical error measure, not a guaranteed upper bound on future forecast error.

## 12. Future Improvements

- Automated periodic data ingestion.
- Extended evaluation across additional months.
- Forecast uncertainty bands and probabilistic analysis.
- Additional renewable generation sources.
- More detailed forecast error analysis by time of day and weather conditions.

