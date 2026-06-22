import asyncio
from sqlalchemy import select
from app.core.database import async_session
from app.models.user import User

async def query():
    async with async_session() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print([(u.id, u.email, u.name, u.role) for u in users])

asyncio.run(query())
