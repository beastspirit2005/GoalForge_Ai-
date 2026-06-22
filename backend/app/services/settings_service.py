from __future__ import annotations
import asyncio
from typing import Any
from sqlalchemy import select

from app.models.system_setting import SystemSetting
from app.core.database import async_session

class SystemSettingsCache:
    _cache: dict[str, Any] = {}
    _lock = asyncio.Lock()
    _loaded = False

    @classmethod
    async def load_all(cls) -> None:
        async with cls._lock:
            async with async_session() as session:
                result = await session.execute(select(SystemSetting))
                settings = result.scalars().all()
                cls._cache = {s.key: s.value for s in settings}
                cls._loaded = True

    @classmethod
    async def get(cls, key: str, default: Any = None) -> Any:
        if not cls._loaded:
            await cls.load_all()
        return cls._cache.get(key, default)

    @classmethod
    async def set(cls, key: str, value: str, is_public: bool = False) -> None:
        async with cls._lock:
            async with async_session() as session:
                result = await session.execute(select(SystemSetting).where(SystemSetting.key == key))
                setting = result.scalar_one_or_none()
                if setting:
                    setting.value = value
                    setting.is_public = is_public
                else:
                    setting = SystemSetting(key=key, value=value, is_public=is_public)
                    session.add(setting)
                await session.commit()
            
            cls._cache[key] = value

    @classmethod
    async def refresh(cls) -> None:
        await cls.load_all()
