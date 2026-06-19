import asyncio
from app.core.database import async_session
from app.models.user import User
from app.models.role import UserRole
from app.core.security import hash_password

async def seed_more():
    async with async_session() as session:
        # Create a Manager
        manager = User(
            name="Manager User",
            email="manager@goalforge.ai",
            password_hash=hash_password("manager"),
            role=UserRole.MANAGER.value,
            department="Engineering",
            is_active=True,
            is_approved=True
        )
        session.add(manager)
        
        # Create an Employee
        employee = User(
            name="Employee User",
            email="employee@goalforge.ai",
            password_hash=hash_password("employee"),
            role=UserRole.EMPLOYEE.value,
            department="Engineering",
            is_active=True,
            is_approved=True
        )
        session.add(employee)
        
        await session.commit()
        print("Manager and Employee users created successfully!")

if __name__ == "__main__":
    asyncio.run(seed_more())
