import asyncio
from app.core.database import async_session
from app.models.user import User
from sqlalchemy import select

async def chk():
    async with async_session() as db:
        users = (await db.execute(select(User))).scalars().all()
        for u in users:
            print(u.email, u.phone_number)

asyncio.run(chk())
