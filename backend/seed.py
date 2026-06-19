import asyncio
from app.core.database import async_session
from app.schemas.auth_schema import RegisterRequest
from app.services.auth_service import register_user

async def seed():
    async with async_session() as db:
        admin = await register_user(db, RegisterRequest(name='Admin', email='admin@example.com', password='password123', role='admin', department='HQ'))
        manager = await register_user(db, RegisterRequest(name='Manager', email='manager@example.com', password='password123', role='manager', department='Sales'))
        admin.is_approved = True
        manager.is_approved = True
        await db.commit()
    print('Seeded!')

asyncio.run(seed())
