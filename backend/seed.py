import asyncio
from app.core.database import async_session
from app.schemas.auth_schema import RegisterRequest
from app.services.auth_service import register_user

async def seed():
    async with async_session() as db:
        await register_user(db, RegisterRequest(name='Admin', email='admin@goalforge.ai', password='password123', role='admin', department='HQ'))
        await register_user(db, RegisterRequest(name='Manager', email='manager@goalforge.ai', password='password123', role='manager', department='Sales'))
        await db.commit()
    print('Seeded!')

asyncio.run(seed())
