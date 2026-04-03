from fastapi import FastAPI, HTTPException , Query
from fastapi.middleware.cors import CORSMiddleware
from database import fetch_item_sales, fetch_retailer_items, fetch_category_sales
from forecast import run_forecast, get_recommendations, get_category_trends

app = FastAPI(title="Kirana ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/forecast/item/{item_id}")
def forecast_item(item_id: int, days: int = 30,retailer_id:int = Query(...)):
    df = fetch_item_sales(item_id,retailer_id)
    if len(df) < 10:
        raise HTTPException(status_code=400, 
                          detail="Not enough sales data for this item")
    result = run_forecast(df, periods=days)
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
