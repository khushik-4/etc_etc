import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

/* -------------------------------------------------------------------------- */
/* Formatting & Utility Functions (Europe/London timezone)                    */
/* -------------------------------------------------------------------------- */

const hhmm = (iso) => {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const stamp = (iso) => {
  if (!iso) return "--";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDayLabel = (dateStr) => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2], 12));
      return d.toLocaleDateString("en-GB", {
        timeZone: "Europe/London",
        day: "numeric",
        month: "short",
        weekday: "short",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const n = (v) => {
  if (v == null || isNaN(v)) return "--";
  return Math.round(v).toLocaleString("en-GB");
};

const signed = (v) => {
  if (v == null || isNaN(v)) return "--";
  const rounded = Math.round(v);
  const formatted = Math.abs(rounded).toLocaleString("en-GB");
  if (rounded > 0) return `+${formatted}`;
  if (rounded < 0) return `-${formatted}`;
  return `0`;
};

/* -------------------------------------------------------------------------- */
/* Minimal Enterprise Icons                                                   */
/* -------------------------------------------------------------------------- */

const Icons = {
  Wind: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  ),
  LayoutDashboard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  BarChart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  FileText: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  RotateCcw: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/* Tooltip for Main Hourly Chart                                              */
/* -------------------------------------------------------------------------- */

const CustomForecastTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const fc = data.forecast;
  const act = data.actual;
  const hasActual = act != null;
  const diff = hasActual && fc != null ? fc - act : null;

  return (
    <div className="custom-tooltip">
      <div className="tooltip-time">{data.fullTime || data.t}</div>
      <div className="tooltip-row">
        <span className="tooltip-label">
          <span className="legend-swatch forecast-swatch"></span>
          Forecast:
        </span>
        <span className="tooltip-val" style={{ color: "var(--green-primary)" }}>
          {fc != null ? `${n(fc)} MW` : "--"}
        </span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">
          <span className="legend-swatch actual-swatch"></span>
          Actual:
        </span>
        <span className="tooltip-val" style={{ color: "var(--text-main)" }}>
          {hasActual ? `${n(act)} MW` : "Pending"}
        </span>
      </div>
      {diff != null && (
        <div className="tooltip-row" style={{ marginTop: 5, paddingTop: 5, borderTop: "1px solid var(--border-subtle)" }}>
          <span className="tooltip-label">Error:</span>
          <span className={`tooltip-error-pill ${diff >= 0 ? "over" : "under"}`}>
            {signed(diff)} MW ({diff >= 0 ? "Over" : "Under"})
          </span>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Tooltip for Daily MAE Bar Chart                                            */
/* -------------------------------------------------------------------------- */

const CustomDailyTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="custom-tooltip">
      <div className="tooltip-time">
        <span>{formatDayLabel(d.day)}</span>
        <span style={{ color: "var(--green-primary)", fontSize: "0.7rem" }}>Click to select ↗</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">MAE:</span>
        <span className="tooltip-val" style={{ color: "var(--green-primary)" }}>{n(d.mae)} MW</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">RMSE:</span>
        <span className="tooltip-val">{n(d.rmse)} MW</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Net Error:</span>
        <span className={`tooltip-error-pill ${d.bias >= 0 ? "over" : "under"}`}>
          {signed(d.bias)} MW
        </span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Tooltip for Horizon Lead-Time Bar Chart                                    */
/* -------------------------------------------------------------------------- */

const CustomHorizonTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const h = payload[0]?.payload;
  if (!h) return null;

  return (
    <div className="custom-tooltip">
      <div className="tooltip-time">Lead Time: {h.bucket}</div>
      <div className="tooltip-row">
        <span className="tooltip-label">Historical MAE:</span>
        <span className="tooltip-val" style={{ color: "var(--green-primary)" }}>{n(h.mae)} MW</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Sample Hours:</span>
        <span className="tooltip-val">{n(h.n)}</span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Application Component                                                 */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Operational state
  const [date, setDate] = useState("2026-01-15");
  const [cutoff, setCutoff] = useState("09:00");
  const [meta, setMeta] = useState({
    first: "2026-01-02",
    last: "2026-02-01",
    default_cutoff: "09:00",
    tz: "Europe/London",
  });

  // Data state
  const [day, setDay] = useState(null);
  const [acc, setAcc] = useState(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [accLoading, setAccLoading] = useState(false);
  const [dayErr, setDayErr] = useState("");
  const [accErr, setAccErr] = useState("");

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState({
    dataFeeds: true,
    aggregation: false,
    forecastSelection: false,
    errorConventions: false,
    decisionPeriod: false,
    cutoffGate: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const dayReqSeq = useRef(0);
  const accReqSeq = useRef(0);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (["overview", "performance", "methodology"].includes(hash)) {
      setActiveSection(hash);
    }
  }, []);

  const handleNavClick = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    window.location.hash = section;
  };

  // Initial metadata fetch
  useEffect(() => {
    fetch("/api/meta")
      .then((r) => (r.ok ? r.json() : Promise.reject("Failed to load meta")))
      .then((data) => {
        if (data && data.first && data.last) setMeta(data);
      })
      .catch((e) => console.warn("Could not load /api/meta", e));
  }, []);

  // Fetch day forecast
  useEffect(() => {
    const seq = ++dayReqSeq.current;
    setDayLoading(true);
    setDayErr("");

    fetch(`/api/day?date=${date}&cutoff=${cutoff}`)
      .then((r) => (r.ok ? r.json() : r.json().then((err) => Promise.reject(err.detail || "Error"))))
      .then((data) => {
        if (seq === dayReqSeq.current) {
          setDay(data);
          setDayLoading(false);
        }
      })
      .catch((err) => {
        if (seq === dayReqSeq.current) {
          setDayErr(String(err));
          setDayLoading(false);
        }
      });
  }, [date, cutoff]);

  // Fetch accuracy metrics
  useEffect(() => {
    const seq = ++accReqSeq.current;
    setAccLoading(true);
    setAccErr("");

    fetch(`/api/accuracy?cutoff=${cutoff}`)
      .then((r) => (r.ok ? r.json() : r.json().then((err) => Promise.reject(err.detail || "Error"))))
      .then((data) => {
        if (seq === accReqSeq.current) {
          setAcc(data);
          setAccLoading(false);
        }
      })
      .catch((err) => {
        if (seq === accReqSeq.current) {
          setAccErr(String(err));
          setAccLoading(false);
        }
      });
  }, [cutoff]);

  // Chart data
  const chartPoints = useMemo(() => {
    if (!day || !day.points) return [];
    return day.points.map((p) => ({
      t: hhmm(p.startTime),
      fullTime: stamp(p.startTime),
      startTime: p.startTime,
      forecast: p.forecast != null ? Math.round(p.forecast) : null,
      actual: p.actual != null ? Math.round(p.actual) : null,
    }));
  }, [day]);

  // Selected Day summary statistics
  const dayStats = useMemo(() => {
    if (!chartPoints.length) return null;
    const fVals = chartPoints.map((p) => p.forecast).filter((v) => v != null);
    const aVals = chartPoints.map((p) => p.actual).filter((v) => v != null);
    const avgF = fVals.length ? fVals.reduce((a, b) => a + b, 0) / fVals.length : null;
    const peakF = fVals.length ? Math.max(...fVals) : null;
    const avgA = aVals.length ? aVals.reduce((a, b) => a + b, 0) / aVals.length : null;
    const dayBias = avgF != null && avgA != null ? avgF - avgA : null;

    return {
      avgForecast: avgF,
      peakForecast: peakF,
      avgActual: avgA,
      dayBias,
      hasActuals: aVals.length > 0,
      actualCount: aVals.length,
    };
  }, [chartPoints]);

  const s = acc?.summary;

  const handleStepDay = (step) => {
    const cur = new Date(date);
    cur.setDate(cur.getDate() + step);
    const iso = cur.toISOString().split("T")[0];
    if (iso >= meta.first && iso <= meta.last) setDate(iso);
  };

  const isMinDate = date <= meta.first;
  const isMaxDate = date >= meta.last;
  const cutoffPresets = ["07:00", "09:00", "12:00", "16:00"];
  const isDefaultCutoff = cutoff === (meta.default_cutoff || "09:00");

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <div className="mobile-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="logo-badge">
            <Icons.Wind />
          </div>
          <span className="brand-name">WINDPULSE</span>
        </div>
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-drawer-overlay ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-badge">
            <Icons.Wind />
          </div>
          <div className="brand-text">
            <span className="brand-name">WINDPULSE</span>
            <span className="brand-tag">Wind Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-link ${activeSection === "overview" ? "active" : ""}`}
            onClick={() => handleNavClick("overview")}
          >
            <Icons.LayoutDashboard />
            <span className="nav-title">Overview</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeSection === "performance" ? "active" : ""}`}
            onClick={() => handleNavClick("performance")}
          >
            <Icons.BarChart />
            <span className="nav-title">Performance</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeSection === "methodology" ? "active" : ""}`}
            onClick={() => handleNavClick("methodology")}
          >
            <Icons.FileText />
            <span className="nav-title">Data &amp; Methodology</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="source-card">
            <div className="source-status">
              <span className="source-status-dot"></span>
              <span>Data Source: Elexon BMRS</span>
            </div>
            <div className="source-badge-sub">Settlement Archives • Jan 2026</div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="main-content">
        {/* Sticky Controls Bar */}
        <div className="workspace-control-bar">
          <div className="control-left-group">
            {/* Delivery Date */}
            <div className="control-cell">
              <label className="control-mini-label" htmlFor="delivery-date-input">
                <Icons.Calendar />
                <span>Delivery Date</span>
              </label>
              <div className="input-stepper">
                <button
                  type="button"
                  className="step-btn"
                  disabled={isMinDate}
                  onClick={() => handleStepDay(-1)}
                  title="Previous Day"
                  aria-label="Previous Day"
                >
                  <Icons.ChevronLeft />
                </button>
                <input
                  id="delivery-date-input"
                  type="date"
                  value={date}
                  min={meta.first}
                  max={meta.last}
                  onChange={(e) => setDate(e.target.value)}
                  className="control-input"
                />
                <button
                  type="button"
                  className="step-btn"
                  disabled={isMaxDate}
                  onClick={() => handleStepDay(1)}
                  title="Next Day"
                  aria-label="Next Day"
                >
                  <Icons.ChevronRight />
                </button>
              </div>
            </div>

            {/* Decision Cutoff */}
            <div className="control-cell">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <label className="control-mini-label" htmlFor="decision-cutoff-input">
                  <Icons.Clock />
                  <span>D-1 Decision Cutoff</span>
                </label>
                {isDefaultCutoff ? (
                  <span className="cutoff-status-tag default">Default: 09:00</span>
                ) : (
                  <button
                    type="button"
                    className="cutoff-reset-btn"
                    onClick={() => setCutoff(meta.default_cutoff || "09:00")}
                    title="Reset to 09:00 default"
                  >
                    <Icons.RotateCcw />
                    <span>Reset 09:00</span>
                  </button>
                )}
              </div>
              <div className="cutoff-input-row">
                <input
                  id="decision-cutoff-input"
                  type="time"
                  value={cutoff}
                  onChange={(e) => setCutoff(e.target.value)}
                  className="control-input"
                  style={{ width: "95px" }}
                />
                <div className="preset-buttons">
                  {cutoffPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`preset-btn ${cutoff === preset ? "active" : ""}`}
                      onClick={() => setCutoff(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="control-right-group">
            {dayLoading || accLoading ? (
              <div className="status-indicator loading">
                <span className="loading-spinner"></span>
                <span>Updating...</span>
              </div>
            ) : (
              <div className="status-indicator ready">
                <span className="status-dot"></span>
                <span>Jan 2026</span>
              </div>
            )}
          </div>
        </div>

        {/* Feed Error Alert */}
        {(dayErr || accErr) && (
          <div className="banner-alert">
            <Icons.AlertTriangle />
            <span>{dayErr || accErr}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 1: OVERVIEW                                               */}
        {/* ================================================================= */}
        {activeSection === "overview" && (
          <section className="view-pane" id="overview">
            {/* 4 Daily Key Figures */}
            <div className="day-highlight-deck">
              <div className="day-highlight-card accent-green">
                <span className="highlight-label">Avg Forecast</span>
                <div className="highlight-val-row">
                  <span className="highlight-val" style={{ color: "var(--green-primary)" }}>
                    {dayStats ? n(dayStats.avgForecast) : "--"}
                  </span>
                  <span className="highlight-unit">MW</span>
                </div>
              </div>

              <div className="day-highlight-card">
                <span className="highlight-label">Peak Forecast</span>
                <div className="highlight-val-row">
                  <span className="highlight-val">
                    {dayStats ? n(dayStats.peakForecast) : "--"}
                  </span>
                  <span className="highlight-unit">MW</span>
                </div>
              </div>

              <div className="day-highlight-card">
                <span className="highlight-label">Avg Actual</span>
                <div className="highlight-val-row">
                  <span className="highlight-val">
                    {dayStats && dayStats.avgActual != null ? n(dayStats.avgActual) : "Pending"}
                  </span>
                  <span className="highlight-unit">MW</span>
                </div>
              </div>

              <div className="day-highlight-card">
                <span className="highlight-label">Day Net Error</span>
                <div className="highlight-val-row">
                  <span className="highlight-val" style={{
                    color: dayStats?.dayBias != null && dayStats.dayBias > 0
                      ? "var(--amber-text)"
                      : dayStats?.dayBias != null && dayStats.dayBias < 0
                      ? "var(--blue-text)"
                      : "var(--text-main)"
                  }}>
                    {dayStats?.dayBias != null ? signed(dayStats.dayBias) : "--"}
                  </span>
                  <span className="highlight-unit">MW</span>
                  {dayStats?.dayBias != null && (
                    <span className={`mini-pill ${dayStats.dayBias > 0 ? "over" : dayStats.dayBias < 0 ? "under" : ""}`}>
                      {dayStats.dayBias > 0 ? "Over" : dayStats.dayBias < 0 ? "Under" : "0"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Hourly Profile Chart */}
            <div className="main-chart-card">
              <div className="main-chart-header">
                <div className="chart-title-wrap">
                  <h2 className="main-chart-title">Hourly Generation Profile</h2>
                  <span className="chart-date-badge">{formatDayLabel(date)}</span>
                </div>

                <div className="chart-legend-compact">
                  <div className="legend-chip">
                    <span className="legend-swatch forecast-swatch"></span>
                    <span>Forecast</span>
                  </div>
                  <div className="legend-chip">
                    <span className="legend-swatch actual-swatch"></span>
                    <span>Actual</span>
                  </div>
                </div>
              </div>

              <div className="main-chart-stage">
                {dayLoading ? (
                  <div className="chart-loading-state">
                    <span className="loading-spinner"></span>
                    <span>Loading profile...</span>
                  </div>
                ) : chartPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartPoints} margin={{ top: 10, right: 14, left: 6, bottom: 4 }}>
                      <CartesianGrid stroke="#E9EEE9" vertical={false} />
                      <XAxis
                        dataKey="t"
                        stroke="#E4EAE5"
                        tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                        interval={2}
                        tickLine={false}
                        axisLine={{ stroke: "#E4EAE5" }}
                      />
                      <YAxis
                        stroke="#E4EAE5"
                        tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                        tickFormatter={(val) => `${n(val)}`}
                        width={58}
                        tickLine={false}
                        axisLine={{ stroke: "#E4EAE5" }}
                      />
                      <Tooltip content={<CustomForecastTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        name="Forecast"
                        stroke="#246B45"
                        strokeWidth={2.2}
                        dot={false}
                        activeDot={{ r: 4.5, fill: "#246B45", stroke: "#FFFFFF", strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Actual"
                        stroke="#202B24"
                        strokeWidth={1.8}
                        dot={false}
                        connectNulls={false}
                        activeDot={{ r: 4.5, fill: "#202B24", stroke: "#FFFFFF", strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-loading-state">
                    <Icons.AlertTriangle />
                    <span>No forecast published before cutoff for this date.</span>
                  </div>
                )}
              </div>

              <div className="chart-footer-caption">
                <span>Missing actuals indicate unfinalized settlement.</span>
              </div>
            </div>

            {/* Monthly Benchmark Strip */}
            <div className="monthly-benchmark-section">
              <div className="benchmark-header-row">
                <span className="benchmark-title">Monthly Benchmark (January 2026)</span>
                <button
                  type="button"
                  className="benchmark-link-btn"
                  onClick={() => handleNavClick("performance")}
                >
                  Historical Analysis ↗
                </button>
              </div>

              <div className="benchmark-kpi-row">
                <div className="mini-kpi-card">
                  <span className="mini-kpi-label">MAE</span>
                  <div className="mini-kpi-val-row">
                    <span className="mini-kpi-val" style={{ color: "var(--green-primary)" }}>
                      {s ? n(s.mae) : "--"}
                    </span>
                    <span className="mini-kpi-unit">MW</span>
                  </div>
                </div>

                <div className="mini-kpi-card">
                  <span className="mini-kpi-label">RMSE</span>
                  <div className="mini-kpi-val-row">
                    <span className="mini-kpi-val">{s ? n(s.rmse) : "--"}</span>
                    <span className="mini-kpi-unit">MW</span>
                  </div>
                </div>

                <div className="mini-kpi-card">
                  <span className="mini-kpi-label">Bias</span>
                  <div className="mini-kpi-val-row">
                    <span className="mini-kpi-val" style={{
                      color: s && s.bias > 0
                        ? "var(--amber-text)"
                        : s && s.bias < 0
                        ? "var(--blue-text)"
                        : "var(--text-main)"
                    }}>
                      {s ? signed(s.bias) : "--"}
                    </span>
                    <span className="mini-kpi-unit">MW</span>
                  </div>
                </div>

                <div className="mini-kpi-card">
                  <span className="mini-kpi-label">P90 Absolute Error*</span>
                  <div className="mini-kpi-val-row">
                    <span className="mini-kpi-val" style={{ color: "var(--green-primary)" }}>
                      {s ? n(s.p90) : "--"}
                    </span>
                    <span className="mini-kpi-unit">MW</span>
                  </div>
                </div>
              </div>

              <div className="p90-disclaimer-note">
                *Empirical 90th percentile across January 2026 records. Not a confidence interval.
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 2: PERFORMANCE                                            */}
        {/* ================================================================= */}
        {activeSection === "performance" && (
          <section className="view-pane" id="performance">
            <div className="pane-header">
              <h2 className="pane-title">Historical Performance (January 2026)</h2>
              <span className="pane-meta-pill">Cutoff: {cutoff} UK</span>
            </div>

            <div className="perf-charts-grid">
              {/* Daily MAE Chart */}
              <div className="perf-chart-card">
                <div className="perf-chart-head">
                  <h3 className="perf-chart-title">Daily MAE (MW)</h3>
                  <span className="chart-tip">Click bar to select day</span>
                </div>

                <div className="perf-chart-stage">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={acc?.daily || []} margin={{ top: 6, right: 6, left: -10, bottom: 2 }}>
                      <CartesianGrid stroke="#E9EEE9" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tickFormatter={(d) => d.slice(8)}
                        stroke="#E4EAE5"
                        tick={{ fill: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                        interval={2}
                        tickLine={false}
                        axisLine={{ stroke: "#E4EAE5" }}
                      />
                      <YAxis
                        stroke="#E4EAE5"
                        tick={{ fill: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                        tickFormatter={(v) => `${n(v)}`}
                        width={48}
                        tickLine={false}
                        axisLine={{ stroke: "#E4EAE5" }}
                      />
                      <Tooltip content={<CustomDailyTooltip />} />
                      <Bar
                        dataKey="mae"
                        name="MAE"
                        fill="#6F987C"
                        radius={[2, 2, 0, 0]}
                        isAnimationActive={false}
                        cursor="pointer"
                        onClick={(entry) => {
                          if (entry && entry.day) {
                            setDate(entry.day);
                            setActiveSection("overview");
                            window.location.hash = "overview";
                          }
                        }}
                      >
                        {(acc?.daily || []).map((entry, index) => (
                          <Cell
                            key={`daily-cell-${index}`}
                            fill={entry.day === date ? "#246B45" : "#6F987C"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Lead-Time Chart */}
              <div className="perf-chart-card">
                <div className="perf-chart-head">
                  <h3 className="perf-chart-title">MAE by Publication Lead Time (MW)</h3>
                </div>

                <div className="perf-chart-stage">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={acc?.horizon || []} margin={{ top: 6, right: 6, left: -10, bottom: 2 }}>
                      <CartesianGrid stroke="#E9EEE9" vertical={false} />
                      <XAxis
                        dataKey="bucket"
                        stroke="#E4EAE5"
                        tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                        tickLine={false}
                        axisLine={{ stroke: "#E4EAE5" }}
                      />
                      <YAxis
                        stroke="#E4EAE5"
                        tick={{ fill: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                        tickFormatter={(v) => `${n(v)}`}
                        width={48}
                        tickLine={false}
                        axisLine={{ stroke: "#E4EAE5" }}
                      />
                      <Tooltip content={<CustomHorizonTooltip />} />
                      <Bar
                        dataKey="mae"
                        name="MAE"
                        fill="#6F987C"
                        radius={[2, 2, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Accuracy Table */}
            <div className="perf-table-card">
              <div className="perf-table-head">
                <h3 className="perf-table-title">Summary Statistics</h3>
              </div>

              <div className="wind-table-wrapper">
                <table className="wind-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Observed Value</th>
                      <th>Definition</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="metric-name">Mean Absolute Error (MAE)</td>
                      <td className="metric-val" style={{ color: "var(--green-primary)" }}>
                        {s ? `${n(s.mae)} MW` : "--"}
                      </td>
                      <td className="metric-desc">Average absolute miss per delivery hour.</td>
                    </tr>
                    <tr>
                      <td className="metric-name">Root Mean Square Error (RMSE)</td>
                      <td className="metric-val">{s ? `${n(s.rmse)} MW` : "--"}</td>
                      <td className="metric-desc">Quadratic error penalizing large deviations.</td>
                    </tr>
                    <tr>
                      <td className="metric-name">Forecast Bias</td>
                      <td className="metric-val" style={{
                        color: s && s.bias > 0
                          ? "var(--amber-text)"
                          : s && s.bias < 0
                          ? "var(--blue-text)"
                          : "var(--text-main)"
                      }}>
                        {s ? `${signed(s.bias)} MW` : "--"}
                      </td>
                      <td className="metric-desc">
                        {s && s.bias > 0 ? "Positive bias: Overprediction on average." : s && s.bias < 0 ? "Negative bias: Underprediction on average." : "Unbiased."}
                      </td>
                    </tr>
                    <tr>
                      <td className="metric-name">90th Percentile Abs Error (P90)</td>
                      <td className="metric-val" style={{ color: "var(--green-primary)" }}>
                        {s ? `${n(s.p90)} MW` : "--"}
                      </td>
                      <td className="metric-desc">90% of hours missed by less than this threshold.</td>
                    </tr>
                    <tr>
                      <td className="metric-name">Mean Actual Generation</td>
                      <td className="metric-val">{s ? `${n(s.mean_actual)} MW` : "--"}</td>
                      <td className="metric-desc">Average actual GB wind output.</td>
                    </tr>
                    <tr>
                      <td className="metric-name">Evaluated Hours</td>
                      <td className="metric-val">{s ? `${n(s.n)}` : "--"}</td>
                      <td className="metric-desc">Total matched hourly settlement intervals.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 3: DATA & METHODOLOGY                                     */}
        {/* ================================================================= */}
        {activeSection === "methodology" && (
          <section className="view-pane" id="methodology">
            <div className="pane-header">
              <h2 className="pane-title">Data &amp; Methodology</h2>
            </div>

            <div className="accordion-stack">
              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-trigger"
                  onClick={() => toggleAccordion("dataFeeds")}
                >
                  <div className="accordion-title-wrap">
                    <span className="accordion-badge">Sources</span>
                    <span className="accordion-title">Elexon BMRS Data Feeds</span>
                  </div>
                  {openAccordions.dataFeeds ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                </button>
                {openAccordions.dataFeeds && (
                  <div className="accordion-content">
                    <ul className="accordion-list">
                      <li><strong>FUELHH:</strong> Half-hourly outturn generation by fuel type (filtered for <code>WIND</code>).</li>
                      <li><strong>WINDFOR:</strong> Hourly national wind generation forecasts published by the ESO.</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-trigger"
                  onClick={() => toggleAccordion("aggregation")}
                >
                  <div className="accordion-title-wrap">
                    <span className="accordion-badge">Harmonization</span>
                    <span className="accordion-title">Hourly Resolution Aggregation</span>
                  </div>
                  {openAccordions.aggregation ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                </button>
                {openAccordions.aggregation && (
                  <div className="accordion-content">
                    <p>WINDFOR forecasts are hourly; FUELHH actuals are half-hourly. Each hourly actual is the mean of its two settlement periods:</p>
                    <div className="code-formula-box">Actual_Hour = (FUELHH_HH1 + FUELHH_HH2) / 2</div>
                  </div>
                )}
              </div>

              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-trigger"
                  onClick={() => toggleAccordion("forecastSelection")}
                >
                  <div className="accordion-title-wrap">
                    <span className="accordion-badge">Selection</span>
                    <span className="accordion-title">Forecast Selection Gate</span>
                  </div>
                  {openAccordions.forecastSelection ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                </button>
                {openAccordions.forecastSelection && (
                  <div className="accordion-content">
                    <p>For each hour on day <em>D</em>, selects the forecast with latest <code>publishTime</code> at or before the decision cutoff on day <em>D-1</em>:</p>
                    <div className="code-formula-box">publishTime &le; Decision_Cutoff (Day D - 1)</div>
                  </div>
                )}
              </div>

              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-trigger"
                  onClick={() => toggleAccordion("errorConventions")}
                >
                  <div className="accordion-title-wrap">
                    <span className="accordion-badge">Convention</span>
                    <span className="accordion-title">Error Definition &amp; Sign</span>
                  </div>
                  {openAccordions.errorConventions ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                </button>
                {openAccordions.errorConventions && (
                  <div className="accordion-content">
                    <div className="code-formula-box">Error = Forecast - Actual</div>
                    <ul className="accordion-list">
                      <li><strong>Positive Error:</strong> Overprediction (Forecast &gt; Actual).</li>
                      <li><strong>Negative Error:</strong> Underprediction (Forecast &lt; Actual).</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-trigger"
                  onClick={() => toggleAccordion("decisionPeriod")}
                >
                  <div className="accordion-title-wrap">
                    <span className="accordion-badge">Period</span>
                    <span className="accordion-title">January 2026 Evaluation Window</span>
                  </div>
                  {openAccordions.decisionPeriod ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                </button>
                {openAccordions.decisionPeriod && (
                  <div className="accordion-content">
                    <p>Covers delivery dates 2 January to 1 February 2026 (decisions made 1–31 January 2026). Evaluates historical archives.</p>
                  </div>
                )}
              </div>

              <div className="accordion-item">
                <button
                  type="button"
                  className="accordion-trigger"
                  onClick={() => toggleAccordion("cutoffGate")}
                >
                  <div className="accordion-title-wrap">
                    <span className="accordion-badge">Cutoff</span>
                    <span className="accordion-title">Cutoff Assumption</span>
                  </div>
                  {openAccordions.cutoffGate ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                </button>
                {openAccordions.cutoffGate && (
                  <div className="accordion-content">
                    <p>Default cutoff is 09:00 Europe/London on day <em>D-1</em>. Configurable operational modelling assumption.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Global Footer */}
        <footer className="workspace-footer">
          <div className="footer-brand-line">
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>WINDPULSE</span>
            <span>•</span>
            <span>Elexon BMRS Settlement Archives • Jan 2026</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
