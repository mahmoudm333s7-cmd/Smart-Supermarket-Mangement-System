from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./market.db"
    JWT_SECRET: str = "supermarket-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Store settings
    STORE_NAME: str = "سوبر ماركت الذكي"
    CURRENCY: str = "جنيه"
    TAX_RATE: float = 0.0  # Percentage

    class Config:
        env_file = ".env"

settings = Settings()
