from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Add naming convention for Alembic to be able to alter constraints in SQLite
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

# SQLite needs check_same_thread=False for async usage
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args=connect_args,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db():
    """FastAPI dependency – yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            import traceback
            print(f"Exception in get_db: {e}")
            traceback.print_exc()
            await session.rollback()
            raise


async def create_tables():
    """Create all tables on startup (dev convenience). Retries up to 5 times for Docker cold starts."""
    import asyncio
    for attempt in range(1, 6):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            return
        except Exception as e:
            if attempt == 5:
                print(f"Failed to connect to database after 5 attempts: {e}")
                raise
            wait = attempt * 2
            print(f"Database connection attempt {attempt}/5 failed ({e}). Retrying in {wait}s...")
            await asyncio.sleep(wait)
