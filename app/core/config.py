import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Flota Mantenimiento PWA"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./flota.db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    ALLOW_SELF_REGISTER: bool = os.getenv("ALLOW_SELF_REGISTER", "true").lower() == "true"
    ALLOWED_SELF_REGISTER_ROLE: str = os.getenv("ALLOWED_SELF_REGISTER_ROLE", "CHOFER")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000")
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")
    MEDIA_MAX_UPLOAD_MB: int = int(os.getenv("MEDIA_MAX_UPLOAD_MB", "25"))
    
    # DigitalOcean Spaces / S3
    S3_BUCKET: str = os.getenv("S3_BUCKET", "")
    S3_KEY: str = os.getenv("S3_KEY", "")
    S3_SECRET: str = os.getenv("S3_SECRET", "")
    S3_ENDPOINT: str = os.getenv("S3_ENDPOINT", "")  # e.g., nyc3.digitaloceanspaces.com
    S3_REGION: str = os.getenv("S3_REGION", "nyc3")
    USE_S3: bool = os.getenv("USE_S3", "false").lower() == "true"

    class Config:
        case_sensitive = True

settings = Settings()

if settings.ENVIRONMENT.lower() == "production" and not settings.SECRET_KEY:
    raise RuntimeError("SECRET_KEY is required in production.")
