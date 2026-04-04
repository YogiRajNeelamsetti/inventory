import os
from urllib.parse import quote, urlsplit, urlunsplit

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# loads all the .env
load_dotenv()


def _resolve_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    db_url = os.getenv("DB_URL")
    db_username = os.getenv("DB_USERNAME")
    db_password = os.getenv("DB_PASSWORD")

    if db_url and db_url.startswith("jdbc:postgresql://"):
        if not db_username or db_password is None:
            raise RuntimeError(
                "DB_URL is set, but DB_USERNAME/DB_PASSWORD are missing for ML service database access."
            )

        sql_url = db_url[len("jdbc:"):]
        parts = urlsplit(sql_url)
        credentials = f"{quote(db_username)}:{quote(db_password)}@"
        netloc = f"{credentials}{parts.netloc}"
        return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))

    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT")
    db_name = os.getenv("DB_NAME")

    if all([db_user, db_password, db_host, db_port, db_name]):
        return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    raise RuntimeError(
        "Database configuration missing. Provide DATABASE_URL, or DB_URL + DB_USERNAME/DB_PASSWORD, or DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME."
    )


DATABASE_URL = _resolve_database_url()

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=int(os.getenv("DB_POOL_SIZE", "1")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "0")),
)


def fetch_item_sales(item_id: int, retailer_id: int):
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
        result = conn.execute(
            query, {"item_id": item_id, "retailer_id": retailer_id})
        df = pd.DataFrame(result.fetchall(), columns=["ds", "y"])
    return df


def fetch_retailer_items(retailer_id: int):
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
        df = pd.DataFrame(
            result.fetchall(),
            columns=["id", "name", "category", "purchase_price",
                     "selling_price", "current_stock"],
        )
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
        df = pd.DataFrame(result.fetchall(), columns=[
                          "category", "ds", "y", "profit"])
    return df
