from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

import os

db_url = settings.DATABASE_URL
# If it's a relative SQLite path and we are on Vercel or in a read-only environment, force /tmp/market.db
if db_url.startswith("sqlite") and not db_url.startswith("sqlite:////"):
    if os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV") or not os.access(".", os.W_OK):
        db_url = "sqlite:////tmp/market.db"

# Adjust sqlite engine for thread safety in dev
connect_args = {}
if db_url.startswith("sqlite"):
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
