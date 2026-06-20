import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

async def main():
    engine = create_async_engine('postgresql+asyncpg://neondb_owner:npg_a9mcOerB2ZHt@ep-steep-credit-at0j492m-pooler.c-9.us-east-1.aws.neon.tech/neondb?ssl=require', echo=False)
    Session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with Session() as session:
        await session.execute(text("UPDATE users SET is_approved = true"))
        await session.commit()
        print("Approved all users in DB!")

asyncio.run(main())
