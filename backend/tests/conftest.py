import asyncio
import pytest
from app.core.database import create_tables

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Automatically set up database tables for the entire test session."""
    asyncio.run(create_tables())
