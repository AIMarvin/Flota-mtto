from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# pool_pre_ping is for PostgreSQL, not needed for SQLite
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args=connect_args,
    pool_pre_ping=not settings.DATABASE_URL.startswith("sqlite")
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
