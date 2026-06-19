import asyncio
from app.core.database import async_session
from app.models.user import User
from app.models.role import UserRole
from app.core.security import hash_password

async def seed():
    async with async_session() as session:
        admin = User(
            name="Admin User",
            email="admin@goalforge.ai",
            password_hash=hash_password("admin"),
            role=UserRole.ADMIN.value,
            department="HQ",
            is_active=True,
            is_approved=True
        )
        session.add(admin)
        await session.commit()
        print("Admin user created successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
