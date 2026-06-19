"""Quick auth hash check against Postgres."""
import asyncio
import os

from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session
from app.core.security import hash_password, verify_password
from app.models.user import User


async def main() -> None:
    email = os.environ.get("CHECK_EMAIL", "employee@example.com")
    password = os.environ.get("CHECK_PASSWORD", "password123")

    print(f"DATABASE_URL={settings.DATABASE_URL[:60]}...")

    async with async_session() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print(f"FAIL: no user for {email}")
            return

        ok = verify_password(password, user.password_hash)
        print(f"User: {email}  verify_password: {ok}")

        fresh = hash_password(password)
        print(f"Fresh hash verify: {verify_password(password, fresh)}")


if __name__ == "__main__":
    asyncio.run(main())
