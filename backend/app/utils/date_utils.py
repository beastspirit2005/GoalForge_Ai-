"""Date and quarter utilities."""

from datetime import datetime, timezone


def current_quarter() -> str:
    now = datetime.now(timezone.utc)
    q = (now.month - 1) // 3 + 1
    return f"Q{q}-{now.year}"


def quarter_range(quarter_str: str) -> tuple[datetime, datetime]:
    """Parse 'Q2-2026' and return (start_date, end_date)."""
    parts = quarter_str.split("-")
    q = int(parts[0][1])
    year = int(parts[1])
    start_month = (q - 1) * 3 + 1
    end_month = start_month + 2

    start = datetime(year, start_month, 1, tzinfo=timezone.utc)
    if end_month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, end_month + 1, 1, tzinfo=timezone.utc)
    return start, end


def format_date(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%d %H:%M:%S")
