import pandas as pd
import numpy as np
import logging

try:
    from prophet import Prophet
except (ImportError, ModuleNotFoundError):
    Prophet = None

LOGGER = logging.getLogger(__name__)


def _sanitize_input(df: pd.DataFrame) -> pd.DataFrame:
    clean = df.copy()
    clean["ds"] = pd.to_datetime(clean["ds"], errors="coerce").dt.normalize()
    clean["y"] = pd.to_numeric(clean["y"], errors="coerce").fillna(0).clip(lower=0)
    clean = clean.dropna(subset=["ds"])
    clean = clean.groupby("ds", as_index=False)["y"].sum().sort_values("ds")
    return clean


def _zero_forecast(periods: int) -> dict:
    start = pd.Timestamp.utcnow().normalize() + pd.Timedelta(days=1)
    dates = pd.date_range(start=start, periods=periods, freq="D")
    rows = [
        {
            "ds": d.strftime("%Y-%m-%d"),
            "yhat": 0.0,
            "yhat_lower": 0.0,
            "yhat_upper": 0.0,
        }
        for d in dates
    ]
    return {
        "forecast": rows,
        "total_predicted": 0.0,
        "avg_daily": 0.0,
    }


def _naive_forecast(clean: pd.DataFrame, periods: int) -> dict:
    if clean.empty:
        return _zero_forecast(periods)

    history = clean.set_index("ds")["y"].asfreq("D", fill_value=0)
    window = int(min(14, max(3, len(history))))
    recent = history.tail(window)

    baseline = float(recent.mean())
    slope = 0.0
    if len(recent) >= 2:
        x = np.arange(len(recent), dtype=float)
        y = recent.to_numpy(dtype=float)
        slope = float(np.polyfit(x, y, 1)[0])
        max_drift = max(1.0, baseline * 0.15)
        slope = float(np.clip(slope, -max_drift, max_drift))

    future_dates = pd.date_range(start=history.index.max() + pd.Timedelta(days=1), periods=periods, freq="D")
    rows = []
    for i, d in enumerate(future_dates, start=1):
        yhat = max(0.0, baseline + (slope * i))
        spread = max(1.0, yhat * 0.2)
        rows.append(
            {
                "ds": d.strftime("%Y-%m-%d"),
                "yhat": round(yhat, 2),
                "yhat_lower": round(max(0.0, yhat - spread), 2),
                "yhat_upper": round(yhat + spread, 2),
            }
        )

    yhat_values = [r["yhat"] for r in rows]
    return {
        "forecast": rows,
        "total_predicted": round(float(sum(yhat_values)), 2),
        "avg_daily": round(float(np.mean(yhat_values)) if yhat_values else 0.0, 2),
    }


def _prophet_forecast(clean: pd.DataFrame, periods: int) -> dict:
    model = Prophet(
        weekly_seasonality=True,
        yearly_seasonality=False,
        daily_seasonality=False,
    )
    model.fit(clean)

    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods).copy()
    result["ds"] = result["ds"].dt.strftime("%Y-%m-%d")
    result["yhat"] = result["yhat"].clip(lower=0).round(2)
    result["yhat_lower"] = result["yhat_lower"].clip(lower=0).round(2)
    result["yhat_upper"] = result["yhat_upper"].clip(lower=0).round(2)

    return {
        "forecast": result.to_dict(orient="records"),
        "total_predicted": round(float(result["yhat"].sum()), 2),
        "avg_daily": round(float(result["yhat"].mean()), 2),
    }


def run_forecast(df: pd.DataFrame, periods: int = 30):
    periods = max(1, min(int(periods), 90))
    clean = _sanitize_input(df)

    if clean.empty:
        return _zero_forecast(periods)

    # For small datasets, a robust moving-average fallback is more stable.
    if len(clean) < 14 or Prophet is None:
        return _naive_forecast(clean, periods)

    try:
        return _prophet_forecast(clean, periods)
    except (AttributeError, RuntimeError, ValueError) as exc:
        LOGGER.warning("Prophet failed; falling back to naive forecast: %s", exc)
        return _naive_forecast(clean, periods)

def get_recommendations(items_df, sales_df):
    recommendations = []

    for _, item in items_df.iterrows():
        item_sales = sales_df[sales_df['category'] == item['category']]

        if len(item_sales) == 0:
            continue

        monthly = item_sales.groupby(
            pd.to_datetime(item_sales['ds']).dt.to_period('M')
        )['y'].sum()

        if len(monthly) >= 2:
            growth = float(monthly.iloc[-1] - monthly.iloc[0]) / float(monthly.iloc[0] + 1)
        else:
            growth = 0.0

        selling = float(item['selling_price'])
        purchase = float(item['purchase_price'])
        margin = (selling - purchase) / (selling + 1)
        score = (growth * 0.6) + (margin * 0.4)

        if score > 0.3:
            action = "Strong Buy"
            reason = f"High demand growth ({round(growth*100)}%) + good margin"
        elif score > 0.1:
            action = "Consider Buying"
            reason = f"Moderate growth with {round(margin*100)}% margin"
        elif score < -0.1:
            action = "Reduce Stock"
            reason = "Declining demand"
        else:
            action = "Maintain"
            reason = "Stable demand"

        recommendations.append({
            "item_id": int(item['id']),
            "item_name": item['name'],
            "category": item['category'],
            "action": action,
            "reason": reason,
            "growth_rate": round(growth * 100, 1),
            "profit_margin": round(margin * 100, 1),
            "current_stock": int(item['current_stock']),
            "score": round(score, 3)
        })

    recommendations.sort(key=lambda x: x['score'], reverse=True)
    return {"recommendations": recommendations}

def get_category_trends(sales_df):
    if sales_df.empty:
        return {"trends": []}

    trends = []
    for category in sales_df['category'].unique():
        cat_data = sales_df[sales_df['category'] == category].copy()
        monthly = cat_data.groupby(
            pd.to_datetime(cat_data['ds']).dt.to_period('M')
        )['y'].sum()

        if len(monthly) >= 2:
            growth = (monthly.iloc[-1] - monthly.iloc[0]) / (monthly.iloc[0] + 1)
            trend = "Rising" if growth > 0.1 else "Falling" if growth < -0.1 else "Stable"
        else:
            growth = 0
            trend = "Insufficient data"

        trends.append({
            "category": category,
            "trend": trend,
            "growth_rate": round(growth * 100, 1),
            "total_sales": round(float(cat_data['y'].sum()), 2)
        })

    trends.sort(key=lambda x: x['growth_rate'], reverse=True)
    return {"trends": trends}
