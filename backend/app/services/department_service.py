from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User

async def get_department_users(db: AsyncSession, department_name: str) -> list[User]:
    """Returns all users in a given department."""
    result = await db.execute(select(User).where(User.department == department_name))
    return list(result.scalars().all())

async def get_team_hierarchy(db: AsyncSession, manager_id: int) -> list[User]:
    """Returns all users who directly or indirectly report to this manager (1 level deep for simplicity)."""
    # In a real app this would be a recursive CTE
    result = await db.execute(select(User).where(User.manager_id == manager_id))
    return list(result.scalars().all())
