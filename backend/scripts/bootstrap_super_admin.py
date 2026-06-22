import sys
import os
import asyncio
import argparse

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine, async_session
from sqlalchemy import select
from app.models.user import User

async def main():
    parser = argparse.ArgumentParser(description="Promote a user to super_admin.")
    parser.add_argument("email", type=str, help="The email of the user to promote.")
    args = parser.parse_args()

    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == args.email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"Error: User with email '{args.email}' not found.")
            return

        user.role = "super_admin"
        await session.commit()
        print(f"Success: User '{args.email}' has been promoted to super_admin.")

if __name__ == "__main__":
    asyncio.run(main())
