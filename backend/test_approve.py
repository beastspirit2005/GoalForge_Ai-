import asyncio
from app.core.database import async_session
from app.routes.admin_routes import approve_user
from app.services.auth_service import register_user
from app.schemas.auth_schema import RegisterRequest
from app.models.user import User
from sqlalchemy import select

async def test():
    async with async_session() as db:
        # 1. Register a new user
        req = RegisterRequest(email="test_approve_direct@example.com", password="password123", name="Direct Test")
        new_user = await register_user(db, req)
        await db.commit()
        await db.refresh(new_user)
        print("Registered user ID:", new_user.id)
        
        # 2. Get admin user
        result = await db.execute(select(User).where(User.role == "admin"))
        admin_user = result.scalars().first()
        print("Admin user ID:", admin_user.id)
        
        # 3. Approve user
        try:
            res = await approve_user(user_id=new_user.id, db=db, current_user=admin_user)
            print("SUCCESS from route:", res)
            await db.commit()
            print("SUCCESS from commit")
        except Exception as e:
            print("ERROR:", str(e))
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
