"""Standard API response envelope."""

from typing import Any


def success(data: Any = None, message: str = "OK") -> dict:
    return {"success": True, "message": message, "data": data}


def error(message: str = "An error occurred", detail: Any = None) -> dict:
    return {"success": False, "message": message, "data": detail}


def paginated(items: list, total: int, page: int = 1, per_page: int = 20) -> dict:
    return {
        "success": True,
        "data": items,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page,
        },
    }
