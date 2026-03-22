from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    """
    Application configuration settings.
    Credentials should not be hardcoded to avoid security leaks and allow different
    environments (development, staging, production) to use different databases seamlessly.
    """
    database_url: str = "postgresql+psycopg://postgres:password@localhost:5432/uniclub_db"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = Field(..., min_length=1)
    access_token_expire_minutes: int = 1440

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
