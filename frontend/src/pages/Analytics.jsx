// src/pages/Analytics.jsx
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, ShoppingCart, BarChart2, RefreshCw, Clock } from "lucide-react";
import { getForecast, getRecommendations, getCategoryTrends } from "../services/mlApi";
import { api } from "../services/api";
import { LoadingState, ErrorState, EmptyState, TimestampBadge } from "../components/FeedbackState";
import "./Analytics.css";

// ─── Action config ────────────────────────────────────────────────────────────
const ACTION = {
  BUY:    { tone: "success", label: "Buy"    },
  WATCH:  { tone: "warning", label: "Watch"  },
  REDUCE: { tone: "danger",  label: "Reduce" },
  OK:     { tone: "success", label: "OK ✓"   },
  HOLD:   { tone: "warning", label: "Hold"   },
};
const ac = (a) => ACTION[a?.toUpperCase()] || ACTION.WATCH;

const TREND = {
  RISING:  { tone: "success", label: "📈 Rising"  },
  FALLING: { tone: "danger",  label: "📉 Falling" },
  STABLE:  { tone: "warning", label: "➡ Stable"   },
};
const tc = (t) => TREND[t?.toUpperCase()] || TREND.STABLE;

const toFriendlyMessage = (raw, fallback) => {
  const value = raw?.toLowerCase?.() || "";

  if (value.includes("not enough") || value.includes("sales data")) {
    return "Not enough sales history for this item yet. Add more sales and try again.";
  }

  if (value.includes("unavailable") || value.includes("service")) {
    return "ML service is temporarily unavailable. Please retry in a moment.";
  }

  if (value.includes("unauthorized") || value.includes("session expired")) {
    return "Session expired. Please log in again.";
  }

  if (value.includes("not found") || value.includes("access denied")) {
    return "This item is unavailable or no longer accessible.";
  }

  return fallback;
};

const getErrorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  const detail = err?.message ?? err?.error?.message ?? String(err ?? "");
  return detail || fallback;
};

// ─── Forecast decision card ───────────────────────────────────────────────────
function DecisionCard({ d }) {
  const cfg = ac(d.action);
  const days = Math.round(d.days_left ?? 0);
  const runwayTone = days > 14 ? "success" : days > 7 ? "warning" : "danger";
  const barPct = Math.min(100, Math.max(0, Math.round((days / 30) * 100)));

  return (
    <div className={`an-decision an-tone-${cfg.tone}`}>
      <div className="an-decision-row">
        <div>
          <div className="an-decision-name">{d.item_name}</div>
          <div className="an-decision-msg">💬 {d.message}</div>
        </div>
        <span className={`an-action-pill an-tone-${cfg.tone}`}>
          {cfg.label}
        </span>
      </div>

      <div className="an-stat-row">
        <div className="an-stat-box">
          <div className="an-stat-box-label">Daily Sales</div>
          <div className="an-stat-box-val">{d.daily_sale ?? 0}</div>
        </div>
        <div className="an-stat-box">
          <div className="an-stat-box-label">Current Stock</div>
          <div className="an-stat-box-val">{d.stock ?? 0}</div>
        </div>
        <div className="an-stat-box">
          <div className="an-stat-box-label">Days Left</div>
          <div className={`an-stat-box-val an-days-value an-tone-${runwayTone}`}>{days}</div>
        </div>
      </div>

      <div className="an-days-bar-wrap">
        <div className="an-days-bar-labels">
          <span>Stock runway</span>
          <span className={`an-days-remaining an-tone-${runwayTone}`}>{days} days remaining</span>
        </div>
        <div className="an-days-bar">
          <div className={`an-days-fill an-tone-${runwayTone}`} style={{ "--an-fill-width": `${barPct}%` }}/>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Analytics() {
  const [tab, setTab] = useState("forecast");

  const [items, setItems]       = useState([]);
  const [itemLoad, setItemLoad] = useState(false);
  const [itemErr, setItemErr]   = useState(null);

  const [selId,  setSelId]      = useState("");
  const [decision, setDecision] = useState(null);
  const [fcLoad,   setFcLoad]   = useState(false);
  const [fcErr,    setFcErr]    = useState(null);

  const [recs,    setRecs]      = useState(null);
  const [filter,  setFilter]    = useState("ALL");
  const [recLoad, setRecLoad]   = useState(false);
  const [recErr,  setRecErr]    = useState(null);

  const [trends,  setTrends]    = useState(null);
  const [trLoad,  setTrLoad]    = useState(false);
  const [trErr,   setTrErr]     = useState(null);

  const [updatedAt, setUpdatedAt] = useState({
    forecast: null,
    recs: null,
    trends: null,
  });

  const markUpdated = useCallback((section) => {
    setUpdatedAt(prev => ({ ...prev, [section]: new Date().toISOString() }));
  }, []);

  const loadItems = useCallback(async () => {
    setItemLoad(true);
    setItemErr(null);
    try {
      const res = await api.getItems();
      const list =
        res?.data?.items ??
        res?.data?.content ??
        res?.data ??
        res?.items ??
        res?.content ??
        (Array.isArray(res) ? res : []);

      const normalized = (Array.isArray(list) ? list : []).map(i => ({
        id: i.id,
        name: i.name ?? i.itemName ?? "Unknown",
      }));

      setItems(normalized);
      if (normalized.length > 0) {
        setSelId(String(normalized[0].id));
      } else {
        setSelId("");
      }
    } catch (err) {
      setItems([]);
      setSelId("");
      setItemErr(getErrorMessage(err, "Unable to load inventory items."));
    } finally {
      setItemLoad(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const fetchForecast = useCallback(async (id) => {
    if (!id) return;
    setFcLoad(true);
    setFcErr(null);
    setDecision(null);
    try {
      const data = await getForecast(id);
      setDecision(data);
      markUpdated("forecast");
    } catch (e) {
      setFcErr(getErrorMessage(e, "Unable to generate a forecast right now."));
    }
    finally { setFcLoad(false); }
  }, [markUpdated]);

  const fetchRecs = useCallback(async () => {
    setRecLoad(true);
    setRecErr(null);
    try {
      const data = await getRecommendations();
      setRecs(data);
      markUpdated("recs");
    }
    catch (e) {
      setRecErr(getErrorMessage(e, "Unable to load recommendations."));
    }
    finally {
      setRecLoad(false);
    }
  }, [markUpdated]);

  const fetchTrends = useCallback(async () => {
    setTrLoad(true);
    setTrErr(null);
    try {
      const data = await getCategoryTrends();
      setTrends(data);
      markUpdated("trends");
    }
    catch (e) {
      setTrErr(getErrorMessage(e, "Unable to load category trends."));
    }
    finally {
      setTrLoad(false);
    }
  }, [markUpdated]);

  useEffect(() => {
    if (selId) {
      fetchForecast(selId);
    }
  }, [selId, fetchForecast]);

  useEffect(() => {
    fetchRecs();
    fetchTrends();
  }, [fetchRecs, fetchTrends]);

  const refresh = () => {
    if (tab === "forecast" && selId) fetchForecast(selId);
    if (tab === "recs") fetchRecs();
    if (tab === "trends") fetchTrends();
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const buyCount    = recs?.filter(r => r.action === "BUY").length    ?? "—";
  const watchCount  = recs?.filter(r => r.action === "WATCH").length  ?? "—";
  const reduceCount = recs?.filter(r => r.action === "REDUCE").length ?? "—";
  const risingCount = trends?.filter(t => t.trend === "RISING").length ?? "—";
  const totalCats   = trends?.length ?? "—";
  const recList     = !recs ? [] : filter === "ALL" ? recs : recs.filter(r => r.action === filter);
  const maxTrendMagnitude = trends?.length
    ? Math.max(...trends.map(t => Math.abs(Number(t.growth_rate) || 0)), 1)
    : 1;
  const activeUpdatedAt = updatedAt[tab];

  const summaryCards = [
    { icon: "📦", label: "Stock Days",        value: decision ? `${Math.round(decision.days_left)}d` : "—", note: decision?.item_name || "Select an item", tone: "primary" },
    { icon: "🛒", label: "Items to Buy",      value: buyCount,    note: "High demand",       tone: "success" },
    { icon: "👁", label: "Items to Watch",    value: watchCount,  note: "Monitor stock",     tone: "warning" },
    { icon: "📉", label: "Reduce Stock",      value: reduceCount, note: "Demand falling",    tone: "danger"  },
    { icon: "📈", label: "Rising Categories", value: `${risingCount}/${totalCats}`, note: trends?.[0]?.category || "—", tone: "accent" },
  ];

  const recommendationSummary = [
    { label: "🛒 Buy", count: buyCount, tone: "success" },
    { label: "👁 Watch", count: watchCount, tone: "warning" },
    { label: "📉 Reduce", count: reduceCount, tone: "danger" },
  ];

  return (
    <div className="an-root page-shell">

      <h1 className="an-title">ML Analytics</h1>
      <p className="an-sub">AI-powered forecasts and smart recommendations for your shop</p>

      {/* Summary strip */}
      <div className="an-summary-grid">
        {summaryCards.map(s => (
          <div className={`an-summary-card an-tone-${s.tone}`} key={s.label}>
            <div className="an-summary-icon">{s.icon}</div>
            <div className="an-summary-label">{s.label}</div>
            <div className="an-summary-value">{s.value}</div>
            <div className="an-summary-note">{s.note}</div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="an-card">
        <div className="an-card-header">
          <div className="an-card-title">
            <BarChart2 size={18}/> ML Insights
          </div>
          <div className="an-header-actions">
            {activeUpdatedAt && <TimestampBadge timestamp={activeUpdatedAt} />}
            <button className="an-btn" onClick={refresh}>
              <RefreshCw size={13}/> Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="an-tabs">
          {[
            { id: "forecast", label: "Forecast",        Icon: Clock        },
            { id: "recs",     label: "Recommendations", Icon: ShoppingCart },
            { id: "trends",   label: "Trends",          Icon: TrendingUp   },
          ].map(t => (
            <button key={t.id} className={`an-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}>
              <t.Icon size={14}/> {t.label}
            </button>
          ))}
        </div>

        {/* ── FORECAST ──────────────────────────────────────────────────── */}
        {tab === "forecast" && (
          <>
            <div className="an-select-row">
              <span className="an-select-label">Select Item</span>
              <select
                className="an-select"
                value={selId}
                disabled={itemLoad || !!itemErr || items.length === 0}
                onChange={e => setSelId(e.target.value)}>
                <option value="">— Choose an item —</option>
                {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
              {selId && (
                <button className="an-btn primary" disabled={fcLoad}
                  onClick={() => fetchForecast(selId)}>
                  <RefreshCw size={13}/> Re-run
                </button>
              )}
            </div>

            {itemLoad && <LoadingState message="Loading inventory items..." compact />}
            {itemErr && (
              <ErrorState
                title="Items unavailable"
                message="Unable to fetch inventory items for forecasting."
                details={itemErr}
                onRetry={loadItems}
              />
            )}
            {!itemLoad && !itemErr && items.length === 0 && (
              <EmptyState
                title="No inventory items yet"
                description="Add inventory items first, then return here to see AI forecasts."
                compact
              />
            )}
            {!itemLoad && !itemErr && items.length > 0 && !selId && (
              <EmptyState
                title="Select an item"
                description="Choose an item above to calculate stock runway and forecast action."
                compact
              />
            )}
            {selId && fcLoad && <LoadingState message="Running forecast..." compact />}
            {selId && fcErr && (
              <ErrorState
                title="Forecast unavailable"
                message={toFriendlyMessage(fcErr, "Unable to generate a forecast right now.")}
                details={fcErr}
                onRetry={() => fetchForecast(selId)}
              />
            )}
            {decision && !fcLoad && <DecisionCard d={decision}/>}
          </>
        )}

        {/* ── RECOMMENDATIONS ───────────────────────────────────────────── */}
        {tab === "recs" && (
          <>
            {recLoad && <LoadingState message="Loading recommendations..." compact />}
            {recErr  && (
              <ErrorState
                title="Recommendations unavailable"
                message="Could not load recommendations right now."
                details={recErr}
                onRetry={fetchRecs}
              />
            )}
            {recs && !recLoad && (
              <>
                <div className="an-rec-kpi-grid">
                  {recommendationSummary.map((s) => (
                    <div key={s.label} className={`an-rec-kpi-card an-tone-${s.tone}`}>
                      <div className="an-rec-kpi-label">{s.label}</div>
                      <div className="an-rec-kpi-value">{s.count}</div>
                    </div>
                  ))}
                </div>

                <div className="an-filter-row">
                  {[
                    { key: "ALL",    label: "All"     },
                    { key: "BUY",    label: "🛒 Buy"   },
                    { key: "WATCH",  label: "👁 Watch" },
                    { key: "REDUCE", label: "📉 Reduce" },
                  ].map(f => (
                    <button key={f.key} className={`an-pill ${filter === f.key ? "active" : ""}`}
                      onClick={() => setFilter(f.key)}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {recList.length === 0
                  ? (
                    <EmptyState
                      title="No matching recommendations"
                      description="Try another filter to view recommendation opportunities."
                      compact
                    />
                  )
                  : (
                    <div className="an-rec-grid">
                      {recList.map(r => {
                        const cfg = ac(r.action);
                        return (
                          <div className={`an-rec-card an-tone-${cfg.tone}`} key={r.item_id}>
                            <div className="an-rec-head">
                              <div>
                                <div className="an-rec-name">{r.item_name}</div>
                                <div className="an-rec-cat">{r.category}</div>
                              </div>
                              <span className={`an-action-pill an-tone-${cfg.tone}`}>
                                {r.action}
                              </span>
                            </div>
                            <div className="an-rec-msg">💬 {r.message}</div>
                            <div className="an-rec-foot">
                              <span>Current stock</span>
                              <strong>{r.stock} units</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </>
            )}
          </>
        )}

        {/* ── TRENDS ────────────────────────────────────────────────────── */}
        {tab === "trends" && (
          <>
            {trLoad && <LoadingState message="Loading category trends..." compact />}
            {trErr  && (
              <ErrorState
                title="Trends unavailable"
                message="Could not load category trends right now."
                details={trErr}
                onRetry={fetchTrends}
              />
            )}
            {trends && !trLoad && (
              trends.length === 0
                ? (
                  <EmptyState
                    title="No trend data available"
                    description="Complete more transactions to generate category trend insights."
                    compact
                  />
                )
                : (
                  <div className="an-trend-list">
                    {trends.map(t => {
                      const cfg = tc(t.trend);
                      const growth = Number(t.growth_rate) || 0;
                      const magnitude = Math.abs(growth);
                      const rawBarW = Math.round((magnitude / maxTrendMagnitude) * 100);
                      const barW = magnitude === 0 ? 0 : Math.max(6, rawBarW);
                      const normalizedPct = Number.isInteger(magnitude) ? magnitude.toString() : magnitude.toFixed(1);
                      const sign = growth > 0 ? "+" : growth < 0 ? "-" : "";
                      return (
                        <div className={`an-trend-row an-tone-${cfg.tone}`} key={t.category}>
                          <div className="an-trend-top">
                            <div className="an-trend-cat">{t.category}</div>
                            <span className="an-trend-badge">
                              {cfg.label}
                            </span>
                            <div className="an-trend-pct">
                              {`${sign}${normalizedPct}%`}
                            </div>
                          </div>
                          <div className="an-bar-wrap">
                            <div className="an-bar-fill" style={{ "--an-fill-width": `${barW}%` }}/>
                          </div>
                          {t.message && <div className="an-trend-msg">💬 {t.message}</div>}
                        </div>
                      );
                    })}
                  </div>
                )
            )}
          </>
        )}

      </div>
    </div>
  );
}
