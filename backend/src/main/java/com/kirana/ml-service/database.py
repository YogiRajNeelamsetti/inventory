import os
from sqlalchemy import column, create_engine, text
from sqlalchemy.engine import Engine
import pandas as pd
from dotenv import load_dotenv


# loads all the .env 
load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

engine = create_engine(DATABASE_URL)



def fetch_item_sales(item_id: int,retailer_id:int):
    query = text("""
        SELECT 
            DATE(s.sale_date) as ds, 
            SUM(si.quantity) as y
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN items i ON si.item_id = i.id
        WHERE si.item_id = :item_id
        AND i.retailer_id = :retailer_id
        AND s.sale_date >= NOW() - INTERVAL '90 days'
        GROUP BY DATE(s.sale_date)
        ORDER BY ds
                 """)

    with engine.connect() as conn:
        result = conn.execute(query,{"item_id":item_id, "retailer_id":retailer_id})
        df = pd.DataFrame(result.fetchall(),columns=['ds','y'])
    return df

def fetch_retailer_items(retailer_id:int):
  query = text("""
        SELECT 
            i.id,
            i.name,
            i.category,
            i.purchase_price,
            i.selling_price,
            i.current_stock
        FROM items i
        WHERE i.retailer_id = :retailer_id
        AND i.is_active = true
        AND i.deleted_at IS NULL
    """)
  with engine.connect() as conn:
        result = conn.execute(query, {"retailer_id": retailer_id})
        df = pd.DataFrame(result.fetchall(), 
                         columns=['id', 'name', 'category', 
                                 'purchase_price', 'selling_price', 'current_stock'])
  return df



def fetch_category_sales(retailer_id: int):
    query = text("""
        SELECT 
            i.category,
            DATE(s.sale_date) as ds,
            SUM(si.quantity) as y,
            SUM(si.profit) as profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN items i ON si.item_id = i.id
        WHERE i.retailer_id = :retailer_id
        AND s.sale_date >= NOW() - INTERVAL '90 days'
        GROUP BY i.category, DATE(s.sale_date)
        ORDER BY i.category, ds
    """)
    with engine.connect() as conn:
        result = conn.execute(query, {"retailer_id": retailer_id})
        df = pd.DataFrame(result.fetchall(), 
                         columns=['category', 'ds', 'y', 'profit'])
    return df






