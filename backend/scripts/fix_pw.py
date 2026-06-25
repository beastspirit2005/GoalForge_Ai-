import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import async_session
from app.models.user import User
from sqlalchemy import update
from app.core.security import hash_password

async def main():
    async with async_session() as db:
        pw = hash_password('welcome@2029')
        await db.execute(update(User).where(User.email == 'harshit2005sharma@gmail.com').values(password_hash=pw))
        await db.commit()
        print('Password updated!')

if __name__ == '__main__':
    asyncio.run(main())
