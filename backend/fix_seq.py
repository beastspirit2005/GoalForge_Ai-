import asyncio
from sqlalchemy import text
from app.core.database import async_session

async def fix():
    async with async_session() as db:
        await db.execute(text("SELECT setval('users_id_seq', COALESCE((SELECT MAX(id)+1 FROM users), 1), false)"))
        await db.execute(text("SELECT setval('escalations_id_seq', COALESCE((SELECT MAX(id)+1 FROM escalations), 1), false)"))
        await db.commit()
    print('Sequences fixed!')

asyncio.run(fix())
