import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.api.deps import get_db
from main import app as fastapi_app
from app.core.config import settings
import app.models  # Ensure models are registered

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield engine
    # Drop tables
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="module")
def client() -> Generator:
    with TestClient(fastapi_app) as c:
        yield c

@pytest.fixture(autouse=True)
def override_dependency(db):
    # Keep backward-compatible register behavior inside tests
    settings.ALLOW_SELF_REGISTER = True
    settings.ALLOWED_SELF_REGISTER_ROLE = "ADMIN"
    fastapi_app.dependency_overrides[get_db] = lambda: db
    yield
    fastapi_app.dependency_overrides = {}
