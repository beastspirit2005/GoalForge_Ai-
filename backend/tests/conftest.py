import asyncio
import pytest
from app.core.database import create_tables

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Automatically set up database tables for the entire test session."""
    asyncio.run(create_tables())


@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    """Ensure FastAPI dependency overrides are cleared before and after every test."""
    from app.main import app
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()

