import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.schemas.auth_schema import AdminUserUpdate
from app.routes.admin_routes import edit_user
from app.routes.hierarchy_routes import get_my_hierarchy

async def main():
    engine = create_async_engine('sqlite+aiosqlite:///backend/goalforge.db')
    async_session = async_sessionmaker(engine)
    async with async_session() as db:
        res = await db.execute(select(User).where(User.id == 919))
        sa = res.scalar_one()
        
        # 1. Force assign admin 1 to sa
        data = AdminUserUpdate(name="Admin 1", role="admin", admin_id=919)
        await edit_user(user_id=903, data=data, db=db, current_user=sa)
        await db.commit()
        print("Assigned Admin 1 to Super Admin.")
        
        # 2. Get hierarchy for sa
        hierarchy = await get_my_hierarchy(db=db, current_user=sa)
        print(f"Hierarchy employees: {len(hierarchy['employees'])}")
        for e in hierarchy['employees']:
            print(f" - {e['name']} (role: {e['role']})")
            
if __name__ == "__main__":
    asyncio.run(main())
