"""Common helper utilities."""

from typing import Any


def safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def truncate(text: str, max_len: int = 100) -> str:
    return text[:max_len] + "…" if len(text) > max_len else text


def dict_diff(old: dict, new: dict) -> dict:
    """Return only the keys that changed between two dicts."""
    return {k: {"old": old.get(k), "new": v} for k, v in new.items() if old.get(k) != v}
