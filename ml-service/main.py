import os

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from database import fetch_item_sales, fetch_retailer_items, fetch_category_sales
from forecast import run_forecast, get_recommendations, get_category_trends

app = FastAPI(title="Kirana ML Service")

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ML_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/forecast/item/{item_id}")
def forecast_item(item_id: int, days: int = 30, retailer_id: int = Query(...)):
    df = fetch_item_sales(item_id, retailer_id)
    safe_days = max(1, min(days, 90))
    result = run_forecast(df, periods=safe_days)
    return result


@app.get("/recommendations/{retailer_id}")
def recommendations(retailer_id: int):
    items = fetch_retailer_items(retailer_id)
    category_sales = fetch_category_sales(retailer_id)
    result = get_recommendations(items, category_sales)
    return result


@app.get("/trends/{retailer_id}")
def trends(retailer_id: int):
    category_sales = fetch_category_sales(retailer_id)
    result = get_category_trends(category_sales)
    return result
