import asyncio
from sqlalchemy import text
from app.core.database import async_session

async def update_phones():
    async with async_session() as db:
        await db.execute(text("UPDATE users SET phone_number = '+1234567890' WHERE email = 'employee@goalforge.ai'"))
        await db.commit()
        print("Updated")

asyncio.run(update_phones())
