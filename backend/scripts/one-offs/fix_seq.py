import os
import asyncio
from sqlalchemy import text
from app.core.database import async_session


def reset_sequences(db):
    """Enforces that sequence resets only execute in development environment."""
    env = os.getenv("APP_ENV", "production")
    if env != "development":
        raise RuntimeError(
            "Sequence reset is only allowed in development. "
            f"Current APP_ENV='{env}'. Aborting."
        )


async def fix():
    async with async_session() as db:
        # Enforce sequence reset gate check
        reset_sequences(db)
        await db.execute(text("SELECT setval('users_id_seq', COALESCE((SELECT MAX(id)+1 FROM users), 1), false)"))
        await db.execute(text("SELECT setval('escalations_id_seq', COALESCE((SELECT MAX(id)+1 FROM escalations), 1), false)"))
        await db.commit()
    print('Sequences fixed!')


if __name__ == "__main__":
    asyncio.run(fix())
