import asyncio
from app.core.database import async_session
from app.models.user import User
from sqlalchemy import select

async def get_otp():
    async with async_session() as db:
        user = (await db.execute(select(User).where(User.email == 'employee@example.com'))).scalar_one()
        print(user.otp_code)

asyncio.run(get_otp())
