import asyncio
from app.core.database import async_session
from app.models.user import User
from app.core.security import hash_password
from sqlalchemy.future import select

async def fix():
    async with async_session() as db:
        users = await db.execute(select(User))
        for user in users.scalars().all():
            if user.email == "admin@goalforge.ai":
                user.password_hash = hash_password("admin")
            elif user.email == "manager@goalforge.ai":
                user.password_hash = hash_password("manager")
            elif user.email == "employee@goalforge.ai":
                user.password_hash = hash_password("employee")
            else:
                user.password_hash = hash_password("password")
            user.is_approved = True
            user.is_active = True
        await db.commit()
        print("Passwords fixed!")

if __name__ == "__main__":
    asyncio.run(fix())
