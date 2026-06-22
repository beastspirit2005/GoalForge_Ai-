import asyncio
import traceback
import os

# Set environment
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from app.core.database import create_tables
from tests.integration.test_goal_flow import test_integration_goal_lifecycle_flow

async def run():
    print("Initializing tables...")
    await create_tables()
    print("Running integration test...")
    try:
        await test_integration_goal_lifecycle_flow()
        print("Success!")
    except Exception as e:
        print("Failed with exception:")
        traceback.print_exc()

asyncio.run(run())
