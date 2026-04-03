from prophet import Prophet
import pandas as pd
import numpy as np
import time

cache = {}

def run_forecast(df: pd.DataFrame, periods: int = 30):
    df['ds'] = pd.to_datetime(df['ds'])
    df['y'] = pd.to_numeric(df['y'])

    model = Prophet(
        weekly_seasonality=True,
        yearly_seasonality=False,
        daily_seasonality=False
    )
    model.fit(df)

    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
    result['ds'] = result['ds'].dt.strftime('%Y-%m-%d')
    result['yhat'] = result['yhat'].clip(lower=0).round(2)
    result['yhat_lower'] = result['yhat_lower'].clip(lower=0).round(2)
    result['yhat_upper'] = result['yhat_upper'].clip(lower=0).round(2)

    return {
        "forecast": result.to_dict(orient='records'),
        "total_predicted": round(result['yhat'].sum(), 2),
        "avg_daily": round(result['yhat'].mean(), 2)
    }

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
