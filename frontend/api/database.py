from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

import os

db_url = settings.DATABASE_URL
# Support Postgres URLs with pg8000 on Vercel
connect_args = {}
if db_url.startswith("postgres://") or db_url.startswith("postgresql://"):
    # Replace prefix for pg8000
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+pg8000://", 1)
    else:
        db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
    
    # pg8000 connection arguments: remove unsupported parameters from URL query string
    if "?" in db_url:
        base_url, query = db_url.split("?", 1)
        # We strip query parameters to avoid TypeError: connect() got an unexpected keyword argument
        db_url = base_url
    
    # Enable SSL programmatically for Neon connection stability
    import ssl
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connect_args = {"ssl_context": ssl_context}

# If it's a relative SQLite path and we are on Vercel or in a read-only environment, force /tmp/market.db
if db_url.startswith("sqlite") and not db_url.startswith("sqlite:////"):
    if os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV") or not os.access(".", os.W_OK):
        db_url = "sqlite:////tmp/market.db"
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args
)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
