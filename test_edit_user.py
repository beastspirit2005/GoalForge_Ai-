import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.schemas.auth_schema import AdminUserUpdate
from app.routes.admin_routes import edit_user
from fastapi import HTTPException

async def main():
    engine = create_async_engine('sqlite+aiosqlite:///backend/goalforge.db')
    async_session = async_sessionmaker(engine)
    async with async_session() as db:
        # Get admin 1 (id=903)
        res = await db.execute(select(User).where(User.id == 903))
        user = res.scalar_one()
        
        # Get super admin (id=919)
        res2 = await db.execute(select(User).where(User.id == 919))
        sa = res2.scalar_one()
        
        print(f"Before: AdminID = {user.admin_id}")
        
        # Simulate payload
        data = AdminUserUpdate(name="Admin 1", role="admin", admin_id=919)
        
        try:
            result = await edit_user(user_id=903, data=data, db=db, current_user=sa)
            await db.commit()
            print(f"Result from API: {result}")
        except Exception as e:
            print(f"API Error: {e}")
            
        # Verify
        res3 = await db.execute(select(User).where(User.id == 903))
        user3 = res3.scalar_one()
        print(f"After: AdminID = {user3.admin_id}")

if __name__ == "__main__":
    asyncio.run(main())
