import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.schemas.auth_schema import AdminUserUpdate
from app.services.auth_service import update_user

async def main():
    engine = create_async_engine('sqlite+aiosqlite:///backend/goalforge.db')
    async_session = async_sessionmaker(engine)
    async with async_session() as db:
        # Get admin 1 (id=903)
        res = await db.execute(select(User).where(User.id == 903))
        user = res.scalar_one()
        
        print(f"Before: AdminID = {user.admin_id}")
        
        # Simulate payload
        data = AdminUserUpdate(admin_id=919)
        dump = data.model_dump(exclude_unset=True)
        print(f"Payload dump: {dump}")
        
        await update_user(db, user, **dump)
        await db.commit()
        
        # Verify
        res2 = await db.execute(select(User).where(User.id == 903))
        user2 = res2.scalar_one()
        print(f"After: AdminID = {user2.admin_id}")

if __name__ == "__main__":
    asyncio.run(main())
