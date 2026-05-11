from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Optional

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
    seed_member_email: str = "member@uniclub.com"
    seed_advisor_email: str = "advisor@uniclub.com"
    seed_board_email: str = "board@uniclub.com"
    seed_admin_email: str = "admin@uniclub.com"
    seed_member_password: Optional[str] = None
    seed_advisor_password: Optional[str] = None
    seed_board_password: Optional[str] = None
    seed_admin_password: Optional[str] = None

    # OAuth providers
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    microsoft_client_id: Optional[str] = None
    microsoft_client_secret: Optional[str] = None
    microsoft_tenant: str = "common"
    facebook_client_id: Optional[str] = None
    facebook_client_secret: Optional[str] = None
    oauth_redirect_base: str = "http://localhost:8000"
    oauth_frontend_redirect: str = "http://localhost:5173/oauth/callback"

    # Email / 2FA
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: str = "no-reply@uniclub.local"
    smtp_use_tls: bool = True

    # Resend HTTP API (preferred when SMTP outbound is blocked, e.g. Railway)
    resend_api_key: Optional[str] = None
    resend_from: Optional[str] = None

    # WebAuthn
    webauthn_rp_id: str = "localhost"
    webauthn_rp_name: str = "UniClub"
    webauthn_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
